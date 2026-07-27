export const billingRegions = {
  PT: "Portugal",
  BR: "Brasil",
  US: "Estados Unidos",
  GB: "Reino Unido",
  IN: "Índia",
  PK: "Paquistão",
  GLOBAL: "Outras regiões"
} as const;

export type BillingRegion = keyof typeof billingRegions;
export type BillingInterval = "monthly" | "annual";

export function formatMinorAmount(amount: number, currency: string, locale = "pt-PT") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(amount / 100);
}

export function annualSavings(monthlyMinor: number, annualMinor: number) {
  if (monthlyMinor <= 0) return 0;
  return Math.max(0, Math.round((1 - annualMinor / (monthlyMinor * 12)) * 100));
}
