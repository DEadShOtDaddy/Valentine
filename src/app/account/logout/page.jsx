"use client";

import { useEffect } from "react";
import { logout } from "@/utils/authCheck";

export default function LogoutPage() {
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <p className="text-sm font-semibold text-rose-700">Signing out...</p>
    </div>
  );
}
