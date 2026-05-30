<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

const route = useRoute();
const router = useRouter();

const rows = ref<User[]>([]);
const total = ref(0);
const detail = ref<User | null>(null);
const roleOptions = ref<UserRole[]>([]);
const departmentOptions = ref<string[]>([]);
const regionOptions = ref<RegionOption[]>([]);
const isLoading = ref(false);
const notice = ref('Loading user directory.');

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

const countLabel = computed(() => {
  if (isLoading.value) {
    return 'Loading users';
  }

  return total.value === 1 ? '1 user' : `${total.value} users`;
});

const regionChoices = computed<RegionChoice[]>(() => flattenRegionOptions(regionOptions.value));

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
    notice.value = error instanceof Error ? error.message : 'Unable to load user options.';
  }
}

async function fetchUsers() {
  isLoading.value = true;

  try {
    const payload = await requestJson<UserListData>(withQuery('/api/users', buildParams()));
    rows.value = payload.data.items;
    total.value = payload.data.total;
    notice.value = rows.value.length
      ? 'User directory loaded.'
      : 'No users matched the current filters.';
  } catch (error) {
    rows.value = [];
    total.value = 0;
    notice.value = error instanceof Error ? error.message : 'Unable to load users.';
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

function toggleDepartment(department: string) {
  const index = form.departments.indexOf(department);

  if (index >= 0) {
    form.departments.splice(index, 1);
  } else {
    form.departments.push(department);
  }
}

async function viewUser(user: User) {
  try {
    const payload = await requestJson<User>(`/api/users/${user.id}`);
    detail.value = payload.data;
  } catch {
    detail.value = user;
  }
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
    const self = {
      value: nextPrefix.join('/'),
      label: nextPrefix.join(' / '),
    };

    if (!option.children?.length) {
      return [self];
    }

    return [self, ...flattenRegionOptions(option.children, nextPrefix)];
  });
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
  <main class="users-page">
    <header class="page-header" aria-labelledby="users-title">
      <div>
        <p class="eyebrow">WebAgentFlow Validation Site</p>
        <h1 id="users-title">User Directory</h1>
        <p class="subtitle">
          Fixture-style list page for search, filters, row actions, and detail loading.
        </p>
      </div>

      <div class="summary-grid" aria-label="User summary">
        <div>
          <span class="summary-value">{{ total }}</span>
          <span class="summary-label">Users</span>
        </div>
        <div>
          <span class="summary-value">{{ rows.filter((user) => user.status === 'active').length }}</span>
          <span class="summary-label">Active</span>
        </div>
        <div>
          <span class="summary-value">{{ rows.filter((user) => user.status === 'disabled').length }}</span>
          <span class="summary-label">Disabled</span>
        </div>
      </div>
    </header>

    <p class="status-message" role="status" aria-live="polite">{{ notice }}</p>

    <section class="search-panel" aria-labelledby="user-search-heading">
      <div class="section-heading">
        <div>
          <h2 id="user-search-heading">Search users</h2>
          <p>{{ countLabel }}</p>
        </div>
      </div>

      <form id="user-search-form" class="user-search-form" @submit.prevent="onSearch">
        <div class="field">
          <label for="search-name">Name</label>
          <input id="search-name" v-model="form.name" placeholder="alice" autocomplete="off" />
        </div>

        <div class="field">
          <label for="search-email">Email</label>
          <input id="search-email" v-model="form.email" placeholder="alice@example.com" autocomplete="off" />
        </div>

        <div class="field">
          <label for="search-role">Role</label>
          <select id="search-role" v-model="form.role">
            <option value="">Any role</option>
            <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
          </select>
        </div>

        <div class="field">
          <span class="field-label">Status</span>
          <fieldset id="search-status" class="radio-group">
            <label><input v-model="form.status" type="radio" value="" /> All</label>
            <label><input v-model="form.status" type="radio" value="active" /> Active</label>
            <label><input v-model="form.status" type="radio" value="disabled" /> Disabled</label>
          </fieldset>
        </div>

        <div class="field">
          <label for="search-registered-from">Registered from</label>
          <input id="search-registered-from" v-model="form.registeredFrom" type="date" />
        </div>

        <div class="field">
          <label for="search-registered-to">Registered to</label>
          <input id="search-registered-to" v-model="form.registeredTo" type="date" />
        </div>

        <div class="field">
          <label for="search-region">Region</label>
          <select id="search-region" v-model="form.regionPrefix">
            <option value="">Any region</option>
            <option v-for="region in regionChoices" :key="region.value" :value="region.value">
              {{ region.label }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="search-month">Month</label>
          <input id="search-month" v-model="form.month" type="month" />
        </div>

        <div class="department-field">
          <span class="field-label">Department</span>
          <div class="tag-row">
            <button
              v-for="department in departmentOptions"
              :key="department"
              type="button"
              class="tag-filter"
              :class="{ selected: form.departments.includes(department) }"
              :aria-pressed="form.departments.includes(department)"
              @click="toggleDepartment(department)"
            >
              {{ department }}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button id="btn-reset" type="button" class="secondary-button" @click="onReset">Reset</button>
          <button id="btn-search" type="submit" class="primary-button compact-button" :disabled="isLoading">
            Search
          </button>
        </div>
      </form>
    </section>

    <section class="user-results" aria-labelledby="user-results-heading">
      <div class="section-heading">
        <div>
          <h2 id="user-results-heading">Results</h2>
          <p>{{ rows.length }} visible records</p>
        </div>
      </div>

      <div v-if="isLoading && !rows.length" class="empty-state">
        <h3>Loading users</h3>
      </div>

      <div v-else-if="rows.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Registered</th>
              <th scope="col">Department</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in rows" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span class="status-pill" :class="`user-status-${user.status}`">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.registered_at }}</td>
              <td>{{ user.department }}</td>
              <td>
                <button
                  type="button"
                  class="text-button btn-view-row"
                  :data-user-id="user.id"
                  @click="viewUser(user)"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>No users found</h3>
      </div>
    </section>

    <section v-if="detail" class="user-detail" data-testid="user-detail" aria-labelledby="user-detail-heading">
      <div class="section-heading">
        <div>
          <h2 id="user-detail-heading">{{ detail.name }}</h2>
          <p>{{ detail.email }}</p>
        </div>
        <button type="button" class="secondary-button" @click="detail = null">Close</button>
      </div>

      <dl class="detail-grid">
        <div><dt>Role</dt><dd>{{ detail.role }}</dd></div>
        <div><dt>Status</dt><dd>{{ detail.status }}</dd></div>
        <div><dt>Department</dt><dd>{{ detail.department }}</dd></div>
        <div><dt>Region</dt><dd>{{ detail.region }}</dd></div>
        <div><dt>Registered</dt><dd>{{ detail.registered_at }}</dd></div>
        <div><dt>Last login</dt><dd>{{ detail.last_login_at }}</dd></div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.users-page {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 32px;
}

.search-panel,
.user-results,
.user-detail {
  margin-bottom: 18px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.user-search-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}

.field,
.department-field {
  display: grid;
  gap: 8px;
}

.department-field {
  grid-column: 1 / -1;
}

.field-label {
  color: #26352d;
  font-weight: 700;
}

.radio-group {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  border: 0;
}

.radio-group label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #26352d;
  font-weight: 700;
}

.radio-group input {
  width: auto;
  min-height: 0;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-filter {
  min-height: 34px;
  padding: 0 12px;
  color: #42514a;
  background: #edf3ef;
  border: 1px solid #d5ddd2;
  border-radius: 999px;
  font-weight: 800;
}

.tag-filter.selected {
  color: #ffffff;
  background: var(--accent);
  border-color: var(--accent);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.compact-button {
  width: auto;
  min-width: 120px;
}

.user-status-active {
  color: #145340;
  background: var(--success-bg);
}

.user-status-disabled {
  color: #7a1e1e;
  background: #ffe2e2;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 18px;
}

.detail-grid div {
  min-width: 0;
}

.detail-grid dt {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

.detail-grid dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

@media (max-width: 980px) {
  .user-search-form,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .users-page {
    padding: 18px;
  }

  .user-search-form,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions > * {
    flex: 1 1 0;
  }
}
</style>
