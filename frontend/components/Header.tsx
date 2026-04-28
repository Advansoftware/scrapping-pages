"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Settings,
  FileText,
  Key,
  LogOut,
  Cpu,
} from "lucide-react";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Scraping", icon: LayoutDashboard },
  { href: "/configs", label: "Configurações", icon: Settings },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/tokens", label: "Tokens API", icon: Key },
  { href: "/settings", label: "IA Provider", icon: Cpu },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:bg-violet-500 transition-colors duration-150">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-zinc-100 text-[15px] tracking-tight">
                Crawler AI
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
