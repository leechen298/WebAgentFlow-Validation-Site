<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { currentLocale } from '../i18n';
import { displayInventoryCategory, displayInventoryName } from '../i18n/business';
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

type DisplayInventoryItem = InventoryItem & {
  displayName: string;
  displayCategory: string;
  displayStatus: string;
};

type NoticeState =
  | {
      message: string;
    }
  | {
      messageKey: string;
      params?: Record<string, number | string>;
    };

const { t } = useI18n();

const items = ref<InventoryItem[]>([]);
const query = ref('');
const selectedItemId = ref<string | null>(null);
const noticeState = ref<NoticeState>({ messageKey: 'inventory.notice.loading' });
const isLoading = ref(false);
const isDialogOpen = ref(false);
const dialogMode = ref<InventoryDialogMode>(null);

const form = reactive<InventoryForm>(blankForm());

const activeCount = computed(() => items.value.filter((item) => item.status === 'active').length);
const pausedCount = computed(() => items.value.length - activeCount.value);
const totalStock = computed(() => items.value.reduce((total, item) => total + item.stock, 0));
const isEditMode = computed(() => dialogMode.value === 'edit');
const dialogTitle = computed(() =>
  isEditMode.value ? t('inventory.dialog.editTitle') : t('inventory.dialog.createTitle'),
);
const dialogDescription = computed(() => {
  if (isEditMode.value && selectedItem.value) {
    return t('inventory.dialog.editDescription', { sku: selectedItem.value.sku });
  }

  return t('inventory.dialog.createDescription');
});
const notice = computed(() =>
  'message' in noticeState.value
    ? noticeState.value.message
    : t(noticeState.value.messageKey, noticeState.value.params ?? {}),
);

const selectedItem = computed(() =>
  items.value.find((item) => item.id === selectedItemId.value) ?? null,
);

const filteredItems = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  if (!normalizedQuery) {
    return items.value;
  }

  return items.value.filter((item) =>
    inventorySearchValues(item).some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
});

const downloadHref = computed(() => {
  const params = new URLSearchParams({ locale: currentLocale.value });
  const normalizedQuery = query.value.trim();

  if (normalizedQuery) {
    params.set('query', normalizedQuery);
  }

  return `/api/inventory/export.csv?${params.toString()}`;
});

const tableColumns = computed(() => [
  { title: t('inventory.table.sku'), dataIndex: 'sku', key: 'sku' },
  { title: t('inventory.table.name'), dataIndex: 'displayName', key: 'name' },
  { title: t('inventory.table.category'), dataIndex: 'displayCategory', key: 'category' },
  { title: t('inventory.table.stock'), dataIndex: 'stock', key: 'stock' },
  { title: t('inventory.table.status'), dataIndex: 'displayStatus', key: 'status' },
  { title: t('inventory.table.updated'), dataIndex: 'updatedAt', key: 'updatedAt' },
  { title: t('inventory.table.action'), key: 'action', width: 120 },
]);

const statusOptions = computed(() => [
  { label: t('statuses.active'), value: 'active' },
  { label: t('statuses.paused'), value: 'paused' },
]);

onMounted(() => {
  void loadInventoryItems();
});

async function loadInventoryItems() {
  isLoading.value = true;

  try {
    const payload = await requestJson<InventoryListData>('/api/inventory');
    items.value = payload.data.items;
    setNotice('inventory.notice.ready');
  } catch (error) {
    setErrorNotice(error, 'inventory.notice.loadError');
  } finally {
    isLoading.value = false;
  }
}

async function openCreateDialog() {
  selectedItemId.value = null;
  Object.assign(form, blankForm());
  dialogMode.value = 'create';
  isDialogOpen.value = true;
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
  isDialogOpen.value = true;
}

function closeDialog() {
  isDialogOpen.value = false;
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
    setNotice('inventory.notice.created', {
      name: displayInventoryName(nextItem.name, currentLocale.value),
    });
    closeDialog();
  } catch (error) {
    setErrorNotice(error, 'inventory.notice.createError');
  } finally {
    isLoading.value = false;
  }
}

async function saveInventoryItem() {
  if (!selectedItem.value) {
    setNotice('inventory.notice.chooseBeforeSave');
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

    setNotice('inventory.notice.updated', {
      name: displayInventoryName(updatedItem.name, currentLocale.value),
    });
    closeDialog();
  } catch (error) {
    setErrorNotice(error, 'inventory.notice.updateError');
  } finally {
    isLoading.value = false;
  }
}

function clearSearch() {
  query.value = '';
  setNotice('inventory.notice.showingAll');
}

function displayInventoryItem(item: InventoryItem): DisplayInventoryItem {
  return {
    ...item,
    displayName: displayInventoryName(item.name, currentLocale.value),
    displayCategory: displayInventoryCategory(item.category, currentLocale.value),
    displayStatus: t(`statuses.${item.status}`),
  };
}

function inventorySearchValues(item: InventoryItem): string[] {
  return [
    item.sku,
    item.name,
    item.category,
    displayInventoryName(item.name, currentLocale.value),
    displayInventoryCategory(item.category, currentLocale.value),
  ];
}

function statusColor(status: InventoryStatus): string {
  return status === 'active' ? 'success' : 'warning';
}

function setNotice(messageKey: string, params?: Record<string, number | string>) {
  noticeState.value = { messageKey, params };
}

