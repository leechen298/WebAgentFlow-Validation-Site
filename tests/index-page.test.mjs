import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('root route renders a validation surface list while preserving inventory and users routes', async () => {
  const router = await readProjectFile('src/router/index.ts');

  assert.match(router, /import IndexPage from '\.\.\/pages\/IndexPage\.vue';/);
  assert.match(router, /import UserDirectoryPage from '\.\.\/pages\/UserDirectoryPage\.vue';/);
  assert.match(router, /path:\s*'\/'[\s\S]*component:\s*IndexPage/);
  assert.doesNotMatch(router, /redirect:\s*'\/inventory'/);
  assert.match(router, /path:\s*'\/inventory'[\s\S]*component:\s*InventoryPage/);
  assert.match(router, /path:\s*'\/users'[\s\S]*component:\s*UserDirectoryPage/);
});

test('index page advertises validation surfaces with simple route links', async () => {
  const indexPage = await readProjectFile('src/pages/IndexPage.vue');
  const zhMessages = await readProjectFile('src/i18n/messages/zh-CN.ts');
  const enMessages = await readProjectFile('src/i18n/messages/en-US.ts');
  const jaMessages = await readProjectFile('src/i18n/messages/ja-JP.ts');

  assert.match(indexPage, /t\('app\.brand'\)/);
  assert.match(indexPage, /t\('index\.title'\)/);
  assert.match(indexPage, /path:\s*'\/inventory'/);
  assert.match(indexPage, /specId:\s*'inventory'/);
  assert.match(indexPage, /path:\s*'\/users'/);
  assert.match(indexPage, /specId:\s*'users'/);
  assert.match(indexPage, /http:\/\/localhost:5174\/exploration\/autonomous/);
  assert.match(indexPage, /workbenchUrl/);
  assert.match(indexPage, /index\.pages\.\$\{page\.id\}\.action/);
  assert.match(zhMessages, /库存管理/);
  assert.match(enMessages, /Inventory Management/);
  assert.match(jaMessages, /在庫管理/);
});

test('frontend uses Ant Design Vue and default Chinese i18n wiring', async () => {
  const packageJson = JSON.parse(await readProjectFile('package.json'));
  const main = await readProjectFile('src/main.ts');
  const app = await readProjectFile('src/App.vue');
  const i18nIndex = await readProjectFile('src/i18n/index.ts');
  const zhMessages = await readProjectFile('src/i18n/messages/zh-CN.ts');
  const enMessages = await readProjectFile('src/i18n/messages/en-US.ts');
  const jaMessages = await readProjectFile('src/i18n/messages/ja-JP.ts');

  assert.ok(packageJson.dependencies['ant-design-vue']);
  assert.ok(packageJson.dependencies['@ant-design/icons-vue']);
  assert.ok(packageJson.dependencies['vue-i18n']);
  assert.ok(packageJson.dependencies.dayjs);
  assert.match(main, /import Antd from 'ant-design-vue'/);
  assert.match(main, /app\.use\(Antd\)/);
  assert.match(main, /ant-design-vue\/dist\/reset\.css/);
  assert.match(main, /app\.use\(i18n\)/);
  assert.match(app, /a-config-provider/);
  assert.match(app, /LanguageSwitcher/);
  assert.match(i18nIndex, /DEFAULT_LOCALE[^=]*=\s*'zh-CN'/);
  assert.match(i18nIndex, /webagentflow\.validation\.locale/);
  assert.match(zhMessages, /验证页面/);
  assert.match(enMessages, /Validation Surfaces/);
  assert.match(jaMessages, /検証画面/);
});

test('inventory page is list-first and moves create/edit forms into a dialog', async () => {
  const inventoryPage = await readProjectFile('src/pages/InventoryPage.vue');
  const viteConfig = await readProjectFile('vite.config.ts');

  assert.match(inventoryPage, /requestJson<InventoryListData>\('\/api\/inventory'\)/);
  assert.match(inventoryPage, /requestJson<InventoryItemData>\(\s*`\/api\/inventory\/\$\{selectedItem\.value\.id\}`/);
  assert.match(inventoryPage, /downloadHref/);
  assert.match(inventoryPage, /currentLocale/);
  assert.match(inventoryPage, /displayInventoryItem/);
  assert.match(inventoryPage, /a-table/);
  assert.match(inventoryPage, /a-modal/);
  assert.match(inventoryPage, /a-input-search/);
  assert.match(inventoryPage, /a-input-number/);
  assert.match(inventoryPage, /openCreateDialog/);
  assert.match(inventoryPage, /openEditDialog/);
  assert.match(inventoryPage, /inventory\.actions\.create/);
  assert.doesNotMatch(inventoryPage, /<aside class="forms-column"/);
  assert.doesNotMatch(inventoryPage, /Choose a row to edit\./);
  assert.match(viteConfig, /\/api/);
  assert.match(viteConfig, /127\.0\.0\.1:8003/);
});

test('users page mirrors fixture-site user directory selectors and APIs', async () => {
  const usersPage = await readProjectFile('src/pages/UserDirectoryPage.vue');
  const enMessages = await readProjectFile('src/i18n/messages/en-US.ts');

  assert.match(usersPage, /users\.title/);
  assert.match(enMessages, /User Directory/);
  assert.match(usersPage, /id="search-name"/);
  assert.match(usersPage, /id="search-email"/);
  assert.match(usersPage, /id="search-role"/);
  assert.match(usersPage, /id="search-status"/);
  assert.match(usersPage, /id="search-registered-from"/);
  assert.match(usersPage, /id="search-registered-to"/);
  assert.match(usersPage, /id="search-region"/);
  assert.match(usersPage, /id="search-month"/);
  assert.match(usersPage, /id="btn-reset"/);
  assert.match(usersPage, /id="btn-search"/);
  assert.match(usersPage, /\/api\/users\/meta\/options/);
  assert.match(usersPage, /\/api\/users/);
  assert.match(usersPage, /data-testid="user-detail"/);
  assert.match(usersPage, /displayUser/);
  assert.match(usersPage, /users\.fields\.region[\s\S]*dataIndex:\s*'displayRegion'/);
  assert.match(usersPage, /id="btn-export-users"/);
  assert.match(usersPage, /downloadCurrentUsers/);
  assert.match(usersPage, /buildUsersExcelWorkbook/);
  assert.match(usersPage, /application\/vnd\.ms-excel/);
  assert.match(usersPage, /users-export\.xls/);
  assert.match(usersPage, /users\.actions\.downloadExcel/);
  assert.match(usersPage, /a-table/);
  assert.match(usersPage, /a-date-picker/);
  assert.match(usersPage, /a-radio-group/);
  assert.match(usersPage, /a-descriptions/);
});
