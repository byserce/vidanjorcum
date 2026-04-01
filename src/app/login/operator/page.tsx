"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Phone, CheckCircle2, ShieldCheck, ChevronLeft } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

export default function OperatorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"credentials" | "phone">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [userPhone, setUserPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Giriş bilgileri hatalı veya kullanıcı bulunamadı.");
      setLoading(false);
    } else {
      const session = await getSession();
      if (session && (session.user as any).role === "OPERATOR") {
        const phone = (session.user as any).phone;
        if (!phone) {
          setError("Hesabınıza kayıtlı telefon numarası bulunamadı. Lütfen destekle iletişime geçin.");
          setLoading(false);
          return;
        }
        setUserPhone(phone);
        handleSendOtp(phone);
      } else {
        setError("Bu sayfa sadece operatör girişleri içindir.");
        setLoading(false);
      }
    }
  };

  const handleSendOtp = async (phone: string) => {
    setError("");
    setOtpError("");
    
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+90" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+90" + formattedPhone;
    }

    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {}
        });
      }
      
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep("phone");
    } catch (err: any) {
      console.error("SMS Error:", err);
      setError("Güvenlik doğrulaması başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6 || !confirmationResult) {
      setOtpError("Lütfen 6 haneli kodu giriniz");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    try {
      await confirmationResult.confirm(otpCode);
      router.push("/operator");
      router.refresh();
    } catch (err: any) {
      setOtpError("Kod hatalı veya süresi dolmuş.");
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      {step === "credentials" && <AuthNavigation backHref="/login" />}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20 mb-4 rotate-3">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Operatör Girişi</h1>
            <p className="text-slate-400 text-sm">
              Hizmet veren panelinize erişmek için giriş yapın.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div id="recaptcha-container"></div>
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="ornek@email.com veya 05XX..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                    Şifre
                  </label>
                  <Link href="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium">
                    SMS ile Sıfırla
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-lg shadow-orange-500/20"
              >
                {loading ? "Bilgiler Kontrol Ediliyor..." : "Devam Et"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-center space-y-4 mb-2">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                  <ShieldCheck className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold">Güvenlik Doğrulaması</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {userPhone.replace(userPhone.substring(3, 10), "*******")} numaralı telefonunuza bir kod gönderdik.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-center text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3" htmlFor="otp">
                   6 Haneli SMS Kodu
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-4 text-white outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  autoFocus
                />
                {otpError && (
                  <p className="text-red-500 text-xs text-center mt-2 font-medium">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
              >
                {verifyingOtp ? "Doğrulanıyor..." : "Onayla ve Giriş Yap"}
              </button>

              <button 
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors"
              >
                Bilgileri Düzenle
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col items-center">
             <p className="text-slate-500 text-xs mb-3">İşletmenizi henüz eklemediyseniz</p>
             <Link href="/register" className="text-orange-400 text-sm font-bold hover:text-orange-300 transition-all mb-6">
                Hemen Kaydolun
             </Link>
             
             <p className="text-slate-500 text-[10px] mb-1">Operatör değil misiniz?</p>
             <Link href="/login/customer" className="text-white text-xs hover:underline decoration-sky-500 underline-offset-4 transition-all">
                Müşteri Girişi Yapın
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
