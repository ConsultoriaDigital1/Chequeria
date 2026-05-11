import { DashboardShell } from "@/components/dashboard-shell";
import { ConsultaPage } from "@/components/consulta-page";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <DashboardShell>
      <ConsultaPage />
    </DashboardShell>
  );
}
