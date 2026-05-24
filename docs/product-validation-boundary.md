# Product Validation Boundary

## Repository Role

`WebAgentFlow-Validation-Site` is a standalone product-like validation site.

It provides one realistic business surface for WebAgentFlow validation:
inventory management.

## First Scenario

Inventory management supports:

- create inventory item
- search inventory item
- edit inventory item

## Not a Fixture Site

This repository should not provide fixture-only mechanisms such as:

- hidden reset API
- hidden seed API
- selector-level assertions
- data-testid-driven operation contracts
- deterministic fixture specs

## Not a Compatibility Site

This repository should not preserve old routes from
`WebAgentFlow/apps/product-test-site`, including:

- `/items`
- `/workspace-login`
- `/workspace-home`

Old compatibility remains the responsibility of the WebAgentFlow main repository
during migration.

## Main Repository Boundary

The WebAgentFlow main repository may know:

- target URL
- scenario id
- user intent
- allowed operations
- forbidden operations
- high-level expected behavior
- result artifacts

The WebAgentFlow main repository should not know:

- page source code
- component names
- DOM selectors
- `data-testid` values
- internal state shape
- seed copy
- implementation-specific business logic

## External Validation Rule

WebAgentFlow should treat this site as a black-box target. The validation signal
is visible product behavior, not implementation detail access.
