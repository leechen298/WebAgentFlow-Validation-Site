<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { DownloadOutlined } from '@ant-design/icons-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { currentLocale } from '../i18n';
import {
  displayDepartment,
  displayRegion,
  displayUserName,
  matchesLocalizedUserName,
  rawUserNameForExactDisplay,
} from '../i18n/business';

type UserRole = 'admin' | 'user' | 'guest';
type UserStatus = 'active' | 'disabled';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  registered_at: string;
  region: string;
  department: string;
  last_login_at: string;
}

interface DisplayUser extends User {
  displayName: string;
  displayRole: string;
  displayStatus: string;
  displayRegion: string;
  displayDepartment: string;
}

type UserExportColumn = {
  title: string;
  getValue: (user: DisplayUser) => string | number;
};

interface RegionOption {
  value: string;
  label: string;
  children?: RegionOption[];
}

interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}

interface UserListData {
  total: number;
  items: User[];
}

interface UserOptionsData {
  roles: UserRole[];
  statuses: UserStatus[];
  departments: string[];
  regions: RegionOption[];
}

interface RegionChoice {
  value: string;
  label: string;
}

type NoticeState =
  | {
      message: string;
    }
  | {
      messageKey: string;
      params?: Record<string, number | string>;
    };

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const rows = ref<User[]>([]);
const total = ref(0);
const detail = ref<User | null>(null);
const roleOptions = ref<UserRole[]>([]);
const departmentOptions = ref<string[]>([]);
const regionOptions = ref<RegionOption[]>([]);
const isLoading = ref(false);
const noticeState = ref<NoticeState>({ messageKey: 'users.notice.loading' });

const form = reactive({
  name: '',
  email: '',
  role: '',
  status: '',
  registeredFrom: '',
  registeredTo: '',
  regionPrefix: '',
  month: '',
  departments: [] as string[],
});

const activeCount = computed(() => rows.value.filter((user) => user.status === 'active').length);
const disabledCount = computed(() => rows.value.filter((user) => user.status === 'disabled').length);
const displayRows = computed(() => rows.value.map(displayUser));
const displayDetail = computed(() => (detail.value ? displayUser(detail.value) : null));
const notice = computed(() =>
  'message' in noticeState.value
    ? noticeState.value.message
    : t(noticeState.value.messageKey, noticeState.value.params ?? {}),
);

const countLabel = computed(() => {
  if (isLoading.value) {
    return t('users.countLoading');
  }

  return t('users.countUsers', total.value, { named: { count: total.value } });
});

const registeredFromValue = computed<Dayjs | null>({
  get: () => (form.registeredFrom ? dayjs(form.registeredFrom) : null),
  set: (value) => {
    form.registeredFrom = value?.format('YYYY-MM-DD') ?? '';
  },
});

const registeredToValue = computed<Dayjs | null>({
  get: () => (form.registeredTo ? dayjs(form.registeredTo) : null),
  set: (value) => {
    form.registeredTo = value?.format('YYYY-MM-DD') ?? '';
  },
});

const monthValue = computed<Dayjs | null>({
  get: () => (form.month ? dayjs(`${form.month}-01`) : null),
  set: (value) => {
    form.month = value?.format('YYYY-MM') ?? '';
  },
});

const roleSelectOptions = computed(() => [
  { label: t('users.placeholders.anyRole'), value: '' },
  ...roleOptions.value.map((role) => ({
    label: t(`roles.${role}`),
    value: role,
  })),
]);

const regionChoices = computed<RegionChoice[]>(() => flattenRegionOptions(regionOptions.value));
const regionSelectOptions = computed(() => [
  { label: t('users.placeholders.anyRegion'), value: '' },
  ...regionChoices.value,
]);

const departmentSelectOptions = computed(() =>
  departmentOptions.value.map((department) => ({
    label: displayDepartment(department, currentLocale.value),
    value: department,
  })),
);

const statusRadioOptions = computed(() => [
  { label: t('users.statusOptions.all'), value: '' },
  { label: t('users.statusOptions.active'), value: 'active' },
  { label: t('users.statusOptions.disabled'), value: 'disabled' },
]);

