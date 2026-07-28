export const APP_VIEWS = Object.freeze([
  "home",
  "courses",
  "bible",
  "teacher",
  "games",
  "community",
  "progress",
  "more"
]);

export function resolveAppView(value) {
  if (typeof value !== "string") return "home";
  return APP_VIEWS.includes(value) ? value : "home";
}

export function appViewHref(view) {
  return `/?view=${encodeURIComponent(resolveAppView(view))}`;
}

export function isProtectedAppPath(pathname) {
  if (typeof pathname !== "string") return false;
  return (
    pathname.startsWith("/conta") ||
    (
      pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/dashboard-preview")
    ) ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/perfil")
  );
}

export function resolveSafeNextPath(value, fallback = "/onboarding") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
