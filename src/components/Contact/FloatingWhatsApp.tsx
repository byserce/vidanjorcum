"use client";

import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(false);
  const whatsappNumber = "905050366080";
  const message = encodeURIComponent("Merhaba, reklam vermek / sorun bildirmek istiyorum.");

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 5000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 12000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="bg-white text-slate-900 px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold whitespace-nowrap relative pointer-events-auto"
          >
            Reklam ve Destek Hattı
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 border border-white/20"
            >
              <X className="w-2 h-2" />
            </button>
            {/* Arrow */}
            <div className="absolute top-full right-6 w-3 h-3 bg-white rotate-45 -translate-y-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative group pointer-events-auto ring-4 ring-emerald-500/10"
      >
        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20 group-hover:hidden" />
        <MessageCircle className="w-7 h-7" />
        
        {/* Badge */}
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full" />
      </motion.a>
    </div>
  );
}
