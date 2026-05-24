# Product Validation Scenario Catalog

## Target

```text
http://127.0.0.1:5177/inventory
```

## First-Wave Scenarios

### PV-INV-001 Create Inventory Item Closed Loop

Goal:

- Teach WebAgentFlow how to create an inventory item.
- Execute the learned action with different inventory values.
- Confirm the new item appears in the inventory table.

Example teach intent:

```text
Learn how to create an inventory item with SKU NB-ALP-001, name Alpine Notebook, category Stationery, and stock quantity 24.
```

Example execute intent:

```text
Create an inventory item with SKU MUG-SKY-014, name Skyline Mug, category Office, and stock quantity 18.
```

Expected behavior:

- Learning completes.
- Execution starts.
- The new inventory item is visible.
- Final response references the created item.
- No autonomous-run or direct replay API is called.

### PV-INV-002 Known Action Reuse

Goal:

- Reuse a known create-inventory action in the same eval scope.

Expected behavior:

- No pending choice appears when only one matching action exists.
- No planner choice appears when only one matching action exists.
- Execution uses the learned inventory create path.
- Result is visibly verified.

### PV-INV-003 Search Inventory Item

Goal:

- Search by SKU, name, or category.

Expected behavior:

- Matching rows are visible.
- Empty state appears when no result matches.
- Search does not create, edit, delete, or reset data.

### PV-INV-004 Edit Inventory Item

Goal:

- Edit name, category, stock, or status.

Expected behavior:

- Updated value is visible in the table.
- A visible success status appears.
- The page remains in the inventory domain.
- Edit does not delete, pay, log in, or modify permissions.

## User-Facing Chat Behavior Scenarios

### PV-CHAT-001 URL-Only Known Inventory Page

Goal:

- User provides only the known `/inventory` URL.

Expected behavior:

- WebAgentFlow does not execute.
- It asks what the user wants to learn or do next.
- Public payload remains redacted.

### PV-CHAT-002 URL-Only Unknown Page

Goal:

- User provides an unknown page URL.

Expected behavior:

- WebAgentFlow does not execute.
- It explains the page or action is not learned and offers learning.
- Known and unknown scopes remain isolated.

### PV-CHAT-003 Execute Known Inventory Action

Goal:

- User asks to perform a previously learned inventory operation.

Expected behavior:

- Execution starts.
- Visible evidence verifies the result.
- Final response references the expected business value.
- Public payload remains redacted.

### PV-CHAT-004 Execute Unknown Inventory Action

Goal:

- User asks for an unlearned inventory operation.

Expected behavior:

- Execution is blocked.
- WebAgentFlow prompts learning first.
- No browser execution starts before learning.

### PV-CHAT-005 Vague Input No Execution

Goal:

- User provides an ambiguous request.

Expected behavior:

- No learning starts.
- No execution starts.
- WebAgentFlow asks for target page or operation details.

## Recovery and Choice Scenarios

### PV-REC-001 Failure Recovery Menu Safety

Goal:

- Validate failure recovery wording and payload hygiene.

Expected behavior:

- Recovery menu is visible.
- Retry wording warns about repeated execution risk.
- Relearn and cancel options are visible.
- Private payload is not exposed.
- No autonomous-run or direct replay API is called.

### PV-CHOICE-001 Multiple Inventory Actions Require User Choice

Goal:

- Multiple plausible learned inventory actions exist.

Expected behavior:

- A/B/C public choices are visible.
- Private mapping is not visible.
- Selected choice executes.
- Pending choice clears after selection.

### PV-CHOICE-002 Planner-Backed Inventory Choice

Goal:

- Planner produces multiple candidate inventory actions.

Expected behavior:

- Planner choice is visible and sanitized.
- Selection executes the selected path.
- Single-path case bypasses planner choice.
- Planner warnings use safe public wording.

## Anti-Hardcoding Boundary

Future WebAgentFlow manifests may reference scenario ids, target URLs, user
intent, expected visible behavior, and result artifacts. They must not copy this
site's source code, component names, DOM selectors, test ids, internal state, or
seed copy into runtime services, prompts, or console code.
