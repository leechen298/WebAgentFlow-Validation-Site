<script setup lang="ts">
import { computed } from 'vue';
import { GlobalOutlined } from '@ant-design/icons-vue';
import { useI18n } from 'vue-i18n';
import { currentLocale, localeOptions, setLocale, type SupportedLocale } from '../i18n';

const { t } = useI18n();

const selectedLocale = computed({
  get: () => currentLocale.value,
  set: (value: SupportedLocale) => setLocale(value),
});
</script>

<template>
  <div class="language-switcher">
    <span class="language-switcher__label">
      <GlobalOutlined />
      {{ t('app.language') }}
    </span>
    <a-select
      v-model:value="selectedLocale"
      class="language-switcher__select"
      :aria-label="t('app.language')"
      size="small"
    >
      <a-select-option v-for="option in localeOptions" :key="option.value" :value="option.value">
        {{ t(`app.languages.${option.value}`) }}
      </a-select-option>
    </a-select>
  </div>
</template>

<style scoped>
.language-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
}

.language-switcher__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #40534a;
  font-size: 0.86rem;
  font-weight: 700;
  white-space: nowrap;
}

.language-switcher__select {
  width: 112px;
}

@media (max-width: 720px) {
  .language-switcher {
    position: static;
    width: calc(100% - 36px);
    justify-content: space-between;
    margin: 12px 18px 0;
  }
}
</style>
