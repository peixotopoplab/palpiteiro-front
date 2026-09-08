import { TopBar } from "@/components/app-shell/topbar";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { getCurrentUser } from "@/lib/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <AuthModalProvider>
      <div className="min-h-full flex flex-col">
        <TopBar userStatus={user?.status ?? null} />
        <div className="flex-1">{children}</div>
        <BottomNav />
      </div>
    </AuthModalProvider>
  );
}
