import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "@/utils/authCheck";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
        <p className="mt-3 text-sm text-rose-700">Checking access...</p>
      </div>
    </div>
  );
}

function useRoleGuard(allowedRoles) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const allowedRolesKey = allowedRoles.join("|");

  useEffect(() => {
    const role = getUserRole();
    if (role && allowedRoles.includes(role)) {
      setStatus("allowed");
      return;
    }
    setStatus("blocked");
    navigate("/account/signin");
  }, [allowedRolesKey, navigate]);

  return status;
}

export function ProtectedAdminPage({ children }) {
  const status = useRoleGuard(["admin"]);
  if (status !== "allowed") return <LoadingState />;
  return children;
}

export function ProtectedPage({ children }) {
  const status = useRoleGuard(["admin", "user"]);
  if (status !== "allowed") return <LoadingState />;
  return children;
}
