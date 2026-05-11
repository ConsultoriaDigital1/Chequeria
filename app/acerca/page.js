import { DashboardShell } from "@/components/dashboard-shell";
import { AcercaPage } from "@/components/acerca-page";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <DashboardShell>
      <AcercaPage />
    </DashboardShell>
  );
}
