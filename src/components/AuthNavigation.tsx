"use client";

import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthNavigationProps {
  backHref?: string;
  className?: string;
}

export function AuthNavigation({ backHref, className = "" }: AuthNavigationProps) {
  const router = useRouter();

  return (
    <div className={`fixed top-6 left-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 ${className}`}>
      <button 
        onClick={() => backHref ? router.push(backHref) : router.back()}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm group shadow-xl"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden sm:inline font-medium">Geri Dön</span>
      </button>
      
      <Link 
        href="/" 
        className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm group shadow-xl"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">Ana Sayfa</span>
      </Link>
    </div>
  );
}
