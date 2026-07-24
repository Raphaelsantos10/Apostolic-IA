import tokens from "./tokens.json";

export { tokens };
export type ThemeName = keyof typeof tokens.themes;
