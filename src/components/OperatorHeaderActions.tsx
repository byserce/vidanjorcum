"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Home } from "lucide-react";

export default function OperatorHeaderActions({ userName }: { userName: string }) {
  return (
    <div className="flex items-center space-x-3 sm:space-x-4">
      <div className="hidden xs:flex flex-col items-end">
        <span className="text-[10px] text-slate-500 uppercase font-bold">Operatör</span>
        <span className="text-sm text-white font-medium leading-none">{userName}</span>
      </div>
      
      {/* Siteye Dön (Home) - Sadece link, logout değil */}
      <Link 
        href="/" 
        className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-all border border-slate-700"
        title="Ana Sayfaya Dön"
      >
        <Home className="w-4 h-4 text-slate-400" />
        <span className="hidden sm:inline">Gözat</span>
      </Link>

      {/* Gerçek Çıkış Yap Butonu */}
      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center space-x-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-xl transition-all border border-red-500/30 font-bold"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Çıkış Yap</span>
      </button>
    </div>
  );
}
