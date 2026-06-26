"use client";

import { useRestoreAuth } from "@/hooks/useRestoreAuth";

export default function AuthRestorer() {
  useRestoreAuth();

  return null;
}
