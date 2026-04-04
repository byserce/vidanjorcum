"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-white/5">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold">Çerez Deneyimi</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Size daha iyi bir hizmet sunabilmek için çerezleri kullanıyoruz. Sitemizi kullanarak çerez politikamızı kabul etmiş sayılırsınız.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={acceptCookies}
                className="flex-1 md:flex-none bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 whitespace-nowrap text-sm"
              >
                Kabul Et
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-3 text-slate-500 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
