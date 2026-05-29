<script setup lang="ts">
import { computed } from 'vue';

interface ValidationPage {
  id: string;
  category: string;
  name: string;
  path: string;
  description: string;
  specId?: string;
  scenarios?: string[];
  notes?: string;
}

const pages: ValidationPage[] = [
  {
    id: 'inventory',
    category: 'Product Validation',
    name: 'Inventory Management',
    path: '/inventory',
    description:
      'Product-like inventory surface for creating, searching, and editing records during WebAgentFlow black-box validation.',
    specId: 'inventory',
    scenarios: ['create_inventory_item', 'search_inventory_items', 'edit_inventory_item'],
    notes: 'Primary target for the external validation run.',
  },
];

const byCategory = computed<Record<string, ValidationPage[]>>(() => {
  const grouped: Record<string, ValidationPage[]> = {};

  for (const page of pages) {
    (grouped[page.category] ||= []).push(page);
  }

  return grouped;
});

const workbenchRoot = 'http://localhost:5174/exploration/autonomous';

function workbenchUrl(page: ValidationPage): string {
  const params = new URLSearchParams();
  params.set('url', `${window.location.origin}${page.path}`);

  if (page.specId) {
    params.set('spec_id', page.specId);
  }

  if (page.scenarios?.length) {
    params.set('scenario', page.scenarios[0]);
  }

  return `${workbenchRoot}?${params.toString()}`;
}
</script>

<template>
  <main class="index-page">
    <header class="site-header" aria-labelledby="site-title">
      <div>
        <p class="eyebrow">WebAgentFlow Validation Site</p>
        <h1 id="site-title">Validation Surfaces</h1>
        <p class="subtitle">
          Entry list for product-like pages used by WebAgentFlow browser validation runs.
        </p>
      </div>
    </header>

    <section
      v-for="(categoryPages, category) in byCategory"
      :key="category"
      class="category-section"
      :aria-labelledby="`category-${category}`"
    >
      <div class="section-heading">
        <div>
          <h2 :id="`category-${category}`">{{ category }}</h2>
          <p>{{ categoryPages.length }} available surface</p>
        </div>
      </div>

      <div class="card-grid">
        <article v-for="page in categoryPages" :key="page.id" class="page-card">
          <div class="card-head">
            <h3>{{ page.name }}</h3>
            <span v-if="page.specId" class="badge badge-spec">spec</span>
          </div>

          <p class="desc">{{ page.description }}</p>

          <dl class="meta">
            <div>
              <dt>Route</dt>
              <dd><code>{{ page.path }}</code></dd>
            </div>
            <div v-if="page.specId">
              <dt>Spec ID</dt>
              <dd><code>{{ page.specId }}</code></dd>
            </div>
            <div v-if="page.scenarios?.length">
              <dt>Scenarios</dt>
              <dd>
                <span v-for="scenario in page.scenarios" :key="scenario" class="badge badge-scenario">
                  {{ scenario }}
                </span>
              </dd>
            </div>
            <div v-if="page.notes">
              <dt>Notes</dt>
              <dd>{{ page.notes }}</dd>
            </div>
          </dl>

          <div class="actions">
            <router-link class="action-button primary-action" :to="page.path">Open</router-link>
            <a
              v-if="page.specId"
              class="action-button secondary-action"
              :href="workbenchUrl(page)"
              target="_blank"
              rel="noopener"
            >
              Workbench
            </a>
          </div>
        </article>
      </div>
    </section>

    <footer class="site-footer">
      <strong>Workbench</strong>
      <p>
        Deep links target <code>{{ workbenchRoot }}</code> and pre-fill the page URL,
        spec ID, and first scenario.
      </p>
    </footer>
  </main>
</template>

<style scoped>
.index-page {
  width: min(1120px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px;
}

.site-header {
  margin-bottom: 24px;
}

.category-section {
  margin-bottom: 24px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.card-grid {
  display: grid;
  gap: 16px;
  padding: 18px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.page-card {
  display: flex;
  min-height: 340px;
  flex-direction: column;
  padding: 20px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.desc {
  margin-bottom: 16px;
  color: var(--muted);
  line-height: 1.6;
}

.meta {
  display: grid;
  gap: 10px;
  margin: 0 0 18px;
  font-size: 0.9rem;
}

.meta > div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
}

.meta dt {
  color: var(--muted);
  font-weight: 800;
}

.meta dd {
  min-width: 0;
  margin: 0;
  line-height: 1.5;
}

.meta code,
.site-footer code {
  padding: 2px 6px;
  background: #f1f5ef;
  border-radius: 4px;
  color: #123c33;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.82rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.3;
  text-transform: lowercase;
}

.badge-spec {
  color: #123c33;
  background: #dff4ea;
}

.badge-scenario {
  max-width: 100%;
  margin: 0 6px 6px 0;
  color: #42514a;
  background: #edf3ef;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
}

.action-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-weight: 800;
  text-decoration: none;
}

.primary-action {
  color: #ffffff;
  background: var(--accent);
}

.primary-action:hover {
  background: var(--accent-dark);
}

.secondary-action {
  color: var(--accent-dark);
  background: #ffffff;
  border-color: #b9cec5;
}

.secondary-action:hover {
  background: #e8f3ef;
}

.site-footer {
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.site-footer strong {
  display: block;
  margin-bottom: 8px;
}

.site-footer p {
  margin-bottom: 0;
  color: var(--muted);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .index-page {
    padding: 18px;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .page-card {
    min-height: 0;
  }

  .meta > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
