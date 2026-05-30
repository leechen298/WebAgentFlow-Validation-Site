import assert from 'node:assert/strict';
import test from 'node:test';

import { createInventoryServer } from '../server/inventoryServer.mjs';

async function startServer() {
  const server = createInventoryServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert.equal(typeof address, 'object');
  assert.ok(address);

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('inventory API lists seeded inventory records', async () => {
  const api = await startServer();

  try {
    const response = await fetch(`${api.baseUrl}/api/inventory`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.code, 0);
    assert.equal(payload.data.items.length, 3);
    assert.deepEqual(
      payload.data.items.map((item) => item.sku),
      ['NB-ALP-001', 'MUG-SKY-014', 'LAM-OAK-022'],
    );
  } finally {
    await api.close();
  }
});

test('inventory API creates records and exports the table as CSV', async () => {
  const api = await startServer();

  try {
    const createResponse = await fetch(`${api.baseUrl}/api/inventory`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: 'PEN-RED-009',
        name: 'Red Marker Pen',
        category: 'Stationery',
        stock: 42,
        status: 'active',
      }),
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.data.item.sku, 'PEN-RED-009');

    const exportResponse = await fetch(`${api.baseUrl}/api/inventory/export.csv`);
    const csv = await exportResponse.text();

    assert.equal(exportResponse.status, 200);
    assert.match(exportResponse.headers.get('content-type') ?? '', /^text\/csv/);
    assert.match(
      exportResponse.headers.get('content-disposition') ?? '',
      /attachment; filename="inventory-export\.csv"/,
    );
    assert.match(csv, /^SKU,Name,Category,Stock,Status,Updated/m);
    assert.match(csv, /PEN-RED-009,Red Marker Pen,Stationery,42,active,/);
  } finally {
    await api.close();
  }
});

test('inventory CSV can localize headers and seeded business values', async () => {
  const api = await startServer();

  try {
    const zhResponse = await fetch(`${api.baseUrl}/api/inventory/export.csv?locale=zh-CN`);
    const zhCsv = await zhResponse.text();

    assert.equal(zhResponse.status, 200);
    assert.match(zhCsv, /^SKU,名称,分类,库存,状态,更新时间/m);
    assert.match(zhCsv, /NB-ALP-001,高山笔记本,文具,24,启用,/);

    const jaResponse = await fetch(`${api.baseUrl}/api/inventory/export.csv?locale=ja-JP`);
    const jaCsv = await jaResponse.text();

    assert.equal(jaResponse.status, 200);
    assert.match(jaCsv, /^SKU,名前,カテゴリー,在庫,ステータス,更新日時/m);
    assert.match(jaCsv, /NB-ALP-001,アルパインノート,文具,24,有効,/);
  } finally {
    await api.close();
  }
});

test('inventory API updates records and filters CSV export by query', async () => {
  const api = await startServer();

  try {
    const listResponse = await fetch(`${api.baseUrl}/api/inventory`);
    const listPayload = await listResponse.json();
    const target = listPayload.data.items.find((item) => item.sku === 'LAM-OAK-022');

    const updateResponse = await fetch(`${api.baseUrl}/api/inventory/${target.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Oak Desk Lamp Pro',
        category: 'Workspace',
        stock: 12,
        status: 'active',
      }),
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.data.item.name, 'Oak Desk Lamp Pro');

    const exportResponse = await fetch(`${api.baseUrl}/api/inventory/export.csv?query=lamp`);
    const csv = await exportResponse.text();

    assert.match(csv, /LAM-OAK-022,Oak Desk Lamp Pro,Workspace,12,active,/);
    assert.doesNotMatch(csv, /NB-ALP-001/);
  } finally {
    await api.close();
  }
});
