import type { SupportedLocale } from './index';

export type LocalizedText = Record<SupportedLocale, string>;

const inventoryNames: Record<string, LocalizedText> = {
  'Alpine Notebook': {
    'zh-CN': '高山笔记本',
    'en-US': 'Alpine Notebook',
    'ja-JP': 'アルパインノート',
  },
  'Skyline Mug': {
    'zh-CN': '天际线马克杯',
    'en-US': 'Skyline Mug',
    'ja-JP': 'スカイラインマグ',
  },
  'Oak Desk Lamp': {
    'zh-CN': '橡木台灯',
    'en-US': 'Oak Desk Lamp',
    'ja-JP': 'オークデスクランプ',
  },
};

const inventoryCategories: Record<string, LocalizedText> = {
  Stationery: {
    'zh-CN': '文具',
    'en-US': 'Stationery',
    'ja-JP': '文具',
  },
  Office: {
    'zh-CN': '办公用品',
    'en-US': 'Office',
    'ja-JP': 'オフィス用品',
  },
  Workspace: {
    'zh-CN': '办公空间',
    'en-US': 'Workspace',
    'ja-JP': 'ワークスペース',
  },
};

const userNames: Record<string, LocalizedText> = {
  alice: { 'zh-CN': '爱丽丝', 'en-US': 'alice', 'ja-JP': 'アリス' },
  bob: { 'zh-CN': '鲍勃', 'en-US': 'bob', 'ja-JP': 'ボブ' },
  carol: { 'zh-CN': '卡罗尔', 'en-US': 'carol', 'ja-JP': 'キャロル' },
  dave: { 'zh-CN': '戴夫', 'en-US': 'dave', 'ja-JP': 'デイブ' },
  eve: { 'zh-CN': '伊芙', 'en-US': 'eve', 'ja-JP': 'イブ' },
  frank: { 'zh-CN': '弗兰克', 'en-US': 'frank', 'ja-JP': 'フランク' },
  grace: { 'zh-CN': '格蕾丝', 'en-US': 'grace', 'ja-JP': 'グレース' },
  henry: { 'zh-CN': '亨利', 'en-US': 'henry', 'ja-JP': 'ヘンリー' },
  irene: { 'zh-CN': '艾琳', 'en-US': 'irene', 'ja-JP': 'アイリーン' },
  jack: { 'zh-CN': '杰克', 'en-US': 'jack', 'ja-JP': 'ジャック' },
  karen: { 'zh-CN': '凯伦', 'en-US': 'karen', 'ja-JP': 'カレン' },
  leo: { 'zh-CN': '利奥', 'en-US': 'leo', 'ja-JP': 'レオ' },
  mia: { 'zh-CN': '米娅', 'en-US': 'mia', 'ja-JP': 'ミア' },
  nathan: { 'zh-CN': '内森', 'en-US': 'nathan', 'ja-JP': 'ネイサン' },
  olivia: { 'zh-CN': '奥利维亚', 'en-US': 'olivia', 'ja-JP': 'オリビア' },
};

const departments: Record<string, LocalizedText> = {
  Engineering: { 'zh-CN': '工程', 'en-US': 'Engineering', 'ja-JP': 'エンジニアリング' },
  Sales: { 'zh-CN': '销售', 'en-US': 'Sales', 'ja-JP': '営業' },
  Operations: { 'zh-CN': '运营', 'en-US': 'Operations', 'ja-JP': 'オペレーション' },
  Marketing: { 'zh-CN': '市场', 'en-US': 'Marketing', 'ja-JP': 'マーケティング' },
  Finance: { 'zh-CN': '财务', 'en-US': 'Finance', 'ja-JP': '財務' },
};

const regions: Record<string, LocalizedText> = {
  CN: { 'zh-CN': '中国', 'en-US': 'CN', 'ja-JP': '中国' },
  US: { 'zh-CN': '美国', 'en-US': 'US', 'ja-JP': '米国' },
  Zhejiang: { 'zh-CN': '浙江', 'en-US': 'Zhejiang', 'ja-JP': '浙江' },
  Jiangsu: { 'zh-CN': '江苏', 'en-US': 'Jiangsu', 'ja-JP': '江蘇' },
  Beijing: { 'zh-CN': '北京', 'en-US': 'Beijing', 'ja-JP': '北京' },
  Shanghai: { 'zh-CN': '上海', 'en-US': 'Shanghai', 'ja-JP': '上海' },
  Guangdong: { 'zh-CN': '广东', 'en-US': 'Guangdong', 'ja-JP': '広東' },
  California: { 'zh-CN': '加利福尼亚', 'en-US': 'California', 'ja-JP': 'カリフォルニア' },
  'New York': { 'zh-CN': '纽约', 'en-US': 'New York', 'ja-JP': 'ニューヨーク' },
  Hangzhou: { 'zh-CN': '杭州', 'en-US': 'Hangzhou', 'ja-JP': '杭州' },
  Ningbo: { 'zh-CN': '宁波', 'en-US': 'Ningbo', 'ja-JP': '寧波' },
  Suzhou: { 'zh-CN': '苏州', 'en-US': 'Suzhou', 'ja-JP': '蘇州' },
  Chaoyang: { 'zh-CN': '朝阳', 'en-US': 'Chaoyang', 'ja-JP': '朝陽' },
  'San Jose': { 'zh-CN': '圣何塞', 'en-US': 'San Jose', 'ja-JP': 'サンノゼ' },
  Nanjing: { 'zh-CN': '南京', 'en-US': 'Nanjing', 'ja-JP': '南京' },
  Pudong: { 'zh-CN': '浦东', 'en-US': 'Pudong', 'ja-JP': '浦東' },
  Haidian: { 'zh-CN': '海淀', 'en-US': 'Haidian', 'ja-JP': '海淀' },
  Shenzhen: { 'zh-CN': '深圳', 'en-US': 'Shenzhen', 'ja-JP': '深セン' },
  Brooklyn: { 'zh-CN': '布鲁克林', 'en-US': 'Brooklyn', 'ja-JP': 'ブルックリン' },
  Xuhui: { 'zh-CN': '徐汇', 'en-US': 'Xuhui', 'ja-JP': '徐匯' },
  'San Francisco': { 'zh-CN': '旧金山', 'en-US': 'San Francisco', 'ja-JP': 'サンフランシスコ' },
};

export function displayInventoryName(value: string, locale: SupportedLocale): string {
  return localize(inventoryNames, value, locale);
}

export function displayInventoryCategory(value: string, locale: SupportedLocale): string {
  return localize(inventoryCategories, value, locale);
}

export function displayUserName(value: string, locale: SupportedLocale): string {
  return localize(userNames, value, locale);
}

export function rawUserNameForExactDisplay(value: string, locale: SupportedLocale): string {
  const normalizedValue = value.trim().toLowerCase();
  const match = Object.entries(userNames).find(([rawName, labels]) => {
    return [rawName, labels[locale]].some((candidate) =>
      candidate.toLowerCase() === normalizedValue,
    );
  });

  return match?.[0] ?? value.trim();
}

export function displayDepartment(value: string, locale: SupportedLocale): string {
  return localize(departments, value, locale);
}

export function displayRegion(value: string, locale: SupportedLocale): string {
  return value
    .split('/')
    .map((part) => localize(regions, part, locale))
    .join(' / ');
}

export function matchesLocalizedUserName(rawName: string, query: string, locale: SupportedLocale): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return [rawName, displayUserName(rawName, locale)].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function localize(
  dictionary: Record<string, LocalizedText>,
  value: string,
  locale: SupportedLocale,
): string {
  return dictionary[value]?.[locale] ?? value;
}
