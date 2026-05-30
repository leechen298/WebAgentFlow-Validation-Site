<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import type { InventoryItem, InventoryStatus } from '../types/inventory';

type InventoryDialogMode = 'create' | 'edit' | null;

type InventoryForm = {
  sku: string;
  name: string;
  category: string;
  stock: number;
  status: InventoryStatus;
};

type ApiEnvelope<T> = {
  code: number;
  msg: string;
  data: T;
};

type InventoryListData = {
  items: InventoryItem[];
};

type InventoryItemData = {
  item: InventoryItem;
};

const items = ref<InventoryItem[]>([]);
const query = ref('');
const selectedItemId = ref<string | null>(null);
const notice = ref('Loading inventory records from the backend.');
const isLoading = ref(false);
const dialogRef = ref<HTMLDialogElement | null>(null);
const dialogMode = ref<InventoryDialogMode>(null);

const form = reactive<InventoryForm>(blankForm());

const activeCount = computed(() => items.value.filter((item) => item.status === 'active').length);
const pausedCount = computed(() => items.value.length - activeCount.value);
const totalStock = computed(() => items.value.reduce((total, item) => total + item.stock, 0));
const isEditMode = computed(() => dialogMode.value === 'edit');
const dialogTitle = computed(() => (isEditMode.value ? 'Edit inventory item' : 'New inventory item'));

const selectedItem = computed(() =>
  items.value.find((item) => item.id === selectedItemId.value) ?? null,
);

const filteredItems = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  if (!normalizedQuery) {
    return items.value;
  }

  return items.value.filter((item) => {
    return [item.sku, item.name, item.category].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
});

const downloadHref = computed(() => {
  const normalizedQuery = query.value.trim();

  if (!normalizedQuery) {
    return '/api/inventory/export.csv';
  }

  const params = new URLSearchParams({ query: normalizedQuery });
  return `/api/inventory/export.csv?${params.toString()}`;
});

onMounted(() => {
  void loadInventoryItems();
});

async function loadInventoryItems() {
  isLoading.value = true;

  try {
    const payload = await requestJson<InventoryListData>('/api/inventory');
    items.value = payload.data.items;
    notice.value = 'Ready to manage inventory records.';
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Unable to load inventory records.';
  } finally {
    isLoading.value = false;
  }
}

async function openCreateDialog() {
  selectedItemId.value = null;
  Object.assign(form, blankForm());
  dialogMode.value = 'create';
  await showDialog();
}

async function openEditDialog(item: InventoryItem) {
  selectedItemId.value = item.id;
  Object.assign(form, {
    sku: item.sku,
    name: item.name,
    category: item.category,
    stock: item.stock,
    status: item.status,
  });
  dialogMode.value = 'edit';
  await showDialog();
}

async function showDialog() {
  await nextTick();

  if (dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal();
  }
}

function closeDialog() {
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }

  dialogMode.value = null;
}

async function submitInventoryForm() {
  if (isEditMode.value) {
    await saveInventoryItem();
  } else {
    await createInventoryItem();
  }
}

