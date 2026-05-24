export type InventoryStatus = 'active' | 'paused';

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  status: InventoryStatus;
  updatedAt: string;
};
