"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function CustomerForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset Error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Bu e-posta adresine ait bir hesap bulunamadı.");
      } else {
        setError("Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      {!success && <AuthNavigation backHref="/login/customer" />}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Şifremi Unuttum</h1>
            <p className="text-slate-400 text-sm">
              Hesabınıza kayıtlı e-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-white font-bold text-lg">E-posta Gönderildi!</h2>
                  <p className="text-slate-400 text-sm">
                     {email} adresine şifre sıfırlama talimatlarını içeren bir mail gönderdik. Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.
                  </p>
               </div>
               <button 
                  onClick={() => router.push("/login/customer")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
               >
                  Giriş Ekranına Git
               </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-12 pr-4 py-4 text-white outline-none transition-all placeholder:text-slate-600"
                    placeholder="ornek@email.com"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
              >
                {loading ? "Gönderiliyor..." : "Bağlantı Gönder"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
