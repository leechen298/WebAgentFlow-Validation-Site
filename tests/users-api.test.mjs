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

test('users API lists fixture-style seeded users', async () => {
  const api = await startServer();

  try {
    const response = await fetch(`${api.baseUrl}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.code, 0);
    assert.equal(payload.data.total, 15);
    assert.equal(payload.data.items[0].name, 'alice');
    assert.equal(payload.data.items[0].email, 'alice@example.com');
  } finally {
    await api.close();
  }
});

test('users API filters by text, status, region, month, and department', async () => {
  const api = await startServer();

  try {
    const nameResponse = await fetch(`${api.baseUrl}/api/users?name=alice`);
    const namePayload = await nameResponse.json();
    assert.equal(namePayload.data.total, 1);
    assert.equal(namePayload.data.items[0].name, 'alice');

    const statusResponse = await fetch(`${api.baseUrl}/api/users?status=disabled`);
    const statusPayload = await statusResponse.json();
    assert.deepEqual(
      statusPayload.data.items.map((user) => user.name),
      ['dave', 'grace', 'jack'],
    );

    const regionResponse = await fetch(`${api.baseUrl}/api/users?region_prefix=CN%2FZhejiang`);
    const regionPayload = await regionResponse.json();
    assert.deepEqual(
      regionPayload.data.items.map((user) => user.name),
      ['alice', 'bob', 'karen'],
    );

    const monthResponse = await fetch(`${api.baseUrl}/api/users?month=2024-03`);
    const monthPayload = await monthResponse.json();
    assert.deepEqual(
      monthPayload.data.items.map((user) => user.name),
      ['alice'],
    );

    const departmentResponse = await fetch(
      `${api.baseUrl}/api/users?department=Engineering,Finance`,
    );
    const departmentPayload = await departmentResponse.json();
    assert.equal(departmentPayload.data.total, 8);
  } finally {
    await api.close();
  }
});

test('users API serves metadata and single-user details', async () => {
  const api = await startServer();

  try {
    const optionsResponse = await fetch(`${api.baseUrl}/api/users/meta/options`);
    const optionsPayload = await optionsResponse.json();

    assert.equal(optionsResponse.status, 200);
    assert.deepEqual(optionsPayload.data.roles, ['admin', 'guest', 'user']);
    assert.ok(optionsPayload.data.departments.includes('Engineering'));
    assert.ok(optionsPayload.data.regions.find((region) => region.value === 'CN'));

    const detailResponse = await fetch(`${api.baseUrl}/api/users/1`);
    const detailPayload = await detailResponse.json();

    assert.equal(detailResponse.status, 200);
    assert.equal(detailPayload.data.name, 'alice');
    assert.equal(detailPayload.data.region, 'CN/Zhejiang/Hangzhou');

    const missingResponse = await fetch(`${api.baseUrl}/api/users/999`);
    const missingPayload = await missingResponse.json();

    assert.equal(missingResponse.status, 404);
    assert.match(missingPayload.msg, /User not found/);
  } finally {
    await api.close();
  }
});
