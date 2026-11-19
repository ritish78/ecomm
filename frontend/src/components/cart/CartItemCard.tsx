"use client";

import { CartItem } from "@/types/cart.types";
import { useState } from "react";

type Props = {
  item: CartItem;
  currency: string;
  isSubmitting: boolean;
  onUpdate: (item: CartItem, quantity: number) => Promise<void>;
  onRemove: (item: CartItem) => Promise<void>;
};

export default function CartItemCard({
  item,
  currency,
  isSubmitting,
  onUpdate,
  onRemove,
}: Props) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [failedImageUrl, setFailedImageUrl] = useState(false);

  const productName = item.product?.name ?? "Unavailable Product"; //"Could not fetch product name" //lets use "Unavailable Product" instead
  const imageUrl = item.primaryImage?.imageUrl; //imageUrl already has default image fallback
  const requestedQuantity = Number(quantity);
}
