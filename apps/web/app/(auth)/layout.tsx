import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Nevermiss
        </h1>
      </div>

      {/* Card container */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Nevermiss. All rights reserved.</p>
      </div>
    </div>
  );
}
