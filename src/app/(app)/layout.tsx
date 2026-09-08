import Link from "next/link";
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

        {/* Rodapé com links institucionais — acima da bottom nav no mobile */}
        <footer className="border-t border-border-subtle bg-surface-dark pb-16 lg:pb-0">
          <div className="container-content py-4">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {[
                ["/glossario", "Glossário"],
                ["/termos", "Termos"],
                ["/privacidade", "Privacidade"],
                ["/quem-somos", "Quem Somos"],
                ["/contato", "Suporte"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-label-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="text-label-sm text-text-muted text-center mt-2">
              © 2026 Palpiteiro · Independente da CEF · +18 anos
            </p>
          </div>
        </footer>

        <BottomNav />
      </div>
    </AuthModalProvider>
  );
}
