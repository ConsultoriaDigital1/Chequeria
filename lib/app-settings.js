export const APP_SETTINGS_STORAGE_KEY = "chequeria.app-settings";

export const APP_SETTINGS_DEFAULTS = Object.freeze({
  theme: "warm",
  density: "comfortable"
});

export const APP_THEME_OPTIONS = [
  { value: "warm", label: "Arena", description: "Paleta calida, contraste alto." },
  { value: "light", label: "Claro", description: "Fondo frio, ideal para jornadas largas." },
  { value: "dark", label: "Oscuro", description: "Menos brillo, mejor lectura nocturna." }
];

export const APP_DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comoda", description: "Mas espacio entre elementos." },
  { value: "compact", label: "Compacta", description: "Mas informacion por pantalla." }
];

const VALID_VALUES = {
  theme: APP_THEME_OPTIONS.map((o) => o.value),
  density: APP_DENSITY_OPTIONS.map((o) => o.value)
};

export function normalizeAppSettings(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    theme: VALID_VALUES.theme.includes(source.theme) ? source.theme : APP_SETTINGS_DEFAULTS.theme,
    density: VALID_VALUES.density.includes(source.density) ? source.density : APP_SETTINGS_DEFAULTS.density
  };
}

export function applyAppSettings(root, input) {
  const settings = normalizeAppSettings(input);
  if (root?.dataset) {
    root.dataset.theme = settings.theme;
    root.dataset.density = settings.density;
    delete root.dataset.motion;
  }
  return settings;
}

export function getAppSettingsInitScript() {
  return `(() => {
    const storageKey = ${JSON.stringify(APP_SETTINGS_STORAGE_KEY)};
    const defaults = ${JSON.stringify(APP_SETTINGS_DEFAULTS)};
    const validValues = ${JSON.stringify(VALID_VALUES)};
    const normalize = (input) => {
      const source = input && typeof input === "object" ? input : {};
      return {
        theme: validValues.theme.includes(source.theme) ? source.theme : defaults.theme,
        density: validValues.density.includes(source.density) ? source.density : defaults.density
      };
    };
    const apply = (settings) => {
      const root = document.documentElement;
      root.dataset.theme = settings.theme;
      root.dataset.density = settings.density;
      delete root.dataset.motion;
    };
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : defaults;
      apply(normalize(parsed));
    } catch {
      apply(defaults);
    }
  })();`;
}
