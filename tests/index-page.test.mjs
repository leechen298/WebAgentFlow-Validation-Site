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

  assert.match(indexPage, /WebAgentFlow Validation Site/);
  assert.match(indexPage, /Inventory Management/);
  assert.match(indexPage, /path:\s*'\/inventory'/);
  assert.match(indexPage, /specId:\s*'inventory'/);
  assert.match(indexPage, /User Directory/);
  assert.match(indexPage, /path:\s*'\/users'/);
  assert.match(indexPage, /specId:\s*'users'/);
  assert.match(indexPage, /http:\/\/localhost:5174\/exploration\/autonomous/);
  assert.match(indexPage, /workbenchUrl/);
  assert.match(indexPage, /Open Inventory Management/);
  assert.match(indexPage, /Open User Directory/);
});

test('inventory page is list-first and moves create/edit forms into a dialog', async () => {
  const inventoryPage = await readProjectFile('src/pages/InventoryPage.vue');
  const viteConfig = await readProjectFile('vite.config.ts');

  assert.match(inventoryPage, /requestJson<InventoryListData>\('\/api\/inventory'\)/);
  assert.match(inventoryPage, /requestJson<InventoryItemData>\(\s*`\/api\/inventory\/\$\{selectedItem\.value\.id\}`/);
  assert.match(inventoryPage, /downloadHref/);
  assert.match(inventoryPage, /Download CSV/);
  assert.match(inventoryPage, /<dialog/);
  assert.match(inventoryPage, /openCreateDialog/);
  assert.match(inventoryPage, /openEditDialog/);
  assert.match(inventoryPage, /New inventory item/);
  assert.doesNotMatch(inventoryPage, /<aside class="forms-column"/);
  assert.doesNotMatch(inventoryPage, /Choose a row to edit\./);
  assert.match(viteConfig, /\/api/);
  assert.match(viteConfig, /127\.0\.0\.1:8003/);
});

test('users page mirrors fixture-site user directory selectors and APIs', async () => {
  const usersPage = await readProjectFile('src/pages/UserDirectoryPage.vue');

  assert.match(usersPage, /User Directory/);
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
});
