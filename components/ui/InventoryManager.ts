export type InventoryItem = 'item1' | 'item2' | 'item3';

export interface InventoryState {
  item1: boolean;
  item2: boolean;
  item3: boolean;
}

export class InventoryManager {
  private inventory: InventoryState = { item1: false, item2: false, item3: false };

  constructor() {}

  reset(): void {
    this.inventory = { item1: false, item2: false, item3: false };
  }

  collect(item: InventoryItem): void {
    this.inventory[item] = true;
  }

  hasItem(item: InventoryItem): boolean {
    return this.inventory[item];
  }

  getState(): InventoryState {
    return { ...this.inventory };
  }

  hasAllItems(): boolean {
    return this.inventory.item1 && this.inventory.item2 && this.inventory.item3;
  }
}
