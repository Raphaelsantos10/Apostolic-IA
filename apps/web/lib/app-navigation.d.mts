export type AppView =
  | "home"
  | "courses"
  | "bible"
  | "teacher"
  | "games"
  | "community"
  | "progress"
  | "more";

export type DashboardSection =
  | "dashboard"
  | "courses"
  | "bible"
  | "teacher"
  | "games"
  | "community"
  | "progress"
  | "profile";

export const APP_VIEWS: ReadonlyArray<AppView>;
export const DASHBOARD_SECTIONS: ReadonlyArray<DashboardSection>;
export function resolveAppView(value: string | null | undefined): AppView;
export function appViewHref(view: string | null | undefined): string;
export function resolveDashboardSection(
  value: string | null | undefined
): DashboardSection;
export function dashboardSectionHref(
  section: string | null | undefined
): string;
export function isProtectedAppPath(
  pathname: string | null | undefined
): boolean;
export function resolveSafeNextPath(
  value: string | null | undefined,
  fallback?: string
): string;
