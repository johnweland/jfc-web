import { ShieldCheck } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — sticky, full height, desktop only */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col sticky top-0 h-screen bg-surface-container-low border-r border-border/20">
        <div className="flex items-center gap-2.5 h-16 px-5 py-5 border-b border-border/20">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span
            className="font-display text-[11px] font-bold uppercase text-foreground"
            style={{ letterSpacing: "0.15em" }}
          >
            JFC ADMIN
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminSidebar />
        </div>
      </aside>

      {/* Content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="glass-nav sticky top-0 z-10 h-16 flex items-center border-b border-border/20">
          <div className="px-6 lg:px-12 flex items-center justify-between w-full">
            <p
              className="text-[10px] font-semibold uppercase text-muted-foreground"
              style={{ letterSpacing: "0.18em" }}
            >
              JACKSON FIREARM CO — ADMIN
            </p>
          </div>
        </header>
        <main className="flex-1 px-6 lg:px-12 py-10">{children}</main>
      </div>
    </div>
  );
}
