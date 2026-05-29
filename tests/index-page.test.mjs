import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('root route renders a validation surface list while preserving inventory route', async () => {
  const router = await readProjectFile('src/router/index.ts');

  assert.match(router, /import IndexPage from '\.\.\/pages\/IndexPage\.vue';/);
  assert.match(router, /path:\s*'\/'[\s\S]*component:\s*IndexPage/);
  assert.doesNotMatch(router, /redirect:\s*'\/inventory'/);
  assert.match(router, /path:\s*'\/inventory'[\s\S]*component:\s*InventoryPage/);
});

test('index page advertises the inventory validation surface and workbench deep link', async () => {
  const indexPage = await readProjectFile('src/pages/IndexPage.vue');

  assert.match(indexPage, /WebAgentFlow Validation Site/);
  assert.match(indexPage, /Inventory Management/);
  assert.match(indexPage, /path:\s*'\/inventory'/);
  assert.match(indexPage, /specId:\s*'inventory'/);
  assert.match(indexPage, /http:\/\/localhost:5174\/exploration\/autonomous/);
  assert.match(indexPage, /workbenchUrl/);
});

test('inventory page uses backend API and exposes CSV download', async () => {
  const inventoryPage = await readProjectFile('src/pages/InventoryPage.vue');
  const viteConfig = await readProjectFile('vite.config.ts');

  assert.match(inventoryPage, /requestJson<InventoryListData>\('\/api\/inventory'\)/);
  assert.match(inventoryPage, /requestJson<InventoryItemData>\(\s*`\/api\/inventory\/\$\{selectedItem\.value\.id\}`/);
  assert.match(inventoryPage, /downloadHref/);
  assert.match(inventoryPage, /Download CSV/);
  assert.match(viteConfig, /\/api/);
  assert.match(viteConfig, /127\.0\.0\.1:8003/);
});
