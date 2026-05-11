// Capa de acceso a la API Central de Deudores del BCRA.

const BCRA_BASE = "https://api.bcra.gob.ar/CentralDeDeudores/v1.0";
const TIMEOUT_MS = 15000;

const SITUACION_MAP = {
  1: { label: "Normal", severidad: "success" },
  2: { label: "Riesgo bajo", severidad: "warning" },
  3: { label: "Riesgo medio", severidad: "warning" },
  4: { label: "Riesgo alto", severidad: "danger" },
  5: { label: "Irrecuperable", severidad: "danger" },
  6: { label: "Irrecuperable - disp. tecnica", severidad: "danger" }
};

async function fetchBcra(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    clearTimeout(timer);

    if (res.status === 404) return { sinDatos: true };
    if (!res.ok) throw new Error(`BCRA respondio con HTTP ${res.status}`);

    const json = await res.json();
    return json;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("La consulta al BCRA tardo demasiado. Intenta de nuevo.");
    throw err;
  }
}

export async function consultarDeudas(cuil) {
  return fetchBcra(`${BCRA_BASE}/Deudas/${cuil}`);
}

export async function consultarChequesRechazados(cuil) {
  return fetchBcra(`${BCRA_BASE}/Deudas/ChequesRechazados/${cuil}`);
}

function formatPeriodo(raw) {
  if (!raw || String(raw).length < 6) return String(raw);
  const str = String(raw);
  const año = str.slice(0, 4);
  const mes = str.slice(4, 6);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${meses[parseInt(mes) - 1] || mes} ${año}`;
}

export function normalizarDeudas(raw) {
  if (!raw || raw.sinDatos) return { tieneDeudas: false, periodos: [], error: null };
  if (raw.error) return { tieneDeudas: false, periodos: [], error: raw.error };

  const results = raw.results || raw;
  const periodos = Array.isArray(results?.periodos) ? results.periodos : [];

  const periodosNorm = periodos.map((p) => ({
    periodo: formatPeriodo(p.periodo),
    periodoRaw: p.periodo,
    entidades: Array.isArray(p.entidades)
      ? p.entidades.map((e) => ({
          entidad: e.entidad,
          situacion: e.situacion,
          situacionLabel: SITUACION_MAP[e.situacion]?.label || `Situacion ${e.situacion}`,
          situacionSeveridad: SITUACION_MAP[e.situacion]?.severidad || "neutral",
          montoMiles: e.monto,
          vencida: Boolean(e.vencida),
          refinanciaciones: Boolean(e.refinanciaciones),
          situacionJuridica: Boolean(e.situacionJuridica),
          irrecuperable: Boolean(e.irrecuperable),
          procesoJud: Boolean(e.procesoJud)
        }))
      : []
  }));

  return {
    tieneDeudas: periodosNorm.length > 0,
    denominacion: results?.denominacion || null,
    periodos: periodosNorm,
    error: null
  };
}

export function normalizarCheques(raw) {
  if (!raw || raw.sinDatos) return { tieneRechazos: false, registros: [], error: null };
  if (raw.error) return { tieneRechazos: false, registros: [], error: raw.error };

  const results = raw.results || raw;
  const causales = Array.isArray(results?.causales) ? results.causales : [];

  const registros = [];
  for (const causal of causales) {
    const detalle = Array.isArray(causal.detalle) ? causal.detalle : [];
    for (const item of detalle) {
      registros.push({
        causal: causal.causal,
        causalLabel: causal.denominacion || `Causal ${causal.causal}`,
        nroCheque: item.nroCheque,
        entidadCodigo: item.entidad,
        entidadNombre: item.denominacionEntidad || `Entidad ${item.entidad}`,
        importePesos: item.importe,
        fechaRechazo: item.fechaRechazo,
        camara: item.camara,
        multa: Boolean(item.multa),
        fechaPago: item.fechaPago || null
      });
    }
  }

  return {
    tieneRechazos: registros.length > 0,
    denominacion: results?.denominacion || null,
    registros,
    error: null
  };
}
