import { formatMinorUnits, priceToMinorUnit } from "./money";

type ShippingSettings = {
  shippingFee: string;
  freeShippingThreshold: string | null;
};

type ShippingItem = {
  quantity: number;
  unitPrice: string;
  additionalShippingFee: string;
};

export const calculateShippingFee = (shippingInfo: ShippingSettings, items: ShippingItem[]) => {
  let subtotal = 0n;
  let additionalShippingFee = 0n;

  for (const item of items) {
    const quantity = BigInt(item.quantity);

    subtotal += priceToMinorUnit(item.unitPrice) * quantity;

    //the additional shipping fee of the product variant is charged per puchased unit
    additionalShippingFee += priceToMinorUnit(item.additionalShippingFee) * quantity;
  }

  const baseShippingFee = priceToMinorUnit(shippingInfo.shippingFee);

  //only if the sub total is greater than or equal to the free shipping threshold that the
  //store has saved in our database, we are going to apply free shipping
  //To get free shipping, the subtotal should be greater than or equal to freeShippingThreshold
  //before the added shipping value gets added to the total
  const freeShippingApplied =
    shippingInfo.freeShippingThreshold !== null &&
    subtotal >= priceToMinorUnit(shippingInfo.freeShippingThreshold);

  const standardShippingFee = freeShippingApplied ? 0n : baseShippingFee;

  const totalShippingFee = standardShippingFee + additionalShippingFee;

  return {
    subtotal: formatMinorUnits(subtotal),
    baseShippingFee: formatMinorUnits(baseShippingFee),
    standardShippingFee: formatMinorUnits(standardShippingFee),
    additionalShippingFee: formatMinorUnits(additionalShippingFee),
    totalShippingFee: formatMinorUnits(totalShippingFee),
    freeShippingApplied,
    total: formatMinorUnits(subtotal + totalShippingFee),
  };
};
