import { HeaderNav, Footer } from "@/components/layout/HeaderNav";
import { WargaIdentityProvider } from "@/lib/hooks/useWargaIdentity";
import { WargaIdentifyPrompt } from "@/components/warga/WargaIdentifyPrompt";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WargaIdentityProvider>
      <div className="flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip bg-white">
        <HeaderNav />
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-clip px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
        <Footer />
        <WargaIdentifyPrompt />
      </div>
    </WargaIdentityProvider>
  );
}
