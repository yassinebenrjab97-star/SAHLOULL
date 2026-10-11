import * as React from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sahloul.desk.theme";
const listeners = new Set<() => void>();

function readStored(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

let current: Theme = readStored();

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolved(theme: Theme): "light" | "dark" {
  return theme === "system" ? (prefersDark() ? "dark" : "light") : theme;
}

function apply(theme: Theme) {
  const r = resolved(theme);
  document.documentElement.classList.toggle("dark", r === "dark");
  document.documentElement.dataset.theme = r;
}

function emit() {
  listeners.forEach((l) => l());
}

/** Applied eagerly so the very first paint already has the right palette. */
if (typeof window !== "undefined") {
  apply(current);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => current === "system" && apply(current));
}

export function setTheme(theme: Theme) {
  current = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  apply(theme);
  emit();
}

export function useTheme() {
  const theme = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );

  const [systemDark, setSystemDark] = React.useState(prefersDark);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  return {
    theme,
    isDark,
    setTheme,
    toggle: () => setTheme(isDark ? "light" : "dark"),
  };
}
