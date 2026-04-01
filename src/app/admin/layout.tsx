import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, LayoutDashboard, LogOut, Upload, MessageSquare } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-2 group">
            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Vidanjörcüm
            </span>
          </Link>
          <span className="text-xs text-slate-500 mt-1 block">Superadmin Paneli</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <Users className="w-5 h-5" />
            <span>Kullanıcı Yönetimi</span>
          </Link>
          <Link href="/admin/jobs" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <img src="/icon.png" className="w-5 h-5 object-contain" alt="Icon" />
            <span>İlan Yönetimi</span>
          </Link>
          <Link href="/admin/firms/import" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <Upload className="w-5 h-5" />
            <span>Firma İçe Aktar</span>
          </Link>
          <Link href="/admin/reviews" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all">
            <MessageSquare className="w-5 h-5" />
            <span>Yorum Yönetimi</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6">
          <h2 className="text-lg font-medium text-slate-200">Kontrol Merkezi</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">
              Yetkili: <strong className="text-white">{session.user?.email}</strong>
            </span>
            <Link href="/" className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Siteye Dön</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
