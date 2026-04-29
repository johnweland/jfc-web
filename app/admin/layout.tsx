import { requireAdmin } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin({
    redirectTo: "/admin",
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
