import { Calendar } from "lucide-react";

export default function PublicBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-900 dark:text-slate-50" />
            <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Nevermiss
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Powered by Nevermiss
          </p>
        </div>
      </footer>
    </div>
  );
}
