"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ChevronLeft, Globe, AlertCircle, UserPlus } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { auth } from "@/lib/firebase";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      
      // 1. Firebase ile giriş yapmayı dene (Doğrulama kontrolü için)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        setError("Lütfen önce e-postanıza gönderilen doğrulama bağlantısına tıklayın.");
        setLoading(false);
        return;
      }

      // 2. Eğer doğrulandıysa NextAuth ile oturum aç
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Giriş bilgileri hatalı veya bir sorun oluştu.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("E-posta veya şifre hatalı.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.");
      } else {
        setError("Giriş yapılırken bir hata oluştu: " + err.message);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      <AuthNavigation backHref="/login" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20 mb-4 -rotate-3">
              <Mail className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Müşteri Girişi</h1>
            <p className="text-slate-400 text-sm">
               Vidanjör hizmeti almak için hesabınıza erişin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-3 mb-6 shadow-xl active:scale-95 transform"
          >
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Google ile Giriş Yap</span>
          </button>

          {authError && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {authError === 'Configuration' 
                  ? 'Giriş yapılandırma hatası (Google API anahtarları eksik olabilir).' 
                  : authError === 'OAuthAccountNotLinked'
                  ? 'Bu e-posta adresi zaten başka bir yöntemle (şifre ile) kayıtlı. Lütfen şifrenizle giriş yapın ya da Google ile devam etmek için e-postanızı doğrulayın.'
                  : 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.'}
              </span>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-4 text-slate-500">veya e-posta ile</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
                E-posta veya Telefon
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                  Şifre
                </label>
                <Link href="/forgot-password/customer" className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium">
                  E-posta ile Sıfırla
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-lg shadow-sky-500/20"
            >
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col items-center">
             <p className="text-slate-500 text-xs mb-3">Hesabınız yok mu?</p>
             <Link href="/register" className="text-white text-sm font-bold hover:text-sky-400 transition-all flex items-center gap-2 group mb-6">
                <UserPlus className="w-4 h-4 text-sky-500 group-hover:scale-110" />
                Hemen Kaydolun
             </Link>
             
             <p className="text-slate-500 text-[10px] mb-1">Vidanjör sahibi iseniz</p>
             <Link href="/login/operator" className="text-white text-xs hover:underline decoration-orange-500 underline-offset-4 transition-all">
                Operatör Girişi Yapın
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