function setErrorNotice(error: unknown, fallbackKey: string) {
  if (error instanceof Error) {
    noticeState.value = { message: error.message };
    return;
  }

  setNotice(fallbackKey);
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
  <main class="inventory-page" :data-locale="currentLocale">
    <header class="page-header" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">{{ t('app.brand') }}</p>
        <h1 id="page-title" class="page-title">{{ t('inventory.title') }}</h1>
        <p class="subtitle">{{ t('inventory.subtitle') }}</p>
      </div>

      <div class="summary-grid" :aria-label="t('inventory.summaryLabel')">
        <a-card class="summary-card" size="small">
          <a-statistic :title="t('inventory.table.items')" :value="items.length" />
        </a-card>
        <a-card class="summary-card" size="small">
          <a-statistic :title="t('inventory.table.units')" :value="totalStock" />
        </a-card>
        <a-card class="summary-card" size="small">
          <a-statistic :title="t('statuses.active')" :value="activeCount" />
        </a-card>
        <a-card class="summary-card" size="small">
          <a-statistic :title="t('statuses.paused')" :value="pausedCount" />
        </a-card>
      </div>
    </header>

    <a-alert class="notice-alert" type="info" show-icon :message="notice" role="status" />

    <a-card class="surface-card" :title="t('inventory.searchLabel')">
      <div class="toolbar-row" :aria-label="t('inventory.searchActionsLabel')">
        <a-input-search
          id="inventory-search"
          v-model:value="query"
          class="search-input"
          allow-clear
          :placeholder="t('inventory.searchPlaceholder')"
        />
        <a-button @click="clearSearch">{{ t('common.clear') }}</a-button>
        <a-button :href="downloadHref" download="inventory-export.csv">
          {{ t('inventory.actions.downloadCsv') }}
        </a-button>
        <a-button type="primary" @click="openCreateDialog">
          {{ t('inventory.actions.create') }}
        </a-button>
      </div>
    </a-card>

    <a-card class="surface-card">
      <template #title>
        <div class="section-title-row">
          <div>
            <h2 class="section-heading">{{ t('inventory.listTitle') }}</h2>
            <p>{{ t('inventory.visibleRecords', { count: filteredItems.length }) }}</p>
          </div>
        </div>
      </template>

      <a-spin :spinning="isLoading && !filteredItems.length" :tip="t('inventory.loadingTitle')">
        <a-table
          v-if="filteredItems.length"
          :columns="tableColumns"
          :data-source="filteredItems.map(displayInventoryItem)"
          :loading="isLoading"
          row-key="id"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ record.displayStatus }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button class="table-action" type="link" @click="openEditDialog(record)">
                {{ t('inventory.actions.edit') }}
              </a-button>
            </template>
          </template>
        </a-table>

        <a-empty v-else>
          <template #description>
            <div class="empty-copy">
              <strong>
                {{ isLoading ? t('inventory.loadingTitle') : t('inventory.emptyTitle') }}
              </strong>
              <p>
                {{ isLoading ? t('inventory.loadingDescription') : t('inventory.emptyDescription') }}
              </p>
            </div>
          </template>
        </a-empty>
      </a-spin>
    </a-card>

    <a-modal
      :open="isDialogOpen"
      :title="dialogTitle"
      :footer="null"
      :destroy-on-close="true"
      @cancel="closeDialog"
    >
      <p class="dialog-description">{{ dialogDescription }}</p>

      <a-form :model="form" layout="vertical" @finish="submitInventoryForm">
        <a-form-item
          :label="t('inventory.fields.sku')"
          name="sku"
          :rules="[{ required: true, message: t('inventory.fields.sku') }]"
        >
          <a-input v-model:value="form.sku" :disabled="isEditMode" autocomplete="off" />
        </a-form-item>

        <a-form-item
          :label="t('inventory.fields.name')"
          name="name"
          :rules="[{ required: true, message: t('inventory.fields.name') }]"
        >
          <a-input v-model:value="form.name" autocomplete="off" />
        </a-form-item>

        <a-form-item
          :label="t('inventory.fields.category')"
          name="category"
          :rules="[{ required: true, message: t('inventory.fields.category') }]"
        >
          <a-input v-model:value="form.category" autocomplete="off" />
        </a-form-item>

        <a-form-item
          :label="t('inventory.fields.stock')"
          name="stock"
          :rules="[{ required: true, message: t('inventory.fields.stock') }]"
        >
          <a-input-number v-model:value="form.stock" class="full-width" :min="0" :precision="0" />
        </a-form-item>

        <a-form-item :label="t('inventory.fields.status')" name="status">
          <a-select v-model:value="form.status" :options="statusOptions" />
        </a-form-item>

        <div class="dialog-actions">
          <a-button @click="closeDialog">{{ t('common.cancel') }}</a-button>
          <a-button type="primary" html-type="submit" :loading="isLoading">
            {{ isEditMode ? t('inventory.actions.save') : t('inventory.actions.submitCreate') }}
          </a-button>
        </div>
      </a-form>
    </a-modal>
  </main>
</template>

<style scoped>
.inventory-page {
  width: min(var(--page-max), 100%);
  margin: 0 auto;
  padding: var(--page-padding);
}

.summary-grid {
  align-items: stretch;
}

.summary-card {
  border-color: var(--border);
}

.summary-card :deep(.ant-card-body) {
  padding: 14px;
}

.notice-alert,
.surface-card {
  margin-bottom: 18px;
}

.surface-card {
  border-color: var(--border);
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  min-width: min(360px, 100%);
  flex: 1 1 360px;
}

.section-heading {
  margin-bottom: 4px;
  font-size: 1.2rem;
}

.empty-copy p {
  margin: 6px 0 0;
  color: var(--muted);
}

.dialog-description {
  margin-bottom: 18px;
  color: var(--muted);
}

.full-width {
  width: 100%;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 720px) {
  .toolbar-row,
  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
