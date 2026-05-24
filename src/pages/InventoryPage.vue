<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { inventorySeed } from '../data/inventorySeed';
import type { InventoryItem, InventoryStatus } from '../types/inventory';

type InventoryForm = {
  sku: string;
  name: string;
  category: string;
  stock: number;
  status: InventoryStatus;
};

const items = ref<InventoryItem[]>(inventorySeed.map((item) => ({ ...item })));
const query = ref('');
const selectedItemId = ref<string | null>(null);
const notice = ref('Ready to manage inventory records.');

const createForm = reactive<InventoryForm>({
  sku: '',
  name: '',
  category: '',
  stock: 0,
  status: 'active',
});

const editForm = reactive<InventoryForm>({
  sku: '',
  name: '',
  category: '',
  stock: 0,
  status: 'active',
});

const activeCount = computed(() => items.value.filter((item) => item.status === 'active').length);
const pausedCount = computed(() => items.value.length - activeCount.value);
const totalStock = computed(() => items.value.reduce((total, item) => total + item.stock, 0));

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

function createInventoryItem() {
  const nextItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    sku: createForm.sku.trim(),
    name: createForm.name.trim(),
    category: createForm.category.trim(),
    stock: Number(createForm.stock),
    status: createForm.status,
    updatedAt: formatTimestamp(),
  };

  items.value = [nextItem, ...items.value];
  notice.value = `Created inventory item ${nextItem.name}.`;
  Object.assign(createForm, {
    sku: '',
    name: '',
    category: '',
    stock: 0,
    status: 'active' as InventoryStatus,
  });
}

function startEditing(item: InventoryItem) {
  selectedItemId.value = item.id;
  Object.assign(editForm, {
    sku: item.sku,
    name: item.name,
    category: item.category,
    stock: item.stock,
    status: item.status,
  });
  notice.value = `Editing ${item.name}.`;
}

function saveInventoryItem() {
  if (!selectedItem.value) {
    notice.value = 'Choose an inventory item before saving edits.';
    return;
  }

  items.value = items.value.map((item) => {
    if (item.id !== selectedItem.value?.id) {
      return item;
    }

    return {
      ...item,
      name: editForm.name.trim(),
      category: editForm.category.trim(),
      stock: Number(editForm.stock),
      status: editForm.status,
      updatedAt: formatTimestamp(),
    };
  });

  notice.value = `Updated inventory item ${editForm.name.trim()}.`;
}

function clearSearch() {
  query.value = '';
  notice.value = 'Showing all inventory items.';
}

function formatTimestamp() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date()).replace(',', '');
}
</script>

<template>
  <main class="inventory-page">
    <header class="page-header" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">WebAgentFlow Validation Site</p>
        <h1 id="page-title">Inventory Management</h1>
        <p class="subtitle">
          Product-like validation surface for creating, searching, and editing inventory records.
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

    <section class="toolbar" aria-label="Inventory search">
      <label for="inventory-search">Search inventory</label>
      <div class="search-row">
        <input
          id="inventory-search"
          v-model="query"
          type="search"
          placeholder="Search by SKU, name, or category"
        />
        <button type="button" class="secondary-button" @click="clearSearch">Clear</button>
      </div>
    </section>

    <div class="workspace">
      <section class="inventory-table-section" aria-labelledby="inventory-list-heading">
        <div class="section-heading">
          <div>
            <h2 id="inventory-list-heading">Inventory list</h2>
            <p>{{ filteredItems.length }} visible records</p>
          </div>
        </div>

        <div v-if="filteredItems.length" class="table-scroll">
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
                  <button type="button" class="text-button" @click="startEditing(item)">
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

      <aside class="forms-column" aria-label="Inventory actions">
        <form class="form-panel" @submit.prevent="createInventoryItem">
          <div class="section-heading">
            <div>
              <h2>Create item</h2>
              <p>Add a new inventory record.</p>
            </div>
          </div>

          <label for="create-sku">SKU</label>
          <input id="create-sku" v-model="createForm.sku" required autocomplete="off" />

          <label for="create-name">Name</label>
          <input id="create-name" v-model="createForm.name" required autocomplete="off" />

          <label for="create-category">Category</label>
          <input id="create-category" v-model="createForm.category" required autocomplete="off" />

          <label for="create-stock">Stock quantity</label>
          <input id="create-stock" v-model.number="createForm.stock" type="number" min="0" required />

          <label for="create-status">Status</label>
          <select id="create-status" v-model="createForm.status">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button type="submit" class="primary-button">Create inventory item</button>
        </form>

        <form class="form-panel" @submit.prevent="saveInventoryItem">
          <div class="section-heading">
            <div>
              <h2>Edit item</h2>
              <p v-if="selectedItem">Editing {{ selectedItem.sku }}.</p>
              <p v-else>Choose a row to edit.</p>
            </div>
          </div>

          <label for="edit-sku">SKU</label>
          <input id="edit-sku" v-model="editForm.sku" disabled />

          <label for="edit-name">Name</label>
          <input id="edit-name" v-model="editForm.name" :disabled="!selectedItem" required />

          <label for="edit-category">Category</label>
          <input id="edit-category" v-model="editForm.category" :disabled="!selectedItem" required />

          <label for="edit-stock">Stock quantity</label>
          <input
            id="edit-stock"
            v-model.number="editForm.stock"
            type="number"
            min="0"
            :disabled="!selectedItem"
            required
          />

          <label for="edit-status">Status</label>
          <select id="edit-status" v-model="editForm.status" :disabled="!selectedItem">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button type="submit" class="primary-button" :disabled="!selectedItem">Save edits</button>
        </form>
      </aside>
    </div>
  </main>
</template>
