import type { InventoryItem } from '../types/inventory';

export const inventorySeed: InventoryItem[] = [
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
