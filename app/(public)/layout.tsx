import { HeaderNav, Footer } from "@/components/layout/HeaderNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip bg-white">
      <HeaderNav />
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-clip px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
