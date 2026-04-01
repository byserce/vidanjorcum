import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map } from "lucide-react";
import OperatorHeaderActions from "@/components/OperatorHeaderActions";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "OPERATOR") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-2 group">
            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Vidanjörcüm
            </span>
          </Link>
          <span className="text-xs text-slate-500 mt-1 block">Operatör Paneli</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/operator" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <Map className="w-5 h-5" />
            <span>Hizmet Bölgelerim</span>
          </Link>
          {/* Gelecekte İlanlarım vs eklenebilir */}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg font-bold text-slate-200 leading-tight">Kontrol Merkezi</h2>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Canlı Panel</span>
          </div>
          <OperatorHeaderActions userName={session.user?.name || ""} />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