async function createInventoryItem() {
  const payload = {
    sku: form.sku.trim(),
    name: form.name.trim(),
    category: form.category.trim(),
    stock: Number(form.stock),
    status: form.status,
  };

  isLoading.value = true;

  try {
    const response = await requestJson<InventoryItemData>('/api/inventory', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const nextItem = response.data.item;

    items.value = [nextItem, ...items.value];
    notice.value = `Created inventory item ${nextItem.name}.`;
    closeDialog();
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Unable to create inventory item.';
  } finally {
    isLoading.value = false;
  }
}

async function saveInventoryItem() {
  if (!selectedItem.value) {
    notice.value = 'Choose an inventory item before saving edits.';
    return;
  }

  isLoading.value = true;

  try {
    const response = await requestJson<InventoryItemData>(
      `/api/inventory/${selectedItem.value.id}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          stock: Number(form.stock),
          status: form.status,
        }),
      },
    );
    const updatedItem = response.data.item;

    items.value = items.value.map((item) => {
      if (item.id !== updatedItem.id) {
        return item;
      }

      return updatedItem;
    });

    notice.value = `Updated inventory item ${updatedItem.name}.`;
    closeDialog();
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Unable to update inventory item.';
  } finally {
    isLoading.value = false;
  }
}

function clearSearch() {
  query.value = '';
  notice.value = 'Showing all inventory items.';
}

function blankForm(): InventoryForm {
  return {
    sku: '',
    name: '',
    category: '',
    stock: 0,
    status: 'active',
  };
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.msg || `Request failed with status ${response.status}.`);
  }

  return payload;
}
</script>

<template>
  <main class="inventory-page">
    <header class="page-header" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">WebAgentFlow Validation Site</p>
        <h1 id="page-title">Inventory Management</h1>
        <p class="subtitle">
          Product-like inventory list for searching, editing, creating, and exporting records.
        </p>
      </div>

      <div class="summary-grid" aria-label="Inventory summary">
        <div>
          <span class="summary-value">{{ items.length }}</span>
          <span class="summary-label">Items</span>
        </div>
        <div>
          <span class="summary-value">{{ totalStock }}</span>
          <span class="summary-label">Units</span>
        </div>
        <div>
          <span class="summary-value">{{ activeCount }}</span>
          <span class="summary-label">Active</span>
        </div>
        <div>
          <span class="summary-value">{{ pausedCount }}</span>
          <span class="summary-label">Paused</span>
        </div>
      </div>
    </header>

    <p class="status-message" role="status" aria-live="polite">{{ notice }}</p>

    <section class="toolbar" aria-label="Inventory search and actions">
      <label for="inventory-search">Search inventory</label>
      <div class="search-row inventory-actions">
        <input
          id="inventory-search"
          v-model="query"
          type="search"
          placeholder="Search by SKU, name, or category"
        />
        <button type="button" class="secondary-button" @click="clearSearch">Clear</button>
        <a class="secondary-button download-link" :href="downloadHref" download="inventory-export.csv">
          Download CSV
        </a>
        <button type="button" class="primary-button inline-button" @click="openCreateDialog">
          New inventory item
        </button>
      </div>
    </section>

    <section class="inventory-table-section" aria-labelledby="inventory-list-heading">
      <div class="section-heading">
        <div>
          <h2 id="inventory-list-heading">Inventory list</h2>
          <p>{{ filteredItems.length }} visible records</p>
        </div>
      </div>

      <div v-if="isLoading && !filteredItems.length" class="empty-state">
        <h3>Loading inventory items</h3>
        <p>Waiting for the backend inventory API.</p>
      </div>

      <div v-else-if="filteredItems.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Name</th>
              <th scope="col">Category</th>
              <th scope="col">Stock</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>{{ item.sku }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.stock }}</td>
              <td>
                <span class="status-pill" :class="`status-${item.status}`">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.updatedAt }}</td>
              <td>
                <button type="button" class="text-button" @click="openEditDialog(item)">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No inventory items found</h3>
        <p>Try a different SKU, name, or category.</p>
      </div>
    </section>

    <dialog
      ref="dialogRef"
      class="inventory-dialog"
      aria-labelledby="inventory-dialog-title"
      @cancel.prevent="closeDialog"
    >
      <form class="dialog-panel" method="dialog" @submit.prevent="submitInventoryForm">
        <div class="dialog-header">
          <div>
            <h2 id="inventory-dialog-title">{{ dialogTitle }}</h2>
            <p v-if="isEditMode && selectedItem">Editing {{ selectedItem.sku }}.</p>
            <p v-else>Add a record to the inventory list.</p>
          </div>
          <button type="button" class="icon-button" aria-label="Close inventory dialog" @click="closeDialog">
            x
          </button>
        </div>

        <label for="inventory-form-sku">SKU</label>
        <input
          id="inventory-form-sku"
          v-model="form.sku"
          :disabled="isEditMode"
          required
          autocomplete="off"
        />

        <label for="inventory-form-name">Name</label>
        <input id="inventory-form-name" v-model="form.name" required autocomplete="off" />

        <label for="inventory-form-category">Category</label>
        <input id="inventory-form-category" v-model="form.category" required autocomplete="off" />

        <label for="inventory-form-stock">Stock quantity</label>
        <input id="inventory-form-stock" v-model.number="form.stock" type="number" min="0" required />

        <label for="inventory-form-status">Status</label>
        <select id="inventory-form-status" v-model="form.status">
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>

        <div class="dialog-actions">
          <button type="button" class="secondary-button" @click="closeDialog">Cancel</button>
          <button type="submit" class="primary-button inline-button" :disabled="isLoading">
            {{ isEditMode ? 'Save edits' : 'Create item' }}
          </button>
        </div>
      </form>
    </dialog>
  </main>
</template>

<style scoped>
.inventory-actions {
  grid-template-columns: minmax(0, 1fr) auto auto auto;
}

.inline-button {
  width: auto;
  margin-top: 0;
  white-space: nowrap;
}

.inventory-dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  padding: 0;
  color: #172026;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 24px 80px rgb(20 32 24 / 26%);
}

.inventory-dialog::backdrop {
  background: rgb(17 31 26 / 42%);
}

.dialog-panel {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.dialog-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.dialog-header p {
  margin-bottom: 0;
  color: var(--muted);
}

.icon-button {
  width: 36px;
  min-height: 36px;
  color: var(--accent-dark);
  background: #e4eee9;
  font-size: 1.1rem;
  font-weight: 800;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 720px) {
  .inventory-actions {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
