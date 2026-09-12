import { HeaderNav, Footer } from "@/components/layout/HeaderNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileNavSpacer } from "@/components/layout/MobileNavSpacer";
import { QuickActionsFab } from "@/components/dashboard/QuickActionsFab";
import { WargaIdentityProvider } from "@/lib/hooks/useWargaIdentity";
import { PortalNotificationsProvider } from "@/lib/hooks/usePortalNotifications";
import { WargaIdentifyPrompt } from "@/components/warga/WargaIdentifyPrompt";
import { WargaPresenceHeartbeat } from "@/components/warga/WargaPresenceHeartbeat";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WargaIdentityProvider>
      <PortalNotificationsProvider>
        <div className="flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip bg-white">
          <HeaderNav />
          <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-clip px-4 py-6 lg:px-6 lg:py-8">
            {children}
          </main>
          <MobileNavSpacer>
            <Footer />
          </MobileNavSpacer>
          <QuickActionsFab />
          <MobileNav />
          <WargaIdentifyPrompt />
          <WargaPresenceHeartbeat />
        </div>
      </PortalNotificationsProvider>
    </WargaIdentityProvider>
  );
}
