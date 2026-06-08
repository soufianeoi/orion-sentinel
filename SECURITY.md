# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Orion Sentinel, please report it privately.

**Do not** open a public issue. Instead, email **soufianeoihi24@gmail.com** with details.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response

You can expect an acknowledgment within 48 hours and a fix timeline shortly after.

## Security Best Practices

- Never commit `.env` files or API keys to version control
- Use environment variables for all secrets
- Keep dependencies updated (`npm audit` regularly)
- Restrict CORS origins in production
- Enable rate limiting on production deployments
