# Validation Provider Evals

Validation-Site is a private black-box provider for WebAgentFlow validation.
This repository may keep private routes, scenario details, seed data, raw
browser artifacts, screenshots, traces, and implementation-specific evidence.

WebAgentFlow must not consume those private artifacts. The only artifact meant
for WebAgentFlow consumption is the redacted summary:

```text
evals/artifacts/latest/provider-summary.redacted.json
```

Generate or update the summary with:

```bash
pnpm run eval:summary -- --status UNVERIFIED --command-id summary-only
```

When a private black-box run has completed and its provider-owned gates are
reviewed, the same script may emit `PASS`, `FAIL`, `BLOCKED`, or
`PASS_WITH_CAVEATS`.

The redacted summary must contain only:

- `provider.kind = external_target`
- opaque `target.target_ref`
- opaque `case_results[].case_id`
- aggregate statuses
- `redacted: true` metadata

It must not contain local ports, target paths, route names, selectors,
component names, business values, API paths, screenshots, traces, DOM, raw
browser output, WebAgentFlow runtime payloads, credentials, tokens, or cookies.
