"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Sparkles, Phone, MessageSquare, ShieldCheck, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isVisible || !isMounted) return null;

  const messages = [
    "🚀 Vidanjörcüm Hizmete Girdi! Türkiye'nin En Büyük Vidanjör Ağı.",
    "💎 Operatörler İçin Kayıtlar Başladı! Hemen Ücretsiz Profil Oluşturun.",
    "🛡️ Tüm İşlemleriniz Vidanjörcüm Güvencesiyle 7/24 Takipte.",
    "📍 Size En Yakın Vidanjör Aracı Bir Tık Uzağınızda."
  ];

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="relative z-[60] bg-sky-600 text-white overflow-hidden border-b border-white/10"
    >
      <div className="container mx-auto px-4 h-10 flex items-center justify-center relative">
        {/* Subtle Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_4s_infinite] pointer-events-none" />

        <div className="flex flex-1 overflow-hidden whitespace-nowrap group relative">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ 
              duration: 35, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex gap-20 items-center"
          >
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-20 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                {messages.map((msg, idx) => (
                  <span key={idx} className="flex items-center gap-4">
                    <Sparkles className="w-3 h-3 text-sky-200 animate-pulse" />
                    {msg}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors z-10"
          aria-label="Kapat"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
}
