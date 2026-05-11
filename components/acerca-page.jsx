"use client";

export function AcercaPage() {
  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">Información</p>
          <h1>Acerca de<br />chequerIA</h1>
          <p className="hero-panel__copy">
            Herramienta de consulta a la Central de Deudores del Banco Central de la República
            Argentina. Desarrollada por Consultoría Digital.
          </p>
        </div>
      </section>

      <div className="content-card">
        <div className="content-card__header">
          <h2>Fuentes de datos</h2>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="integration-line">
            <div>
              <strong>Deudas financieras</strong>
              <p>
                Situación crediticia de personas y empresas en la Central de Deudores del BCRA.
                Incluye entidad, situación (1–6), monto y estado.
              </p>
            </div>
            <span className="status-chip status-chip--success">Activo</span>
          </div>
          <div className="integration-line">
            <div>
              <strong>Cheques rechazados</strong>
              <p>
                Listado de cheques rechazados con causal, entidad bancaria, importe y fecha.
              </p>
            </div>
            <span className="status-chip status-chip--success">Activo</span>
          </div>
          <div className="integration-line">
            <div>
              <strong>OCR por foto de DNI</strong>
              <p>
                Extracción automática de CUIL/DNI desde imágenes usando Claude (Anthropic).
                Requiere <code>ANTHROPIC_API_KEY</code> configurado.
              </p>
            </div>
            <span className="status-chip status-chip--neutral">Requiere API key</span>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card__header">
          <h2>Endpoints BCRA</h2>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div className="env-box">
            <strong>Deudas</strong>
            <p>
              <code>GET https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/{"{cuil}"}</code>
            </p>
          </div>
          <div className="env-box">
            <strong>Cheques rechazados</strong>
            <p>
              <code>
                GET https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/ChequesRechazados/{"{cuil}"}
              </code>
            </p>
          </div>
        </div>
        <p style={{ margin: "1rem 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
          Los datos son públicos, actualizados mensualmente por el BCRA y no requieren
          autenticación externa. chequerIA actúa como proxy seguro con autenticación propia.
        </p>
      </div>
    </>
  );
}
