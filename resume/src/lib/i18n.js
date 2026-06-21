/* bilingual helper — returns the right language string, falling back to FR */
export function t(v, lang) {
  if (v == null) return "";
  if (typeof v === "object" && (("fr" in v) || ("en" in v))) return v[lang] ?? v.fr ?? "";
  return v;
}
