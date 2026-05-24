# WebAgentFlow Validation Site

External product-like validation site for WebAgentFlow.

This repository hosts a standalone validation target used for black-box product verification. It is intentionally separate from the WebAgentFlow runtime repository so runtime code, prompts, eval runner logic, and product validation site implementation do not live in the same repository.

## Role

This site is used for:

- product-like manual validation
- black-box browser operation checks
- future high-level eval targets

It is not the deterministic internal fixture site. The internal fixture site belongs in `leechen298/WebAgentFlow-Fixture-Site`.

## Boundary

The WebAgentFlow main repository may know:

- target URL
- high-level user task
- expected visible behavior
- forbidden behavior
- result artifacts

The WebAgentFlow main repository should not know:

- page source code
- component names
- `data-testid` values
- DOM selectors
- fixture internal state
- implementation-specific business logic

## Current compatibility routes

The initial migration keeps routes copied from `WebAgentFlow/apps/product-test-site` on branch `v0.1`:

- `/items`
- `/workspace-login`
- `/workspace-home`

These routes exist for migration compatibility. New product-like validation should eventually prefer `/inventory`.

## Planned safe operation scope

First product-like validation scope:

- create an inventory item
- search inventory items
- edit an inventory item

Out of scope for the first version:

- login as a hard requirement for product validation
- delete
- payment
- permissions
- complex multi-page workflows
- real backend persistence

## Development

```bash
pnpm install
pnpm dev
```

Default local URL:

```text
http://127.0.0.1:5177
```

Compatibility page:

```text
http://127.0.0.1:5177/items
```

## Build

```bash
pnpm build
```

## Relationship to WebAgentFlow

WebAgentFlow should treat this repository as an external black-box target.

The main repository may keep manifests and run results, but should not copy this repository's source code or implementation details back into WebAgentFlow.
