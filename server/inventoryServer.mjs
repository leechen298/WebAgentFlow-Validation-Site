import { createServer } from 'node:http';

const VALID_STATUSES = new Set(['active', 'paused']);

const seedItems = [
  {
    id: 'inv-001',
    sku: 'NB-ALP-001',
    name: 'Alpine Notebook',
    category: 'Stationery',
    stock: 24,
    status: 'active',
    updatedAt: '2026-05-24 09:00',
  },
  {
    id: 'inv-002',
    sku: 'MUG-SKY-014',
    name: 'Skyline Mug',
    category: 'Office',
    stock: 18,
    status: 'active',
    updatedAt: '2026-05-24 09:10',
  },
  {
    id: 'inv-003',
    sku: 'LAM-OAK-022',
    name: 'Oak Desk Lamp',
    category: 'Workspace',
    stock: 9,
    status: 'paused',
    updatedAt: '2026-05-24 09:25',
  },
];

export function createInventoryServer() {
  const items = seedItems.map((item) => ({ ...item }));

  return createServer(async (request, response) => {
    setCorsHeaders(response);

    if (request.method === 'OPTIONS') {
      sendEmpty(response, 204);
      return;
    }

    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(response, 200, { status: 'ok' });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/inventory') {
        sendJson(response, 200, ok({ items }));
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/inventory') {
        const payload = await readJsonBody(request);
        const nextItem = buildInventoryItem(payload);
        items.unshift(nextItem);
        sendJson(response, 201, ok({ item: nextItem }));
        return;
      }

      const itemMatch = url.pathname.match(/^\/api\/inventory\/([^/]+)$/);
      if (request.method === 'PUT' && itemMatch) {
        const id = decodeURIComponent(itemMatch[1]);
        const index = items.findIndex((item) => item.id === id);

        if (index === -1) {
          sendJson(response, 404, error(404, `Inventory item not found: ${id}`));
          return;
        }

        const payload = await readJsonBody(request);
        const updatedItem = updateInventoryItem(items[index], payload);
        items[index] = updatedItem;
        sendJson(response, 200, ok({ item: updatedItem }));
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/inventory/export.csv') {
        const query = url.searchParams.get('query') ?? '';
        const rows = filterItems(items, query);
        sendCsv(response, rows);
        return;
      }

      sendJson(response, 404, error(404, 'Not found.'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.';
      const statusCode = message.startsWith('Invalid ') ? 400 : 500;
      sendJson(response, statusCode, error(statusCode, message));
    }
  });
}

function ok(data) {
  return { code: 0, msg: 'ok', data };
}

function error(code, msg) {
  return { code, msg, data: null };
}

function setCorsHeaders(response) {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-methods', 'GET,POST,PUT,OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendCsv(response, rows) {
  const csv = [
    ['SKU', 'Name', 'Category', 'Stock', 'Status', 'Updated'],
    ...rows.map((item) => [
      item.sku,
      item.name,
      item.category,
      String(item.stock),
      item.status,
      item.updatedAt,
    ]),
  ]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  response.writeHead(200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': 'attachment; filename="inventory-export.csv"',
  });
  response.end(`${csv}\n`);
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode);
  response.end();
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  if (!body.trim()) {
    return {};
  }

  return JSON.parse(body);
}

function buildInventoryItem(payload) {
  const sku = stringField(payload, 'sku');
  const name = stringField(payload, 'name');
  const category = stringField(payload, 'category');
  const stock = stockField(payload);
  const status = statusField(payload);

  return {
    id: `inv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    sku,
    name,
    category,
    stock,
    status,
    updatedAt: formatTimestamp(),
  };
}

function updateInventoryItem(item, payload) {
  return {
    ...item,
    name: stringField(payload, 'name'),
    category: stringField(payload, 'category'),
    stock: stockField(payload),
    status: statusField(payload),
    updatedAt: formatTimestamp(),
  };
}

function stringField(payload, key) {
  const value = typeof payload?.[key] === 'string' ? payload[key].trim() : '';

  if (!value) {
    throw new Error(`Invalid ${key}: value is required.`);
  }

  return value;
}

function stockField(payload) {
  const value = Number(payload?.stock);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Invalid stock: value must be a non-negative integer.');
  }

  return value;
}

function statusField(payload) {
  const status = payload?.status;

  if (!VALID_STATUSES.has(status)) {
    throw new Error('Invalid status: expected active or paused.');
  }

  return status;
}

function filterItems(items, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    [item.sku, item.name, item.category].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}

function escapeCsvCell(value) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function formatTimestamp() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date()).replace(',', '');
}
