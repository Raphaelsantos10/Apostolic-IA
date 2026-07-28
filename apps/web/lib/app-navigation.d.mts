export type AppView =
  | "home"
  | "courses"
  | "bible"
  | "teacher"
  | "games"
  | "community"
  | "progress"
  | "more";

export const APP_VIEWS: ReadonlyArray<AppView>;
export function resolveAppView(value: string | null | undefined): AppView;
export function appViewHref(view: string | null | undefined): string;
export function isProtectedAppPath(
  pathname: string | null | undefined
): boolean;
export function resolveSafeNextPath(
  value: string | null | undefined,
  fallback?: string
): string;
