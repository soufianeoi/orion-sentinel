from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Tuple
import spacy
from transformers import pipeline
import numpy as np
from datetime import datetime
import uvicorn

app = FastAPI(title="ORION NLP Microservice", version="1.0.0")

# Load models (download on first run)
print("Loading NLP models...")
nlp = spacy.load("en_core_web_sm")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print("Models loaded.")

class TextInput(BaseModel):
    text: str
    candidate_labels: Optional[List[str]] = None

class EventInput(BaseModel):
    title: str
    excerpt: str
    content: Optional[str] = None

class GeoInput(BaseModel):
    location_name: str

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True, "timestamp": datetime.utcnow().isoformat()}

@app.post("/classify")
def classify_event(input: TextInput):
    labels = input.candidate_labels or ["conflict", "economic", "diplomatic", "cyber", "environmental"]
    result = classifier(input.text[:1024], labels)  # Truncate for performance

    best_label = result["labels"][0]
    best_score = result["scores"][0]

    return {
        "classification": best_label,
        "confidence": round(best_score, 4),
        "all_scores": {label: round(score, 4) for label, score in zip(result["labels"], result["scores"])},
    }

@app.post("/extract-entities")
def extract_entities(input: TextInput):
    doc = nlp(input.text[:5000])

    entities = {
        "persons": [ent.text for ent in doc.ents if ent.label_ == "PERSON"],
        "organizations": [ent.text for ent in doc.ents if ent.label_ in ["ORG", "GPE", "NORP"]],
        "locations": [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]],
        "dates": [ent.text for ent in doc.ents if ent.label_ == "DATE"],
        "events": [ent.text for ent in doc.ents if ent.label_ == "EVENT"],
    }

    # Remove duplicates while preserving order
    for key in entities:
        seen = set()
        entities[key] = [x for x in entities[key] if not (x in seen or seen.add(x))]

    return entities

@app.post("/sentiment")
def analyze_sentiment(input: TextInput):
    result = sentiment_analyzer(input.text[:512])[0]
    return {
        "sentiment": result["label"],
        "score": round(result["score"], 4),
        "polarity": "positive" if result["label"] == "POSITIVE" else "negative",
    }

@app.post("/enrich-event")
def enrich_event(input: EventInput):
    full_text = f"{input.title} {input.excerpt} {input.content or ''}"

    # Classification
    classification = classify_event(TextInput(text=full_text))

    # Entities
    entities = extract_entities(TextInput(text=full_text))

    # Sentiment
    sentiment = analyze_sentiment(TextInput(text=full_text))

    # Extract keywords using spaCy
    doc = nlp(full_text[:3000])
    keywords = [token.lemma_ for token in doc if token.is_alpha and not token.is_stop and len(token.text) > 3]
    keywords = list(dict.fromkeys(keywords))[:15]  # Top 15 unique keywords

    return {
        "classification": classification["classification"],
        "classification_confidence": classification["confidence"],
        "entities": entities,
        "sentiment": sentiment,
        "keywords": keywords,
        "processed_at": datetime.utcnow().isoformat(),
    }

@app.post("/geocode")
def geocode_location(input: GeoInput):
    # In production, this would call Nominatim, Google Maps, or GeoNames
    # For now, return a mock response structure
    return {
        "location": input.location_name,
        "lat": None,
        "lon": None,
        "source": "not_implemented",
        "note": "Connect to Nominatim or Google Maps API for production",
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
