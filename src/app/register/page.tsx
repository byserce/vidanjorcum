"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  Truck, 
  ArrowRight, 
  ChevronLeft,
  AlertCircle,
  Building2,
  Check
} from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { OtpInput } from "@/components/OtpInput";
import { StepProgress } from "@/components/StepProgress";
import { validateTurkishPhone, normalizeTurkishPhone, checkOtpRateLimit, incrementOtpAttempts } from "@/lib/auth-utils";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Role, 2: Details, 3: Verification
  const [role, setRole] = useState("USER"); // USER veya OPERATOR
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
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
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

  // Recaptcha'yı adım 2'ye geçince başlat
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    const initRecaptcha = () => {
      // Eğer doğrulama zaten yapıldıysa veya doğrulama ekranındaysak geç
      if (isVerifying) return;
      
      const container = document.getElementById("recaptcha-container");
      
      if (!container) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initRecaptcha, 300); // 300ms sonra tekrar dene
        }
        return;
      }

      if (!(window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "normal",
            theme: "dark",
            callback: () => {
              setIsCaptchaVerified(true);
            },
            "expired-callback": () => {
              setIsCaptchaVerified(false);
            }
          });
          (window as any).recaptchaVerifier.render().catch((err: any) => {
             console.error("Recaptcha Render Error:", err);
          });
        } catch (err) {
          console.error("Recaptcha Init Error:", err);
        }
      }
    };
    
    if (step === 2 && !isVerifying) {
      setTimeout(initRecaptcha, 500); // Animasyonun bitmesi için biraz bekle
    }

    return () => {
      // Temizlik gerekiyorsa burada yapılabilir ama genelde global verifier kalır
    };
  }, [step, isVerifying]);

  // Telefon numarası maskeleme logic
  const formatPhoneNumber = (value: string) => {
    // Sadece sayıları al
    const numbers = value.replace(/\D/g, "");
    
    // Eğer 11 haneden fazlaysa kes
    const trimmed = numbers.substring(0, 11);
    
    // Formatlama: 0 (5XX) XXX XX XX
    if (trimmed.length <= 1) return trimmed;
    if (trimmed.length <= 4) return `${trimmed.slice(0, 1)} (${trimmed.slice(1)}`;
    if (trimmed.length <= 7) return `${trimmed.slice(0, 1)} (${trimmed.slice(1, 4)}) ${trimmed.slice(4)}`;
    if (trimmed.length <= 9) return `${trimmed.slice(0, 1)} (${trimmed.slice(1, 4)}) ${trimmed.slice(4, 7)} ${trimmed.slice(7)}`;
    return `${trimmed.slice(0, 1)} (${trimmed.slice(1, 4)}) ${trimmed.slice(4, 7)} ${trimmed.slice(7, 9)} ${trimmed.slice(9, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "phone") {
      setFormData({ ...formData, [id]: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [id]: value });
    }
    // Hata temizle
    if (error) setError("");
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setIsVerifying(false); // Eğer doğrulama adımındaysak geri dön
      setIsCaptchaVerified(false);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCaptchaVerified) {
      setError("Lütfen robot olmadığınızı doğrulayın.");
      return;
    }

    if (role === "OPERATOR") {
      // Operatörler için önce doğrulama ekranına geç ve SMS gönder
      const success = await handleSendOtp();
      if (success) {
        setIsVerifying(true);
        setStep(3);
      }
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
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(userCredential.user, actionCodeSettings);

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
      setStep(3);
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
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (): Promise<boolean> => {
    const setErrorState = isVerifying ? setOtpError : setError;
    setError("");
    setOtpError("");

    if (!formData.phone) {
      setErrorState("Lütfen telefon numaranızı giriniz.");
      return false;
    }

    // Telefon numarası formatı kontrolü
    if (!validateTurkishPhone(formData.phone)) {
      setErrorState("Telefon numarası formatı hatalı. Lütfen 0 (5XX) XXX XX XX şeklinde giriniz.");
      return false;
    }

    const rateLimit = checkOtpRateLimit(formData.phone);
    if (!rateLimit.allowed) {
      setErrorState(rateLimit.message || "Çok fazla kod isteği gönderdiniz.");
      return false;
    }

    const formattedPhone = normalizeTurkishPhone(formData.phone);

    setSendingOtp(true);
    
    try {
      const checkRes = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });

      if (!checkRes.ok) {
        const { message } = await checkRes.json();
        setErrorState(message || "Bu numara zaten kayıtlı.");
        setSendingOtp(false);
        return false;
      }

      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
        setErrorState("Güvenlik doğrulaması henüz hazır değil. Lütfen sayfayı yenileyin.");
        return false;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      incrementOtpAttempts(formData.phone);
      
      setConfirmationResult(result);
      setIsOtpSent(true);
      setTimer(90);
      setCanResend(false);
      return true;
    } catch (err: any) {
      console.error("SMS Error:", err);
      setErrorState("SMS gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
      // Captcha süresi dolmuş olabilir veya hata almış olabilir, resetle
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
        setIsCaptchaVerified(false);
      }
      return false;
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const stepLabels = ["Rol Seçimi", "Bilgiler", "Doğrulama"];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {!isVerifying && step === 1 && <AuthNavigation backHref="/login" />}
      {step > 1 && !isVerifying && (
        <button 
          onClick={prevStep}
          className="fixed top-8 left-8 z-50 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Geri Dön</span>
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 relative z-10"
      >
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-2.5 shadow-lg shadow-sky-500/20 group-hover:rotate-6 transition-transform">
            <img src="/icon.png" className="w-full h-full object-contain brightness-0 invert" alt="Logo" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Vidanjörcüm
          </span>
        </Link>
      </motion.div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/50 overflow-hidden relative">
          {/* Subtle glow effect inside */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl" />
          
          <StepProgress 
            currentStep={step} 
            totalSteps={3} 
            steps={stepLabels} 
          />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-white tracking-tight">Hoş Geldiniz!</h1>
                  <p className="text-slate-400 text-sm">Devam etmek için size en uygun rolü seçin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setRole("USER")}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      role === "USER" 
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                      role === "USER" ? "bg-sky-500 text-slate-950" : "bg-slate-900 text-slate-400 group-hover:text-white"
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Müşteri</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">Hızlıca ilan oluşturun, profesyonellere ulaşın.</p>
                    {role === "USER" && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-sky-500" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setRole("OPERATOR")}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      role === "OPERATOR" 
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.1)]" 
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                      role === "OPERATOR" ? "bg-sky-500 text-slate-950" : "bg-slate-900 text-slate-400 group-hover:text-white"
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Operatör</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">İş teklifleri alın, kazancınızı artırın.</p>
                    {role === "OPERATOR" && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-sky-500" />
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={nextStep}
                    disabled={!role}
                    className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl hover:bg-sky-50 transition-all flex items-center justify-center space-x-2 group disabled:opacity-50"
                  >
                    <span>Devam Et</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">Hesap Bilgileri</h2>
                  <p className="text-slate-400 text-sm">Lütfen kayıt formunu eksiksiz doldurun.</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl flex items-start space-x-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="name">Ad Soyad</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                        <input id="name" type="text" value={formData.name} onChange={handleChange} required className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm" placeholder="Örn: Ahmet Yılmaz" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="email">E-posta</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                        <input id="email" type="email" value={formData.email} onChange={handleChange} required className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm" placeholder="örnek@eposta.com" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="password">Şifre</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                        <input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm" placeholder="••••••••" />
                      </div>
                    </div>

                    {role === "OPERATOR" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 pt-4 border-t border-slate-800/50 mt-2"
                      >
                         <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="phone">Telefon Numarası</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                            <input 
                              id="phone" 
                              type="tel" 
                              value={formData.phone} 
                              onChange={handleChange} 
                              required 
                              className={`w-full bg-slate-950/50 border rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm ${
                                formData.phone && !validateTurkishPhone(formData.phone) && formData.phone.length > 5
                                  ? "border-amber-500/50 focus:border-amber-500"
                                  : "border-slate-800 focus:border-sky-500"
                              }`} 
                              placeholder="0 (5XX) XXX XX XX" 
                            />
                            {formData.phone && validateTurkishPhone(formData.phone) && (
                              <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                          </div>
                          {formData.phone && !validateTurkishPhone(formData.phone) && formData.phone.length > 10 && (
                            <p className="text-[10px] text-amber-500 font-medium ml-1">Geçerli bir telefon numarası giriniz.</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="companyName">Firma Adı</label>
                          <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                            <input id="companyName" type="text" value={formData.companyName} onChange={handleChange} required={role === "OPERATOR"} className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm" placeholder="Örn: Vidanjör A.Ş." />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="vehiclePlate">Araç Plakası (Opsiyonel)</label>
                          <div className="relative group">
                            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                            <input id="vehiclePlate" type="text" value={formData.vehiclePlate} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm uppercase" placeholder="34 ABC 123" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/50 mt-4 space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Güvenlik Doğrulaması</p>
                       <div id="recaptcha-container" className="flex justify-center scale-90 origin-top"></div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || !isCaptchaVerified || (role === "OPERATOR" && !validateTurkishPhone(formData.phone))}
                      className={`w-full font-bold py-4 rounded-2xl transition-all mt-2 shadow-lg flex items-center justify-center space-x-2 group ${
                        isCaptchaVerified 
                          ? "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{role === "OPERATOR" ? "Kodu Gönder ve Doğrula" : "Hesabı Oluştur"}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {isEmailSent ? (
                  <div className="space-y-8 py-4 text-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto border border-sky-500/20 relative z-10">
                        <Mail className="w-12 h-12 text-sky-400" />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-sky-500/20 blur-2xl rounded-full" />
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-white">E-posta Gönderildi</h2>
                      <p className="text-slate-400 text-sm px-4">
                        <span className="text-white font-medium">{formData.email}</span> adresine bir doğrulama bağlantısı gönderdik. Lütfen kutunuzu kontrol edin.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Link 
                        href="/login/customer"
                        className="block w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/20"
                      >
                        Giriş Sayfasına Git
                      </Link>
                      <button 
                        onClick={() => { setStep(2); setIsVerifying(false); setIsEmailSent(false); }}
                        className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
                      >
                        Bilgileri Düzenle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto border border-sky-500/20 mb-4 animate-pulse">
                        <Phone className="w-10 h-10 text-sky-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Telefon Doğrulaması</h2>
                      <p className="text-slate-400 text-sm">
                        <span className="text-white font-medium">{formData.phone}</span> numaralı telefonunuza gönderilen 6 haneli kodu girin.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-2xl rounded-full" />
                       
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-sky-400 font-bold uppercase tracking-[0.2em]">Sonuç Kodu</span>
                        {timer > 0 ? (
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded-md">
                            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                            <span>Kalan Süre: {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}</span>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={handleResendOtp}
                            disabled={!canResend}
                            className="text-[10px] text-amber-400 font-bold uppercase hover:text-amber-300 transition-colors disabled:opacity-50"
                          >
                            Kodu Tekrar Gönder
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
                        className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-sky-500/30 flex items-center justify-center"
                      >
                        {verifyingOtp ? (
                          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Doğrula ve Kaydı Tamamla"
                        )}
                      </button>

                      {otpError && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] text-red-500 text-center font-bold flex items-center justify-center space-x-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>{otpError}</span>
                        </motion.p>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => { setStep(2); setIsVerifying(false); }}
                        className="w-full text-slate-500 text-[10px] uppercase font-bold hover:text-slate-300 transition-colors pt-2 flex items-center justify-center space-x-2"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        <span>Numarayı Değiştir</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-400 text-sm">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-white font-bold hover:text-sky-400 underline underline-offset-4 decoration-sky-500/50 hover:decoration-sky-500 transition-all">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
