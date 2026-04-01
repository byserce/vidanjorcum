"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Giriş bilgileri hatalı veya yetkiniz bulunmamaktadır.");
        setLoading(false);
      } else {
        // Redirection check via router
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      setError("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Background decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-0 right-0 w-64 h-64 bg-sky-600/5 rounded-full blur-[80px] pointer-events-none" />

      <AuthNavigation backHref="/login" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 mb-4 shadow-lg shadow-rose-500/5">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Yönetici Girişi</h1>
            <p className="text-slate-400 text-sm">
              Sadece yetkili personel için erişim portalı.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1" htmlFor="email">
                E-posta veya Kimlik
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-rose-500 transition-colors">
                  <span className="text-sm font-bold">@</span>
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 rounded-xl px-4 py-3.5 pl-10 text-white outline-none transition-all placeholder:text-slate-700"
                  placeholder="admin@vidanjorcum.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1" htmlFor="password">
                Güvenlik Tabakası (Şifre)
              </label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-rose-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 rounded-xl px-4 py-3.5 pl-10 text-white outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black py-4 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-xl active:scale-[0.98] transform flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Kimlik Doğrulanıyor...</span>
                </>
              ) : (
                "Sisteme Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-tighter mb-4">
              Kritik yetki erişimi kayıt altına alınmaktadır.
            </p>
            <Link href="/" className="text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-2">
               <ArrowLeft className="w-3 h-3" /> Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
