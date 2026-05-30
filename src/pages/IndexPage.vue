<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type CategoryKey = 'productValidation' | 'listingSearch';

interface ValidationPage {
  id: 'inventory' | 'users';
  categoryKey: CategoryKey;
  path: string;
  notes?: string;
}

const { t } = useI18n();

const pages: ValidationPage[] = [
  {
    id: 'inventory',
    categoryKey: 'productValidation',
    path: '/inventory',
  },
  {
    id: 'users',
    categoryKey: 'listingSearch',
    path: '/users',
  },
];

const byCategory = computed<Record<CategoryKey, ValidationPage[]>>(() => {
  return pages.reduce(
    (grouped, page) => {
      grouped[page.categoryKey].push(page);
      return grouped;
    },
    {
      productValidation: [],
      listingSearch: [],
    } as Record<CategoryKey, ValidationPage[]>,
  );
});

const categoryKeys: CategoryKey[] = ['productValidation', 'listingSearch'];

function categoryAvailability(count: number) {
  return t('index.categoryAvailability', count, { named: { count } });
}
</script>

<template>
  <main class="index-page page-shell">
    <header class="page-header" aria-labelledby="site-title">
      <div>
        <a-typography-text class="eyebrow">{{ t('app.brand') }}</a-typography-text>
        <a-typography-title id="site-title" class="page-title" :level="1">
          {{ t('index.title') }}
        </a-typography-title>
        <a-typography-paragraph class="subtitle">
          {{ t('index.subtitle') }}
        </a-typography-paragraph>
      </div>
    </header>

    <section
      v-for="categoryKey in categoryKeys"
      :key="categoryKey"
      class="surface-section"
      :aria-labelledby="`category-${categoryKey}`"
    >
      <a-card :bordered="false">
        <template #title>
          <div class="section-title-row">
            <div>
              <a-typography-title :id="`category-${categoryKey}`" :level="2" class="section-title">
                {{ t(`index.categories.${categoryKey}`) }}
              </a-typography-title>
              <a-typography-paragraph class="section-count">
                {{ categoryAvailability(byCategory[categoryKey].length) }}
              </a-typography-paragraph>
            </div>
          </div>
        </template>

        <div class="card-grid">
          <a-card
            v-for="page in byCategory[categoryKey]"
            :key="page.id"
            class="page-card"
            :bordered="true"
          >
            <template #title>
              <a-space class="card-title-row" align="center">
                <a-typography-title :level="3" class="card-title">
                  {{ t(`index.pages.${page.id}.name`) }}
                </a-typography-title>
              </a-space>
            </template>

            <a-typography-paragraph class="desc">
              {{ t(`index.pages.${page.id}.description`) }}
            </a-typography-paragraph>

            <a-space class="actions" wrap>
              <router-link :to="page.path" custom v-slot="{ navigate }">
                <a-button type="primary" @click="navigate">
                  {{ t(`index.pages.${page.id}.action`) }}
                </a-button>
              </router-link>
            </a-space>
          </a-card>
        </div>
      </a-card>
    </section>
  </main>
</template>

<style scoped>
.index-page {
  min-height: 100vh;
}

.surface-section {
  margin-bottom: 18px;
}

.section-title,
.section-count,
.card-title {
  margin-bottom: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.page-card {
  min-height: 100%;
}

.card-title-row {
  max-width: 100%;
}

.desc {
  min-height: 54px;
  color: var(--muted);
}

.actions {
  margin-top: 4px;
}

@media (max-width: 720px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
