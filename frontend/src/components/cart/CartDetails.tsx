"use client";

import { useAuthStore } from "@/store/authStore";

type Props = {
  currency: string;
};

export default function CartDetails({ currency }: Props) {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const currentUserId = useAuthStore((state) => state.user?.id);

  if (isRestoring) {
    return (
      <div className="mt-7 rounded-[22px] border border-dashed border-(--brand-border) px-6 py-14 text-center">
        <p className="mt-3 text-sm leading-[1.7] text-(--brand-muted)">
          Getting your cart ready!
        </p>
      </div>
    );
  }
}