const tableColumns = computed(() => [
  { title: t('users.fields.id'), dataIndex: 'id', key: 'id', width: 72 },
  { title: t('users.fields.name'), dataIndex: 'displayName', key: 'name' },
  { title: t('users.fields.email'), dataIndex: 'email', key: 'email' },
  { title: t('users.fields.role'), dataIndex: 'displayRole', key: 'role' },
  { title: t('users.fields.status'), dataIndex: 'displayStatus', key: 'status' },
  { title: t('users.fields.registered'), dataIndex: 'registered_at', key: 'registered_at' },
  { title: t('users.fields.region'), dataIndex: 'displayRegion', key: 'region' },
  { title: t('users.fields.department'), dataIndex: 'displayDepartment', key: 'department' },
  { title: t('common.actions'), key: 'actions', width: 120 },
]);

const userExportColumns = computed<UserExportColumn[]>(() => [
  { title: t('users.fields.id'), getValue: (user) => user.id },
  { title: t('users.fields.name'), getValue: (user) => user.displayName },
  { title: t('users.fields.email'), getValue: (user) => user.email },
  { title: t('users.fields.role'), getValue: (user) => user.displayRole },
  { title: t('users.fields.status'), getValue: (user) => user.displayStatus },
  { title: t('users.fields.registered'), getValue: (user) => user.registered_at },
  { title: t('users.fields.region'), getValue: (user) => user.displayRegion },
  { title: t('users.fields.department'), getValue: (user) => user.displayDepartment },
  { title: t('users.fields.lastLogin'), getValue: (user) => user.last_login_at },
]);

onMounted(async () => {
  restoreFormFromRoute();
  await loadOptions();
  await fetchUsers();
});

async function loadOptions() {
  try {
    const payload = await requestJson<UserOptionsData>('/api/users/meta/options');
    roleOptions.value = payload.data.roles;
    departmentOptions.value = payload.data.departments;
    regionOptions.value = payload.data.regions;
  } catch (error) {
    setErrorNotice(error, 'users.notice.optionsError');
  }
}

async function fetchUsers() {
  isLoading.value = true;

  try {
    const payload = await requestJson<UserListData>(withQuery('/api/users', buildApiParams()));
    rows.value = payload.data.items.filter((user) =>
      matchesUserSearch(user, form.name, currentLocale.value),
    );
    total.value = rows.value.length;
    setNotice(rows.value.length ? 'users.notice.loaded' : 'users.noMatchNotice');
  } catch (error) {
    rows.value = [];
    total.value = 0;
    setErrorNotice(error, 'users.notice.loadError');
  } finally {
    isLoading.value = false;
  }
}

function onSearch() {
  detail.value = null;
  syncUrl();
  void fetchUsers();
}

function onReset() {
  form.name = '';
  form.email = '';
  form.role = '';
  form.status = '';
  form.registeredFrom = '';
  form.registeredTo = '';
  form.regionPrefix = '';
  form.month = '';
  form.departments = [];
  detail.value = null;
  syncUrl();
  void fetchUsers();
}

async function viewUser(user: User) {
  try {
    const payload = await requestJson<User>(`/api/users/${user.id}`);
    detail.value = payload.data;
  } catch {
    detail.value = user;
    setNotice('users.detailFallback');
  }
}

function displayUser(user: User): DisplayUser {
  return {
    ...user,
    displayName: displayUserName(user.name, currentLocale.value),
    displayRole: t(`roles.${user.role}`),
    displayStatus: t(`statuses.${user.status}`),
    displayRegion: displayRegion(user.region, currentLocale.value),
    displayDepartment: displayDepartment(user.department, currentLocale.value),
  };
}

