import { AdminPanel } from "@/components/AdminPanel";
import { AppLayout } from "@/components/AppLayout";

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <AdminPanel />
      </div>
    </AppLayout>
  );
}
