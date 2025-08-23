export type InventoryItem = 'key' | 'map' | 'ticket';

export interface InventoryState {
  key: boolean;
  map: boolean;
  ticket: boolean;
}

export class InventoryManager {
  private inventory: InventoryState = { key: false, map: false, ticket: false };

  constructor() {}

  reset(): void {
    this.inventory = { key: false, map: false, ticket: false };
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
    return this.inventory.key && this.inventory.map && this.inventory.ticket;
  }
}