function downloadCurrentUsers() {
  const workbook = buildUsersExcelWorkbook(displayRows.value, userExportColumns.value);
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'users-export.xls';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildUsersExcelWorkbook(users: DisplayUser[], columns: UserExportColumn[]): string {
  const headerCells = columns.map((column) => `<th>${escapeHtml(column.title)}</th>`).join('');
  const bodyRows = users
    .map((user) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(String(column.getValue(user)))}</td>`)
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '</head>',
    '<body>',
    '<table>',
    `<thead><tr>${headerCells}</tr></thead>`,
    `<tbody>${bodyRows}</tbody>`,
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildParams(): Record<string, string> {
  const params: Record<string, string> = {};

  if (form.name.trim()) params.name = form.name.trim();
  if (form.email.trim()) params.email = form.email.trim();
  if (form.role) params.role = form.role;
  if (form.status) params.status = form.status;
  if (form.registeredFrom) params.registered_from = form.registeredFrom;
  if (form.registeredTo) params.registered_to = form.registeredTo;
  if (form.regionPrefix) params.region_prefix = form.regionPrefix;
  if (form.month) params.month = form.month;
  if (form.departments.length) params.department = form.departments.join(',');

  return params;
}

function buildApiParams(): Record<string, string> {
  const params = buildParams();

  if (params.name) {
    params.name = rawUserNameForExactDisplay(params.name, currentLocale.value);
  }

  return params;
}

function matchesUserSearch(user: User, query: string, locale = currentLocale.value): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return matchesLocalizedUserName(user.name, normalizedQuery, locale);
}

function syncUrl() {
  router.replace({ path: '/users', query: buildParams() }).catch(() => {
    /* Identical navigations can be ignored. */
  });
}

function restoreFormFromRoute() {
  const query = route.query;

  if (typeof query.name === 'string') form.name = query.name;
  if (typeof query.email === 'string') form.email = query.email;
  if (typeof query.role === 'string') form.role = query.role;
  if (typeof query.status === 'string') form.status = query.status;
  if (typeof query.registered_from === 'string') form.registeredFrom = query.registered_from;
  if (typeof query.registered_to === 'string') form.registeredTo = query.registered_to;
  if (typeof query.region_prefix === 'string') form.regionPrefix = query.region_prefix;
  if (typeof query.month === 'string') form.month = query.month;
  if (typeof query.department === 'string') {
    form.departments = query.department.split(',').filter(Boolean);
  }
}

function withQuery(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
}

function flattenRegionOptions(options: RegionOption[], prefix: string[] = []): RegionChoice[] {
  return options.flatMap((option) => {
    const nextPrefix = [...prefix, option.value];
    const rawValue = nextPrefix.join('/');
    const self = {
      value: rawValue,
      label: displayRegion(rawValue, currentLocale.value),
    };

    if (!option.children?.length) {
      return [self];
    }

    return [self, ...flattenRegionOptions(option.children, nextPrefix)];
  });
}

function statusColor(status: UserStatus): string {
  return status === 'active' ? 'success' : 'error';
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

async function requestJson<T>(input: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(input);
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.msg || `Request failed with status ${response.status}.`);
  }

  return payload;
}
</script>

<template>
  <main class="users-page page-shell" :data-locale="currentLocale">
    <header class="page-header" aria-labelledby="users-title">
      <div>
        <p class="eyebrow">{{ t('app.brand') }}</p>
        <h1 id="users-title" class="page-title">{{ t('users.title') }}</h1>
        <p class="subtitle">{{ t('users.subtitle') }}</p>
      </div>

      <div class="summary-grid" :aria-label="t('users.summaryLabel')">
        <a-card size="small">
          <a-statistic :title="t('users.fields.name')" :value="total" />
        </a-card>
        <a-card size="small">
          <a-statistic :title="t('statuses.active')" :value="activeCount" />
        </a-card>
        <a-card size="small">
          <a-statistic :title="t('statuses.disabled')" :value="disabledCount" />
        </a-card>
      </div>
    </header>

    <a-alert class="surface-section" type="info" show-icon :message="notice" role="status" />

    <a-card class="surface-section" :title="t('users.searchTitle')">
      <template #extra>
        <span class="count-label">{{ countLabel }}</span>
      </template>

      <a-form id="user-search-form" :model="form" layout="vertical" @finish="onSearch">
        <div class="user-search-grid">
          <a-form-item :label="t('users.fields.name')">
            <a-input id="search-name" v-model:value="form.name" placeholder="alice" autocomplete="off" />
          </a-form-item>

          <a-form-item :label="t('users.fields.email')">
            <a-input
              id="search-email"
              v-model:value="form.email"
              placeholder="alice@example.com"
              autocomplete="off"
            />
          </a-form-item>

          <a-form-item :label="t('users.fields.role')">
            <a-select id="search-role" v-model:value="form.role" :options="roleSelectOptions" />
          </a-form-item>

          <a-form-item :label="t('users.fields.status')">
            <a-radio-group
              id="search-status"
              v-model:value="form.status"
              :options="statusRadioOptions"
              option-type="button"
            />
          </a-form-item>

          <a-form-item :label="t('users.fields.registeredFrom')">
            <a-date-picker
              id="search-registered-from"
              v-model:value="registeredFromValue"
              class="full-width"
            />
          </a-form-item>

          <a-form-item :label="t('users.fields.registeredTo')">
            <a-date-picker
              id="search-registered-to"
              v-model:value="registeredToValue"
              class="full-width"
            />
          </a-form-item>

          <a-form-item :label="t('users.fields.region')">
            <a-select
              id="search-region"
              v-model:value="form.regionPrefix"
              show-search
              :options="regionSelectOptions"
            />
          </a-form-item>

          <a-form-item :label="t('users.fields.month')">
            <a-date-picker
              id="search-month"
              v-model:value="monthValue"
              class="full-width"
              picker="month"
            />
          </a-form-item>

          <a-form-item class="department-field" :label="t('users.fields.department')">
            <a-select
              v-model:value="form.departments"
              mode="multiple"
              :options="departmentSelectOptions"
            />
          </a-form-item>
        </div>

        <div class="form-actions">
          <a-button id="btn-reset" @click="onReset">{{ t('common.reset') }}</a-button>
          <a-button id="btn-search" type="primary" html-type="submit" :loading="isLoading">
            {{ t('common.search') }}
          </a-button>
        </div>
      </a-form>
    </a-card>

    <a-card class="surface-section">
      <template #title>
        <div class="section-title-row">
          <div>
            <h2 class="section-heading">{{ t('users.resultsTitle') }}</h2>
            <p>{{ t('users.visibleRecords', { count: rows.length }) }}</p>
          </div>
          <a-button
            id="btn-export-users"
            :disabled="isLoading || !rows.length"
            @click="downloadCurrentUsers"
          >
            <template #icon>
              <DownloadOutlined />
            </template>
            {{ t('users.actions.downloadExcel') }}
          </a-button>
        </div>
      </template>

      <a-spin :spinning="isLoading && !rows.length" :tip="t('users.empty.loading')">
        <a-table
          v-if="rows.length"
          :columns="tableColumns"
          :data-source="displayRows"
          :loading="isLoading"
          row-key="id"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          :scroll="{ x: 1120 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ record.displayStatus }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-button
                class="btn-view-row"
                type="link"
                :data-user-id="record.id"
                @click="viewUser(record)"
              >
                {{ t('common.view') }}
              </a-button>
            </template>
          </template>
        </a-table>

        <a-empty v-else :description="isLoading ? t('users.empty.loading') : t('users.empty.noUsers')" />
      </a-spin>
    </a-card>

    <a-card
      v-if="displayDetail"
      class="surface-section user-detail"
      data-testid="user-detail"
      :title="displayDetail.displayName"
    >
      <template #extra>
        <a-button @click="detail = null">{{ t('common.close') }}</a-button>
      </template>

      <p class="detail-email">{{ displayDetail.email }}</p>
      <a-descriptions bordered :column="{ xs: 1, sm: 2, lg: 3 }">
        <a-descriptions-item :label="t('users.fields.role')">
          {{ displayDetail.displayRole }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('users.fields.status')">
          <a-tag :color="statusColor(displayDetail.status)">{{ displayDetail.displayStatus }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('users.fields.department')">
          {{ displayDetail.displayDepartment }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('users.fields.region')">
          {{ displayDetail.displayRegion }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('users.fields.registered')">
          {{ displayDetail.registered_at }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('users.fields.lastLogin')">
          {{ displayDetail.last_login_at }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </main>
</template>

<style scoped>
.users-page {
  --page-max: 1280px;
}

.count-label,
.detail-email {
  color: var(--muted);
}

.user-search-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.department-field {
  grid-column: 1 / -1;
}

.full-width {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.section-heading {
  margin-bottom: 4px;
  font-size: 1.2rem;
}

@media (max-width: 980px) {
  .user-search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .user-search-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
