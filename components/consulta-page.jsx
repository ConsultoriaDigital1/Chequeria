"use client";

import { useState, useRef, useCallback } from "react";

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatearMonto(monto) {
  if (monto == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    monto * 1000
  );
}

function formatearMontoDirecto(monto) {
  if (monto == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto);
}

function formatearFecha(fecha) {
  if (!fecha) return "—";
  try {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return fecha;
  }
}

function mascaraCuil(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

// ─── Chips de situacion ───────────────────────────────────────────────────────

function SituacionChip({ label, severidad }) {
  const map = { success: "status-chip--success", warning: "status-chip--warning", danger: "status-chip--danger", neutral: "status-chip--neutral" };
  return <span className={`status-chip ${map[severidad] || "status-chip--neutral"}`}>{label}</span>;
}

// ─── Panel de resultados ──────────────────────────────────────────────────────

function ResultadoPanel({ resultado }) {
  const { cuil, cuilFormateado, denominacion, fuenteCuil, deudas, cheques } = resultado;

  const fuenteLabel = { manual: "Ingresado manualmente", foto: "Extraido de foto", "foto-dni": "Calculado desde DNI en foto" }[fuenteCuil] || fuenteCuil;

  const totalPeriodos = deudas?.periodos?.length || 0;
  const totalCheques = cheques?.registros?.length || 0;

  return (
    <>
      {/* Header del resultado */}
      <div className="content-card" style={{ animationDelay: "60ms" }}>
        <div className="resultado-header">
          <div>
            <p className="hero-panel__eyebrow">Resultado de la consulta</p>
            <h2>{denominacion || "Sin denominacion registrada"}</h2>
            <div className="resultado-chips">
              <span className="tag">CUIL {cuilFormateado}</span>
              <span className="tag">{fuenteLabel}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "flex-end" }}>
            {deudas?.error ? (
              <span className="status-chip status-chip--neutral">Deudas: error al consultar</span>
            ) : deudas?.tieneDeudas ? (
              <span className="status-chip status-chip--danger">⚠ Tiene deudas ({totalPeriodos} período{totalPeriodos !== 1 ? "s" : ""})</span>
            ) : (
              <span className="status-chip status-chip--success">✓ Sin deudas registradas</span>
            )}

            {cheques?.error ? (
              <span className="status-chip status-chip--neutral">Cheques: error al consultar</span>
            ) : cheques?.tieneRechazos ? (
              <span className="status-chip status-chip--danger">⚠ Cheques rechazados ({totalCheques})</span>
            ) : (
              <span className="status-chip status-chip--success">✓ Sin cheques rechazados</span>
            )}
          </div>
        </div>
      </div>

      {/* Deudas */}
      <div className="content-card" style={{ animationDelay: "120ms" }}>
        <div className="content-card__header">
          <h2 className="section-title">Deudas financieras</h2>
          {deudas?.tieneDeudas && (
            <span className="content-card__meta">{totalPeriodos} período{totalPeriodos !== 1 ? "s" : ""}</span>
          )}
        </div>

        {deudas?.error && (
          <div className="inline-message inline-message--error">
            No se pudo consultar deudas: {deudas.error}
          </div>
        )}

        {!deudas?.error && !deudas?.tieneDeudas && (
          <div className="empty-state empty-state--compact">
            <span style={{ fontSize: "2rem" }}>✓</span>
            <h3>Sin deudas registradas</h3>
            <p>Este CUIL no registra deudas en la Central de Deudores del BCRA.</p>
          </div>
        )}

        {deudas?.tieneDeudas &&
          deudas.periodos.map((periodo, pi) => (
            <div key={pi} className="periodo-block">
              <div className="periodo-header">
                <strong>{periodo.periodo}</strong>
                <span className="tag">{periodo.entidades.length} entidad{periodo.entidades.length !== 1 ? "es" : ""}</span>
              </div>
              {periodo.entidades.map((ent, ei) => (
                <div key={ei} className="entidad-row">
                  <span className="entidad-row__codigo" title="Codigo de entidad">#{ent.entidad}</span>
                  <div>
                    <SituacionChip label={ent.situacionLabel} severidad={ent.situacionSeveridad} />
                    <div className="entidad-row__flags" style={{ marginTop: "0.4rem" }}>
                      {ent.vencida && <span className="tag">Vencida</span>}
                      {ent.refinanciaciones && <span className="tag">Refinanciada</span>}
                      {ent.situacionJuridica && <span className="tag">Situacion juridica</span>}
                      {ent.procesoJud && <span className="tag">Proceso judicial</span>}
                      {ent.irrecuperable && <span className="tag">Irrecuperable</span>}
                    </div>
                  </div>
                  <div className="monto-label" style={{ color: ent.situacionSeveridad === "success" ? "var(--success)" : "var(--danger)" }}>
                    {formatearMonto(ent.montoMiles)}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {deudas?.tieneDeudas && (
          <p style={{ margin: "1rem 0 0", color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
            Los montos están expresados en miles de pesos. Situación 1 = Normal, 2-3 = Riesgo, 4-6 = Irrecuperable.
            Datos provistos por la API pública del BCRA — Central de Deudores.
          </p>
        )}
      </div>

      {/* Cheques rechazados */}
      <div className="content-card" style={{ animationDelay: "180ms" }}>
        <div className="content-card__header">
          <h2 className="section-title">Cheques rechazados</h2>
          {cheques?.tieneRechazos && (
            <span className="content-card__meta">{totalCheques} registro{totalCheques !== 1 ? "s" : ""}</span>
          )}
        </div>

        {cheques?.error && (
          <div className="inline-message inline-message--error">
            No se pudo consultar cheques: {cheques.error}
          </div>
        )}

        {!cheques?.error && !cheques?.tieneRechazos && (
          <div className="empty-state empty-state--compact">
            <span style={{ fontSize: "2rem" }}>✓</span>
            <h3>Sin cheques rechazados</h3>
            <p>Este CUIL no registra cheques rechazados en el BCRA.</p>
          </div>
        )}

        {cheques?.tieneRechazos &&
          cheques.registros.map((chq, ci) => (
            <div key={ci} className="cheque-row">
              <div className="cheque-row__top">
                <div>
                  <strong>{chq.entidadNombre}</strong>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                    <span className="tag">Nro. {chq.nroCheque}</span>
                    <span className="tag">{chq.causalLabel}</span>
                    {chq.multa && <span className="status-chip status-chip--danger">Con multa</span>}
                    {chq.fechaPago && <span className="status-chip status-chip--success">Pagado</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cheque-row__importe">{formatearMontoDirecto(chq.importePesos)}</div>
                  <div className="cheque-row__meta">Rechazo: {formatearFecha(chq.fechaRechazo)}</div>
                  {chq.fechaPago && (
                    <div className="cheque-row__meta">Pago: {formatearFecha(chq.fechaPago)}</div>
                  )}
                </div>
              </div>
              {chq.camara && (
                <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Camara: {chq.camara}</div>
              )}
            </div>
          ))}
      </div>
    </>
  );
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

export function ConsultaPage() {
  const [modo, setModo] = useState("cuil");
  const [cuil, setCuil] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const inputFileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
    setResultado(null);
    setError(null);
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (preview) URL.revokeObjectURL(preview);
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
    setResultado(null);
    setError(null);
  }, [preview]);

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      let body;

      if (modo === "cuil") {
        const cuilLimpio = cuil.replace(/\D/g, "");
        if (cuilLimpio.length !== 11) throw new Error("El CUIL debe tener 11 dígitos.");
        body = { cuil: cuilLimpio };
      } else {
        if (!archivo) throw new Error("Seleccioná una foto del DNI.");
        if (archivo.size > 5 * 1024 * 1024) throw new Error("La foto no puede superar 5MB.");
        const imagen = await fileToBase64(archivo);
        body = { imagen, mimeType: archivo.type };
      }

      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);

      setResultado(data);
    } catch (err) {
      setError(err.message || "Error al consultar.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFoto() {
    if (preview) URL.revokeObjectURL(preview);
    setArchivo(null);
    setPreview(null);
    if (inputFileRef.current) inputFileRef.current.value = "";
  }

  return (
    <>
      {/* Hero */}
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">Central de Deudores · BCRA</p>
          <h1>Consulta<br />de deudores</h1>
          <p className="hero-panel__copy">
            Ingresá un CUIL/CUIT o subí una foto del DNI para verificar deudas financieras y
            cheques rechazados en la Central de Deudores del Banco Central.
          </p>
        </div>
        <div className="integration-card">
          <span className="integration-card__badge is-live">API BCRA activa</span>
          <div>
            <h2>Datos oficiales</h2>
            <p style={{ marginTop: "0.5rem" }}>
              La información proviene directamente de la API pública del BCRA. Incluye situación
              crediticia, montos y cheques rechazados actualizados mensualmente.
            </p>
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <span className="tag">Deudas financieras</span>
            <span className="tag">Cheques rechazados</span>
            <span className="tag">OCR por foto de DNI</span>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <div className="content-card">
        <div className="content-card__header">
          <h2>Nueva consulta</h2>
        </div>

        {/* Selector de modo */}
        <div className="segmented-control segmented-control--dual" style={{ marginBottom: "1.2rem" }}>
          <button
            type="button"
            className={`segmented-control__button segmented-control__button--simple ${modo === "cuil" ? "is-active" : ""}`}
            onClick={() => { setModo("cuil"); setResultado(null); setError(null); }}
          >
            <strong>Por CUIL / CUIT</strong>
          </button>
          <button
            type="button"
            className={`segmented-control__button segmented-control__button--simple ${modo === "foto" ? "is-active" : ""}`}
            onClick={() => { setModo("foto"); setResultado(null); setError(null); }}
          >
            <strong>Por foto del DNI</strong>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {modo === "cuil" ? (
            <div className="toolbar">
              <label className="field field--search" style={{ flex: 1 }}>
                <svg className="field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={cuil}
                  onChange={(e) => { setCuil(mascaraCuil(e.target.value)); setResultado(null); setError(null); }}
                  placeholder="20-12345678-9"
                  inputMode="numeric"
                  maxLength={13}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <button type="submit" className="primary-button" disabled={cargando || cuil.replace(/\D/g, "").length !== 11}>
                {cargando ? "Consultando..." : "Consultar"}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                className="upload-zone"
                onClick={() => inputFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputFileRef.current?.click()}
                aria-label="Zona de carga de foto"
              >
                {preview ? (
                  <img src={preview} alt="Vista previa del documento" className="upload-zone__preview" />
                ) : (
                  <div className="upload-zone__placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                    </svg>
                    <p>Arrastrá o hacé clic para subir una foto del DNI</p>
                    <small>JPEG, PNG, WEBP · máx. 5MB</small>
                  </div>
                )}
              </div>

              <input
                ref={inputFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <div className="toolbar__actions">
                {preview && (
                  <button type="button" className="secondary-button" onClick={limpiarFoto}>
                    Cambiar foto
                  </button>
                )}
                <button type="submit" className="primary-button" disabled={cargando || !archivo}>
                  {cargando ? "Analizando..." : "Analizar y consultar"}
                </button>
              </div>

              {!process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  Para usar esta función configurá <code>ANTHROPIC_API_KEY</code> en el archivo{" "}
                  <code>.env</code>. Obtené tu clave en{" "}
                  <strong>console.anthropic.com</strong>.
                </p>
              )}
            </div>
          )}
        </form>

        {error && <div className="inline-message inline-message--error">{error}</div>}
      </div>

      {/* Estado de carga */}
      {cargando && (
        <div className="loading-state">
          <div className="loading-state__dot" />
          <p>Consultando Central de Deudores del BCRA...</p>
          {modo === "foto" && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Primero analizando la imagen con IA...</p>}
        </div>
      )}

      {/* Resultado */}
      {resultado && !cargando && <ResultadoPanel resultado={resultado} />}
    </>
  );
}
