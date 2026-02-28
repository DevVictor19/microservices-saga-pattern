export interface ItemToIncrement {
  itemId: number;
  quantity: number;
}

export abstract class ItemRepository {
  abstract incrementStock(items: ItemToIncrement[]): Promise<void>;
}
