const ENABLED_VALUES = new Set(["1", "true", "on", "yes"]);

export function resolveMotionMode(value) {
  if (typeof value !== "string") return "standard";
  return ENABLED_VALUES.has(value.trim().toLowerCase())
    ? "enhanced"
    : "standard";
}
