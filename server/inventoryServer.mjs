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

const seedUsers = [
  seedUser(1, 'alice', 'alice@example.com', 'admin', 'active', '2024-03-15', 'CN/Zhejiang/Hangzhou', 'Engineering', '2026-04-17T09:30:00'),
  seedUser(2, 'bob', 'bob@example.com', 'user', 'active', '2024-07-22', 'CN/Zhejiang/Ningbo', 'Sales', '2026-04-16T14:15:00'),
  seedUser(3, 'carol', 'carol@example.com', 'user', 'active', '2025-01-08', 'CN/Jiangsu/Suzhou', 'Engineering', '2026-04-18T08:45:00'),
  seedUser(4, 'dave', 'dave@example.com', 'admin', 'disabled', '2023-11-03', 'CN/Beijing/Chaoyang', 'Operations', '2025-12-01T11:20:00'),
  seedUser(5, 'eve', 'eve@example.com', 'guest', 'active', '2025-09-14', 'US/California/San Jose', 'Marketing', '2026-04-15T16:00:00'),
  seedUser(6, 'frank', 'frank@example.com', 'user', 'active', '2024-05-20', 'CN/Jiangsu/Nanjing', 'Engineering', '2026-04-18T10:10:00'),
  seedUser(7, 'grace', 'grace@example.com', 'user', 'disabled', '2024-02-28', 'CN/Shanghai/Pudong', 'Finance', '2025-11-10T13:05:00'),
  seedUser(8, 'henry', 'henry@example.com', 'admin', 'active', '2023-06-01', 'CN/Beijing/Haidian', 'Engineering', '2026-04-17T22:40:00'),
  seedUser(9, 'irene', 'irene@example.com', 'user', 'active', '2025-03-30', 'CN/Guangdong/Shenzhen', 'Sales', '2026-04-16T09:50:00'),
  seedUser(10, 'jack', 'jack@example.com', 'guest', 'disabled', '2024-12-05', 'US/New York/Brooklyn', 'Marketing', '2025-10-18T12:30:00'),
  seedUser(11, 'karen', 'karen@example.com', 'user', 'active', '2025-06-11', 'CN/Zhejiang/Hangzhou', 'Operations', '2026-04-18T07:15:00'),
  seedUser(12, 'leo', 'leo@example.com', 'user', 'active', '2024-08-19', 'CN/Shanghai/Xuhui', 'Engineering', '2026-04-14T19:25:00'),
  seedUser(13, 'mia', 'mia@example.com', 'admin', 'active', '2024-10-07', 'CN/Jiangsu/Suzhou', 'Finance', '2026-04-17T15:00:00'),
  seedUser(14, 'nathan', 'nathan@example.com', 'user', 'active', '2025-02-02', 'CN/Beijing/Chaoyang', 'Engineering', '2026-04-18T11:35:00'),
  seedUser(15, 'olivia', 'olivia@example.com', 'guest', 'active', '2025-11-25', 'US/California/San Francisco', 'Marketing', '2026-04-15T10:00:00'),
];

export function createInventoryServer() {
  const items = seedItems.map((item) => ({ ...item }));
  const users = seedUsers.map((user) => ({ ...user }));

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

      if (request.method === 'GET' && isUserOptionsPath(url.pathname)) {
        sendJson(response, 200, ok(buildUserOptions(users)));
        return;
      }

      if (request.method === 'GET' && isUsersListPath(url.pathname)) {
        sendJson(response, 200, ok(listUsers(users, url.searchParams)));
        return;
      }

      const userMatch = url.pathname.match(/^\/(?:api|validation-api)\/users\/(\d+)$/);
      if (request.method === 'GET' && userMatch) {
        const id = Number(userMatch[1]);
        const user = users.find((candidate) => candidate.id === id);

        if (!user) {
          sendJson(response, 404, error(404, `User not found: id=${id}`));
          return;
        }

        sendJson(response, 200, ok(user));
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

function seedUser(id, name, email, role, status, registeredAt, region, department, lastLoginAt) {
  return {
    id,
    name,
    email,
    role,
    status,
    registered_at: registeredAt,
    region,
    department,
    last_login_at: lastLoginAt,
  };
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

function isUsersListPath(pathname) {
  return pathname === '/api/users' || pathname === '/validation-api/users';
}

function isUserOptionsPath(pathname) {
  return (
    pathname === '/api/users/meta/options' ||
    pathname === '/validation-api/users/meta/options'
  );
}

function listUsers(users, searchParams) {
  let filtered = [...users];

  const name = searchParams.get('name')?.trim().toLowerCase();
  const email = searchParams.get('email')?.trim().toLowerCase();
  const role = searchParams.get('role')?.trim();
  const status = searchParams.get('status')?.trim();
  const registeredFrom = searchParams.get('registered_from')?.trim();
  const registeredTo = searchParams.get('registered_to')?.trim();
  const regionPrefix = searchParams.get('region_prefix')?.trim();
  const month = searchParams.get('month')?.trim();
  const department = searchParams.get('department')?.trim();
  const sortBy = searchParams.get('sort_by')?.trim();
  const sortOrder = searchParams.get('sort_order') === 'desc' ? 'desc' : 'asc';

  if (name) {
    filtered = filtered.filter((user) => user.name.toLowerCase().includes(name));
  }

  if (email) {
    filtered = filtered.filter((user) => user.email.toLowerCase().includes(email));
  }

  if (role) {
    filtered = filtered.filter((user) => user.role === role);
  }

  if (status) {
    filtered = filtered.filter((user) => user.status === status);
  }

  if (registeredFrom) {
    filtered = filtered.filter((user) => user.registered_at >= registeredFrom);
  }

  if (registeredTo) {
    filtered = filtered.filter((user) => user.registered_at <= registeredTo);
  }

  if (regionPrefix) {
    filtered = filtered.filter((user) => user.region.startsWith(regionPrefix));
  }

  if (/^\d{4}-\d{2}$/.test(month ?? '')) {
    filtered = filtered.filter((user) => user.registered_at.startsWith(`${month}-`));
  }

  if (department) {
    const departments = new Set(
      department
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );

    if (departments.size > 0) {
      filtered = filtered.filter((user) => departments.has(user.department));
    }
  }

  if (sortBy && ['id', 'name', 'email', 'role', 'status', 'registered_at'].includes(sortBy)) {
    filtered.sort((a, b) => {
      const left = String(a[sortBy]);
      const right = String(b[sortBy]);
      return sortOrder === 'desc' ? right.localeCompare(left) : left.localeCompare(right);
    });
  }

  return {
    total: filtered.length,
    items: filtered,
  };
}

function buildUserOptions(users) {
  return {
    roles: uniqueSorted(users.map((user) => user.role)),
    statuses: uniqueSorted(users.map((user) => user.status)),
    departments: uniqueSorted(users.map((user) => user.department)),
    regions: buildRegionTree(users),
  };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function buildRegionTree(users) {
  const tree = new Map();

  for (const user of users) {
    const [country, province, city] = user.region.split('/');

    if (!country || !province || !city) {
      continue;
    }

    if (!tree.has(country)) {
      tree.set(country, new Map());
    }

    const provinces = tree.get(country);
    if (!provinces.has(province)) {
      provinces.set(province, new Set());
    }

    provinces.get(province).add(city);
  }

  return [...tree.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([country, provinces]) => ({
      value: country,
      label: country,
      children: [...provinces.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([province, cities]) => ({
          value: province,
          label: province,
          children: [...cities]
            .sort((left, right) => left.localeCompare(right))
            .map((city) => ({ value: city, label: city })),
        })),
    }));
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
