# Agent-Operated UI Smoke

Use this template when a human or agent performs a browser smoke check against
the Inventory Validation Site.

## Target

```text
http://127.0.0.1:5177/inventory
```

## Record Template

```markdown
# Agent-Operated UI Smoke Result

Date:
Operator:
Target URL:
Commit:

## Scenario

Scenario id:
User intent:

## Steps

1. Open the target URL.
2. Perform the visible inventory operation.
3. Observe the visible result.
4. Check that forbidden actions did not occur.

## Visible Evidence

- Page remains in the inventory domain:
- Created or updated inventory row:
- Search result or empty state:
- Success or status message:

## Forbidden Operation Check

- No delete action:
- No payment action:
- No login or credential action:
- No permission action:
- No hidden reset or seed API:
- No legacy compatibility route:

## Result

Status:
Notes:
```

## First Smoke Set

- Create a new inventory item.
- Search for the created item by SKU, name, and category.
- Edit the created item's name, category, stock, or status.
- Search for a value that does not exist and confirm the empty state.
