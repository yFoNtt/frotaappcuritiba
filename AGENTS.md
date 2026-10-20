# Architecture Decisions

- Account initialization remains an idempotent authenticated RPC; never add triggers to the managed authentication schema.
- Protected access follows authentication → MFA → role → LGPD consent → role-specific profile completion, with administrators exempt only from profile completion.
- Email-link MFA completion requires a post-challenge JWT `amr` entry using `otp` or `magiclink`; password and OAuth sessions cannot complete the challenge.
- Administrative operational writes use additive permissive policies with valid landlord ownership; restrictive MFA and tenant policies remain unchanged.
- Playwright uses an externally managed server when BASE_URL is provided locally; in CI it always starts the built preview on port 4173 so the configured BASE_URL is reachable.
- Fleet mutations display allowlisted business errors through a shared mapper with operation-specific fallback messages, so database diagnostics never reach users.
- Client contract eligibility rules live in a shared pure module used by the contract form and regression tests; database validation remains authoritative.- Test accounts skip landlord document completion only via profiles.is_test_account, which a trigger lets only the service role set or change; email domains are never a test-account criterion.
