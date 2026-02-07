const ROLE_KEY = "userRole";
const ADMIN_ROLE = "admin";
const USER_ROLE = "user";

function normalizeRole(role) {
  if (role === "viewer") return USER_ROLE;
  return role;
}

export function getUserRole() {
  if (typeof window === "undefined") return null;
  return normalizeRole(localStorage.getItem(ROLE_KEY));
}

export function setUserRole(role) {
  if (typeof window === "undefined") return;
  const normalizedRole = normalizeRole(role);
  localStorage.setItem(ROLE_KEY, normalizedRole);
  sessionStorage.setItem(ROLE_KEY, normalizedRole);
}

export function clearUserRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function isAdmin() {
  return getUserRole() === ADMIN_ROLE;
}

export function isUser() {
  return getUserRole() === USER_ROLE;
}

export function isAuthenticated() {
  const role = getUserRole();
  return role === ADMIN_ROLE || role === USER_ROLE;
}

export function logout() {
  if (typeof window === "undefined") return;
  clearUserRole();
  window.location.href = "/account/signin";
}

export function requireAdmin(callback) {
  if (typeof window === "undefined") return;
  if (!isAdmin()) {
    window.location.href = "/account/signin";
    return;
  }
  if (callback) callback();
}

export function requireAuth(callback) {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) {
    window.location.href = "/account/signin";
    return;
  }
  if (callback) callback();
}
