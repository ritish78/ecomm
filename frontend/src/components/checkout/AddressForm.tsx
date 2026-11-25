"use client";

import React, { useRef, useState, type InputHTMLAttributes } from "react";

import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

export type DeliveryAddress = {
  id: string;
  isDefault: boolean;
  recipientName: string;
  addressLineOne: string;
  addressLineTwo: string | null;
  locality: string;
  region: string;
  postalCode: string | null;
  district: string | null;
  wardNumber: number | null;
  countryCode: "AU" | "NP";
};

type Props = {
  onSaved: (address: DeliveryAddress) => void;
  onLogin: () => void;
};

type AddressFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function AddressField({ label, ...input }: AddressFieldProps) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}

      <input
        {...input}
        className="min-h-11 w-full rounded-xl border border-(--brand-border) bg-white px-3"
      />
    </label>
  );
}

export default function AddressForm({ onSaved, onLogin }: Props) {
  const [countryCode, setCountryCode] = useState("AU");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const savingRef = useRef(false);

  async function saveAddress(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingRef.current) return;

    const fields = Object.fromEntries(new FormData(event.currentTarget));

    //the backend expects wardNumber as a number for addresses in Nepal
    const address =
      countryCode === "NP"
        ? { ...fields, wardNumber: Number(fields.wardNumber) }
        : fields;

    savingRef.current = true;
    setIsSaving(true);
    setError("");

    try {
      const response = await apiFetch("/api/v1/addresses", {
        method: "POST",
        body: JSON.stringify(address),
      });

      if (response.status === 401) {
        onLogin();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.address?.id) {
        throw new Error(data.message || "Could not save your address.");
      }

      onSaved(data.address);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save your address."
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={saveAddress} className="mt-4">
      <fieldset
        disabled={isSaving}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-semibold">New delivery address</legend>

        <AddressField
          label="Recipient name"
          name="recipientName"
          autoComplete="name"
          maxLength={100}
          required
        />

        <AddressField
          label="Phone (with country code)"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          placeholder="+61412345678"
          pattern={String.raw`\+[1-9][0-9]{7,14}`}
          required
        />

        <AddressField
          label="Street address"
          name="addressLineOne"
          autoComplete="address-line1"
          maxLength={200}
          required
        />

        <AddressField
          label="Apartment or unit (optional)"
          name="addressLineTwo"
          autoComplete="address-line2"
          maxLength={200}
        />

        <label className="grid gap-1 text-sm font-medium">
          Country
          <select
            name="countryCode"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            className="min-h-11 rounded-xl border border-(--brand-border) bg-white px-3"
          >
            <option value="AU">Australia</option>
            <option value="NP">Nepal</option>
          </select>
        </label>

        <AddressField
          label={countryCode === "AU" ? "Suburb or town" : "Municipality"}
          name="locality"
          maxLength={100}
          required
        />

        {countryCode === "AU" ? (
          <label className="grid gap-1 text-sm font-medium">
            State or territory
            <select
              name="region"
              defaultValue=""
              required
              className="min-h-11 rounded-xl border border-(--brand-border) bg-white px-3"
            >
              <option value="" disabled>
                Select state
              </option>

              {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(
                (state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                )
              )}
            </select>
          </label>
        ) : (
          <>
            <AddressField
              label="Province"
              name="region"
              maxLength={100}
              required
            />

            <AddressField
              label="District"
              name="district"
              maxLength={35}
              required
            />

            <AddressField
              label="Ward number"
              name="wardNumber"
              type="number"
              min={1}
              max={35}
              step={1}
              required
            />
          </>
        )}

        <AddressField
          key={countryCode}
          label={countryCode === "AU" ? "Postcode" : "Postal code (optional)"}
          name="postalCode"
          autoComplete="postal-code"
          maxLength={countryCode === "AU" ? 4 : 10}
          required={countryCode === "AU"}
          pattern={countryCode === "AU" ? "[0-9]{4}" : undefined}
        />

        <AddressField
          label="Delivery instructions (optional)"
          name="deliveryInstruction"
          maxLength={500}
        />
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#a32135]">
          {error}
        </p>
      )}

      <div className="mt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving!" : "Save and use address"}
        </Button>
      </div>
    </form>
  );
}
