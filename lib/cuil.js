// Utilidades para validar y calcular CUILs argentinos.

const CUIL_MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function normalizeCuil(raw) {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "").slice(0, 11);
}

export function validateCuil(cuil) {
  const digits = normalizeCuil(cuil);
  if (digits.length !== 11) return false;

  const prefix = digits.slice(0, 2);
  if (!["20", "23", "24", "27", "30", "33", "34"].includes(prefix)) return false;

  const sum = digits.slice(0, 10).split("").reduce((acc, d, i) => acc + parseInt(d) * CUIL_MULTIPLIERS[i], 0);
  const remainder = sum % 11;
  const verifier = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return verifier === parseInt(digits[10]);
}

export function formatCuil(cuil) {
  const digits = normalizeCuil(cuil);
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`;
}

// Calcula el CUIL a partir de un DNI y el prefijo de genero (20=masculino, 27=femenino).
export function computeCuilFromDni(dni, prefix = "20") {
  const dniStr = String(dni).replace(/\D/g, "").padStart(8, "0");
  const base = prefix + dniStr;

  const sum = base.split("").reduce((acc, d, i) => acc + parseInt(d) * CUIL_MULTIPLIERS[i], 0);
  const remainder = sum % 11;

  let verifier;
  let finalPrefix = prefix;

  if (remainder === 0) {
    verifier = 0;
  } else if (remainder === 1) {
    // Cuando el resto es 1 se usa prefijo 23 con verificador 4.
    finalPrefix = "23";
    verifier = 4;
  } else {
    verifier = 11 - remainder;
  }

  return finalPrefix + dniStr + verifier;
}

export function parseCuilInput(raw) {
  const digits = normalizeCuil(raw);
  return digits;
}
