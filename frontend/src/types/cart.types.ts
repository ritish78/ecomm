export type CartStore = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type CartItem = {
  id: string;
  storeId: string;
  variantId: string;
  quantity: number;
  store: CartStore | null;
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  primaryImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
  variant: {
    id: string;
    weight: string;
    unit: "g" | "kg" | "ml" | "l" | "pc";
    price: string;
    stock: number;
    isAvailable: boolean;
    discontinuedAt: string | null;
  } | null;
  unitPrice: string | null;
  lineTotal: string | null;
  purchaseable: boolean;
  issues: string[];
};

export type CartDetailsData = {
  id: string | null;
  updatedAt: string | null;
  itemCount: number;
  totalQuantity: number;
  stores: {
    storeId: string;
    store: CartStore | null;
    items: CartItem[];
    purchaseableSubtotal: string;
  }[];
  purchaseableSubtotal: string;
  readyForCheckout: boolean;
};
