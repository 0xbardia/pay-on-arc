# Security Policy

## Supported Versions

Security fixes target the current V1 release line.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues.

Email the maintainers or use the private vulnerability reporting channel configured on GitHub, if available.

Include:

- affected route, API, or component
- reproduction steps
- potential impact
- suggested fix, if known

Do not include private keys, real API keys, webhook secrets, session cookies, or sensitive production data.

## Responsible Disclosure

We aim to acknowledge valid reports promptly, investigate impact, prepare a fix, and coordinate public disclosure after users have had time to update.

## Security Model Summary

- Wallet login uses signed nonce messages.
- Sessions are stored in httpOnly cookies.
- API keys and webhook secrets are never stored raw.
- Payment confirmation requires server-side Arc Testnet ERC-20 USDC transfer verification.
- Admin access requires a secret path and allowlisted wallet.
- Webhook URLs are validated to reduce SSRF risk.

## Out of Scope

- Social engineering.
- Physical attacks.
- Denial-of-service attacks without a practical mitigation.
- Issues in third-party wallet extensions or Arc infrastructure.
