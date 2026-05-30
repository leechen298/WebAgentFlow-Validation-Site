<script setup lang="ts">
import { computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import enUS from 'ant-design-vue/es/locale/en_US';
import jaJP from 'ant-design-vue/es/locale/ja_JP';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import { currentLocale } from './i18n';

const antdLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
};

const antdLocale = computed(() => antdLocales[currentLocale.value]);
</script>

<template>
  <a-config-provider
    :locale="antdLocale"
    :theme="{
      token: {
        colorPrimary: '#176b5b',
        borderRadius: 6,
        controlHeight: 40,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      },
    }"
  >
    <LanguageSwitcher />
    <router-view />
  </a-config-provider>
</template>
