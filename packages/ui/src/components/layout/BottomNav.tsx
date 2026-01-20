"use client";

import React from "react";
import { Home, Link, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface BottomNavProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "URL",
    href: "/booking-urls",
    icon: <Link className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function BottomNav({ currentPath, onNavigate }: BottomNavProps) {
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => onNavigate?.(item.href)}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-full
                  transition-colors duration-200
                  ${
                    active
                      ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                  }
                `}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
