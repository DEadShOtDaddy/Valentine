"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUserRole } from "@/utils/authCheck";

const ADMIN_ROLE = "admin";
const USER_ROLE = "user";

const roleOptions = [
  {
    id: ADMIN_ROLE,
    label: "Jello",
    imageKey: "jello_profile_url",
  },
  {
    id: USER_ROLE,
    label: "Kukku",
    imageKey: "kukku_profile_url",
  },
];

function isValidCredentials(role, password) {
  if (role === ADMIN_ROLE) return password === "admin";
  return password === "iamchotu";
}

export default function SignInPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(USER_ROLE);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await fetch("/api/site-settings");
        if (!response.ok) return;
        const data = await response.json();
        setSiteSettings(data.settings ?? {});
      } catch {
        // Keep defaults if settings are not available.
      }
    };
    loadSiteSettings();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    if (!isValidCredentials(selectedRole, password.trim())) {
      setError("Invalid password for the selected profile.");
      setSubmitting(false);
      return;
    }

    setUserRole(selectedRole);
    navigate(selectedRole === ADMIN_ROLE ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-rose-200 px-4 py-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white/95 p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
          Valentine Week
        </p>
        <h1 className="mt-2 text-3xl font-bold text-rose-900">Choose your profile</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          <div className="grid gap-3">
            {roleOptions.map((option) => {
              const isActive = option.id === selectedRole;
              const imageUrl = siteSettings?.[option.imageKey] || null;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedRole(option.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-rose-500 bg-rose-50 shadow-sm"
                      : "border-rose-100 bg-white hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-rose-200 bg-rose-50">
                      {imageUrl ? (
                        <img src={imageUrl} alt={option.label} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-rose-500">
                          {option.label[0]}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-rose-900">{option.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-rose-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-rose-200 px-3 py-3 text-rose-900 outline-none ring-rose-400 transition focus:ring-2"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
