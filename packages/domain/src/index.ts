export type ProjectStatus = Readonly<{
  code: "foundation";
  label: string;
  productionReady: false;
}>;

export function projectStatus(): ProjectStatus {
  return {
    code: "foundation",
    label: "Fundação tecnológica ativa",
    productionReady: false
  };
}
