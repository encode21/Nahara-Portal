import { HeaderNav, Footer } from "@/components/layout/HeaderNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HeaderNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6 lg:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
