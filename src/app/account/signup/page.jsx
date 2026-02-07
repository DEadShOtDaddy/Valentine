"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to signin page as signup is disabled
    navigate("/account/signin");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <p>Redirecting to sign in...</p>
      </div>
    </div>
  );
}
