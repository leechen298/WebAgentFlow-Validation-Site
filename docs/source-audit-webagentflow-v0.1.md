# Source Audit: WebAgentFlow v0.1 Product Test Site Assets

Date: 2026-05-24

This audit records the WebAgentFlow v0.1 product validation assets that are
migrated into this repository as scenario intent. It does not migrate legacy
page implementation, selectors, test ids, or compatibility routes.

## Sources

- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/roadmap.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.5.6-items-closed-loop-2026-05-21.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.6.1-wagent-runtime-eval-core-latest.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.6.2-failure-recovery-eval-latest.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.6.3-pending-choice-multi-candidate-eval-latest.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.6.4-planner-backed-choice-eval-latest.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/docs/testing/results/m11-11.3.7-user-facing-wagent-behavior-eval-latest.md`
- `/Users/leechen/projects/WebAgentFlow/v0.1/scripts/evals/wagent_runtime_eval.py`
- `/Users/leechen/projects/WebAgentFlow/v0.1/scripts/evals/wagent_user_behavior_eval.py`
- `/Users/leechen/projects/WebAgentFlow/v0.1/scripts/evals/specs/wagent_user_behavior_items.json`

## Historical Role

WebAgentFlow v0.1 separated product-level chat validation from the deterministic
fixture site in M11.3.3. The product-test-site became the product-like target for
chat learning, runtime execution, and user-facing behavior checks, while
validation-site remained the internal fixture host.

M11.3.5 then used the product-test-site as part of the working runtime slices:
entry gate behavior, learning preconditions, parameterized learning and replay,
execution evidence, closed-loop chat evaluation, pending choice, basic recovery,
and planner-backed choice integration.

## Migrated as Scenario Assets

- Closed-loop learning and execution.
- Known action reuse after a learned path exists.
- Structured execution evidence and reporter verification.
- Failure recovery menu safety.
- Pending choice with public A/B/C choices and private payload hygiene.
- Planner-backed choice with sanitized public choice payloads.
- URL-only known page behavior.
- URL-only unknown page behavior.
- Execute known and unknown operation behavior.
- Vague input no-execution behavior.
- Known and unknown scope isolation.
- Anti-hardcoding and forbidden target scan principles.

## Not Migrated

- Legacy `/items` route.
- Legacy `/workspace-login` route.
- Legacy `/workspace-home` route.
- Old item page source.
- Old component names.
- Old `data-testid` values.
- Old DOM selectors.
- Old fixed fixture copy.
- Old slot name `item_name`.
- `apps/validation-site` fixture source or specs.
- Eval runner implementation.

## Migration Rule

This repository keeps the validation intent and visible business outcome
requirements. It does not expose an answer key through selectors, test ids,
component names, hidden reset endpoints, or seed endpoints.
