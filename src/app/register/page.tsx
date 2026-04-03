"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Phone, Mail, Lock, Shield, CheckCircle2 } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { OtpInput } from "@/components/OtpInput";
import { validateTurkishPhone, normalizeTurkishPhone, checkOtpRateLimit, incrementOtpAttempts } from "@/lib/auth-utils";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("USER"); // Müşteri veya Operatör
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehiclePlate: "",
    companyName: "",
  });
  
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "OPERATOR") {
      // Operatörler için önce doğrulama ekranına geç ve SMS gönder
      await handleSendOtp();
      setIsVerifying(true);
      return;
    }

    // Müşteriler için E-posta doğrulamalı kayıt
    await handleCustomerRegister();
  };

  const handleCustomerRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const { createUserWithEmailAndPassword, sendEmailVerification } = await import("firebase/auth");
      
      // 1. Firebase Auth üzerinde kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Doğrulama e-postası gönder
      await sendEmailVerification(userCredential.user);

      // 3. Bizim veritabanımızda oluştur (Henüz doğrulanmadı olarak)
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          role: "USER" 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Kayıt başarısız");
      }

      setIsEmailSent(true);
      setIsVerifying(true);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Bu e-posta adresi zaten kullanılıyor.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          role,
          phoneVerified: role === "OPERATOR" ? true : false 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Kayıt başarısız");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
      setIsVerifying(false); 
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone) {
      setOtpError("Lütfen bir telefon numarası giriniz");
      return;
    }

    // Telefon numarası formatı kontrolü (Türk numarası mı?)
    if (!validateTurkishPhone(formData.phone)) {
      setOtpError("Lütfen geçerli bir Türk telefon numarası giriniz (Örn: 05xx xxx xx xx)");
      return;
    }

    // Hız limiti kontrolü (1 saatte max 3 istek)
    const rateLimit = checkOtpRateLimit(formData.phone);
    if (!rateLimit.allowed) {
      setOtpError(rateLimit.message || "Çok fazla istek attınız. Lütfen daha sonra tekrar deneyin.");
      return;
    }

    const formattedPhone = normalizeTurkishPhone(formData.phone);

    setSendingOtp(true);
    setOtpError("");
    
    try {
      // 1. Veritabanında kontrol et (Önce bizim sistemimizde var mı?)
      const checkRes = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });

      if (!checkRes.ok) {
        const { message } = await checkRes.json();
        setOtpError(message);
        setSendingOtp(false);
        return;
      }

      // 2. Firebase ile SMS gönderimini başlat
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "normal",
          callback: () => {},
        });
      }
      
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      // İstek başarılı olduysa sayacı artır
      incrementOtpAttempts(formData.phone);
      
      setConfirmationResult(result);
      setIsOtpSent(true);
      setTimer(90);
      setCanResend(false);
    } catch (err: any) {
      console.error("SMS Error:", err);
      if (err.code === "auth/captcha-check-failed") {
        setOtpError("Hata: Bu alan adı (hostname) yetkilendirilmemiş. Lütfen Firebase Console'dan alan adınızı ekleyin.");
      } else {
        setOtpError("SMS gönderilemedi. Lütfen numarayı (+90...) formatında girdiğinizden emin olun.");
      }
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6 || !confirmationResult) {
      setOtpError("Lütfen 6 haneli kodu giriniz");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    try {
      await confirmationResult.confirm(otpCode);
      setIsPhoneVerified(true);
      // Doğrulama başarılı, şimdi hesabı oluştur
      await handleRegister();
    } catch (err: any) {
      setOtpError("Kod hatalı veya süresi dolmuş.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = () => {
    if (canResend) {
      handleSendOtp();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white py-12">
      {!isVerifying && <AuthNavigation backHref="/login" />}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-sky-600/10 rounded-full blur-[150px] pointer-events-none" />

      <Link href="/" className="mb-6 relative z-10 flex items-center space-x-2 group">
        <img src="/icon.png" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt="Logo" />
        <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
          Vidanjörcüm
        </span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Hesap Oluştur</h1>
          <p className="text-slate-400 text-center mb-6 text-sm">
            Kendinize uygun rolü seçip sisteme katılın.
          </p>

          <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === "USER" ? "bg-sky-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
              onClick={() => setRole("USER")}
            >
              Müşteri (Hizmet Al)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === "OPERATOR" ? "bg-sky-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
              onClick={() => setRole("OPERATOR")}
            >
              Operatör (Hizmet Ver)
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

           {!isVerifying ? (
             <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">İsim Soyisim</label>
                 <input id="name" type="text" value={formData.name} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm" placeholder="Adınız Soyadınız" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">E-posta</label>
                 <input id="email" type="email" value={formData.email} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm" placeholder="ornek@email.com" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Şifre</label>
                 <input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm" placeholder="En az 6 karakter" />
               </div>

               {role === "OPERATOR" && (
                 <div className="pt-2 space-y-4 border-t border-slate-800 mt-4 animate-in slide-in-from-top-4 duration-300">
                   <p className="text-xs text-sky-400 font-medium pb-1">Operatör Ek Bilgiler</p>
                   <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="phone">Telefon Numarası</label>
                     <input 
                       id="phone" 
                       type="tel" 
                       value={formData.phone} 
                       onChange={handleChange} 
                       required 
                       className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm" 
                       placeholder="05XX XXX XX XX" 
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="companyName">Firma Adı</label>
                     <input id="companyName" type="text" value={formData.companyName} onChange={handleChange} required={role === "OPERATOR"} className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm" placeholder="Vidanjör Firmanızın Adı" />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="vehiclePlate">Araç Plakası (Opsiyonel)</label>
                     <input id="vehiclePlate" type="text" value={formData.vehiclePlate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 text-sm uppercase" placeholder="34 ABC 123" />
                   </div>
                 </div>
               )}

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-6 text-sm"
               >
                 {loading ? "Bilgiler Kontrol Ediliyor..." : (role === "OPERATOR" ? "Devam Et ve Doğrula" : "Kayıt Ol")}
               </button>
               
               <div id="recaptcha-container" className="flex justify-center scale-75 origin-top mt-2"></div>
             </form>
           ) : isEmailSent ? (
             <div className="space-y-6 animate-in fade-in zoom-in duration-500 py-4 text-center">
                <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto border border-sky-500/20 mb-4">
                  <Mail className="w-10 h-10 text-sky-400 border-none" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">E-posta Doğrulaması</h2>
                  <p className="text-slate-400 text-sm">
                    {formData.email} adresine bir doğrulama bağlantısı gönderdik. Lütfen kutunuzu kontrol edin ve onayladıktan sonra giriş yapın.
                  </p>
                </div>
                <Link 
                  href="/login/customer"
                  className="block w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all text-sm"
                >
                  Giriş Sayfasına Git
                </Link>
                <button 
                  onClick={() => setIsVerifying(false)}
                  className="text-slate-500 text-xs hover:text-slate-300"
                >
                  Bilgileri Düzenle
                </button>
             </div>
           ) : (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 min-h-[300px] flex flex-col justify-center">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto border border-sky-500/20 mb-4 animate-pulse">
                  <Phone className="w-8 h-8 text-sky-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Telefon Doğrulaması</h2>
                <p className="text-slate-400 text-sm">
                  {formData.phone} numaralı cihazınıza bir kod gönderdik. Kaydı tamamlamak için lütfen kodu girin.
                </p>
              </div>

              <div className="bg-slate-950 border border-sky-500/30 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center pr-1">
                  <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Doğrulama Kodu</p>
                  {timer > 0 ? (
                    <p className="text-[10px] text-slate-500 font-mono">Kalan Süre: {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}</p>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-[10px] text-amber-400 font-bold uppercase hover:underline"
                    >
                      Tekrar Gönder
                    </button>
                  )}
                </div>
                
                <div className="py-2">
                  <OtpInput 
                    length={6}
                    value={otpCode}
                    onChange={(val) => {
                       setOtpCode(val);
                       setOtpError("");
                    }}
                    disabled={verifyingOtp || (timer === 0 && !canResend)}
                    color="sky"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6 || (timer === 0 && !canResend)}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                >
                  {verifyingOtp ? "Hesap Oluşturuluyor..." : "Kodu Doğrula ve Kayıt Ol"}
                </button>

                {otpError && <p className="text-[10px] text-red-500 text-center font-bold">{otpError}</p>}
                
                <button 
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="text-slate-500 text-[10px] uppercase font-bold hover:text-slate-300 transition-colors pt-2"
                >
                  ← Bilgileri Düzenle
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-sky-400 font-medium hover:text-sky-300 transition-colors">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
