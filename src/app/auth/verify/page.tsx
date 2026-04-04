"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { checkActionCode, applyActionCode } from "firebase/auth";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("E-posta adresiniz doğrulanıyor...");

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get("oobCode");
      
      if (!oobCode) {
        setStatus("error");
        setMessage("Geçersiz veya eksik doğrulama kodu.");
        return;
      }

      try {
        // 1. Kodu kontrol et ve e-postayı al
        const info = await checkActionCode(auth, oobCode);
        const email = info.data.email;

        if (!email) {
            throw new Error("E-posta bilgisi alınamadı.");
        }

        // 2. Firebase üzerinde doğrulamayı uygula
        await applyActionCode(auth, oobCode);

        // 3. Bizim veritabanımızı (Prisma) güncelle
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          throw new Error("Veritabanı güncellenirken bir hata oluştu.");
        }

        setStatus("success");
        setMessage("E-posta adresiniz başarıyla doğrulandı! Artık giriş yapabilirsiniz.");
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          error.code === "auth/invalid-action-code"
            ? "Bu doğrulama kodu geçersiz veya süresi dolmuş."
            : "Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl shadow-black/50"
      >
        <div className="flex justify-center">
          {status === "loading" && (
            <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          )}
          {status === "error" && (
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            {status === "loading" ? "Doğrulanıyor..." : status === "success" ? "Başarılı!" : "Hata!"}
          </h1>
          <p className="text-slate-400 text-sm">
            {message}
          </p>
        </div>

        {status !== "loading" && (
          <div className="pt-4">
            <Link 
              href="/login"
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 group"
            >
              <span>Giriş Yap</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
