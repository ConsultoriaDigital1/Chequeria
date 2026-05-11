import "./globals.css";
import { getAppSettingsInitScript } from "@/lib/app-settings";

export const metadata = {
  title: "chequerIA | Consulta Central de Deudores BCRA",
  description: "Consultá deudas financieras y cheques rechazados en la Central de Deudores del BCRA por CUIL/CUIT o foto del DNI.",
  other: { google: "notranslate" }
};

const appSettingsInitScript = getAppSettingsInitScript();

export default function RootLayout({ children }) {
  return (
    <html lang="es" translate="no" suppressHydrationWarning className="notranslate">
      <body suppressHydrationWarning className="notranslate">
        <script id="chequeria-app-settings" dangerouslySetInnerHTML={{ __html: appSettingsInitScript }} />
        {children}
      </body>
    </html>
  );
}
