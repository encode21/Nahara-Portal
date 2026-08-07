import { headers } from "next/headers";
import { HeaderNav, Footer } from "@/components/layout/HeaderNav";
import { getAppSurface } from "@/lib/host";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const surface = getAppSurface((await headers()).get("host"));
  const isLanding = surface === "landing";

  return (
    <div className="flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip bg-white">
      <HeaderNav />
      <main
        className={
          isLanding
            ? "w-full min-w-0 flex-1 overflow-x-clip p-0"
            : "mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-clip px-4 py-8"
        }
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
