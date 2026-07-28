export type SecurityHeader = Readonly<{ key: string; value: string }>;

export function buildContentSecurityPolicy(
  options: Readonly<{ production: boolean }>
): string;

export function securityHeaders(
  options: Readonly<{ production: boolean }>
): SecurityHeader[];
