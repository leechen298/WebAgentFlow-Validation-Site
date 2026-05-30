import { computed } from 'vue';
import { createI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import enUSMessages from './messages/en-US';
import jaJPMessages from './messages/ja-JP';
import zhCNMessages from './messages/zh-CN';

export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP';

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN';
export const LOCALE_STORAGE_KEY = 'webagentflow.validation.locale';

export const supportedLocales: SupportedLocale[] = ['zh-CN', 'en-US', 'ja-JP'];

export const localeOptions = supportedLocales.map((locale) => ({
  value: locale,
  label: locale,
}));

const messages = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
  'ja-JP': jaJPMessages,
};

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
});

export const currentLocale = computed<SupportedLocale>({
  get: () => resolveSupportedLocale(i18n.global.locale.value),
  set: setLocale,
});

syncLocaleSideEffects(currentLocale.value);

export function setLocale(locale: SupportedLocale) {
  const nextLocale = resolveSupportedLocale(locale);
  i18n.global.locale.value = nextLocale;
  persistLocale(nextLocale);
  syncLocaleSideEffects(nextLocale);
}

export function resolveSupportedLocale(value: string | null | undefined): SupportedLocale {
  if (value === 'zh-CN' || value === 'zh' || value?.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }

  if (value === 'ja-JP' || value === 'ja' || value?.toLowerCase().startsWith('ja')) {
    return 'ja-JP';
  }

  if (value === 'en-US' || value === 'en' || value?.toLowerCase().startsWith('en')) {
    return 'en-US';
  }

  return DEFAULT_LOCALE;
}

function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale) {
    return resolveSupportedLocale(storedLocale);
  }

  return DEFAULT_LOCALE;
}

function persistLocale(locale: SupportedLocale) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

function syncLocaleSideEffects(locale: SupportedLocale) {
  dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : locale === 'ja-JP' ? 'ja' : 'en');

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.title = i18n.global.t('app.documentTitle');
  }
}
