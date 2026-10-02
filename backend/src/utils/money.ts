import { ServerError } from "./error";

export const priceToMinorUnit = (price: string): bigint => {
  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    throw new ServerError("Invalid product price stored in the database!");
  }

  const [wholePart, decimalPart] = price.split(".");

  return BigInt(wholePart) * 100n + BigInt(decimalPart ? decimalPart.padEnd(2, "0") : "00");
};

export const formatMinorUnits = (amount: bigint): string => {
  const wholePart = amount / 100n;
  const fraction = (amount % 100n).toString().padStart(2, "0");

  return `${wholePart}.${fraction}`;
};
