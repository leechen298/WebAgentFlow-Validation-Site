# Scenario Mapping from WebAgentFlow Product Test Site

## Principle

This repository migrates validation intent, not legacy page implementation.

The old product-test-site proved useful product-level chat semantics. The new
Inventory Validation Site keeps those semantics while replacing the old page
surface with a single inventory management product surface.

## Mapping

| Original | New |
|---|---|
| `/items` closed-loop | `/inventory` create closed-loop |
| `item_name` slot | inventory item fields: `sku`, `name`, `category`, `stock`, `status` |
| item list DOM evidence | visible inventory table row evidence |
| single path direct replay | known inventory action reuse |
| failure recovery menu | inventory operation recovery safety |
| pending choice | multiple inventory action choice |
| planner-backed choice | planner-backed inventory action selection |
| URL-only known page | URL-only known inventory page |
| URL-only unknown page | URL-only unknown inventory target |
| execute known action | execute known inventory operation |
| execute unknown action | block and offer learning for unknown inventory operation |
| vague input no execution | vague input no execution |
| forbidden target scan | anti-hardcoding scan for runtime and prompt boundaries |

## Scenario Translation

### Closed Loop

Original validation intent:

- User provides the product page URL.
- WebAgentFlow determines the operation is not learned yet.
- User teaches a create operation with one business value.
- WebAgentFlow creates a learned path.
- User requests the same operation with different values.
- Execution uses the new runtime values.
- Visible page evidence verifies the new record.
- The final response references the new business value.

New scenario:

- Target: `http://127.0.0.1:5177/inventory`
- Teach: create an inventory item with SKU, name, category, and stock.
- Execute: create another inventory item with different SKU, name, category,
  and stock.
- Verify: the new inventory row is visible in the table and the response
  references the created item.

### Known Action Reuse

Original validation intent:

- A single matching learned create path exists.
- WebAgentFlow executes directly without forcing a pending choice.
- The result is visibly verified.

New scenario:

- A single matching create-inventory action exists.
- A later create-inventory request reuses that action.
- No pending choice or planner choice appears when there is only one suitable
  current-scope action.

### Choice Scenarios

The new UI intentionally includes create, search, and edit operations. These
visible product actions provide a future landing surface for pending-choice and
planner-backed choice validation without adding fixture-only mechanics.

## Excluded Legacy Details

Do not preserve:

- old routes
- old component names
- old `data-testid` values
- old selectors
- old fixed fixture copy
- old slot names
- old eval runner code
