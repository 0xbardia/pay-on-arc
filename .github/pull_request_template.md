## Summary

What changed and why?

## Type

- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Refactor
- [ ] Security hardening
- [ ] Chore

## Validation

- [ ] `pnpm exec prisma generate`
- [ ] `pnpm exec tsc --noEmit --pretty false`
- [ ] `pnpm lint`
- [ ] `pnpm build`

## Security Checklist

- [ ] No secrets, API keys, webhook secrets, session tokens, or private data are committed.
- [ ] User-specific data access remains scoped to the authenticated merchant.
- [ ] Payment verification and one-time link behavior are not weakened.
- [ ] Admin access remains behind the secret path and allowlist.

## Notes

Anything reviewers should pay special attention to.
