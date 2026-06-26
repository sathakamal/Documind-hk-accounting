import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="p-6 text-white bg-[#0a1628] w-64 h-screen">Loading...</div>}>
        <Sidebar />
      </Suspense>
      <div className="mn overflow-hidden">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200"></div>}>
          <Topbar />
        </Suspense>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
