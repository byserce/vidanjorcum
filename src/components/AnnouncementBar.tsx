"use client";

import { motion } from "framer-motion";
import { Megaphone, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isVisible || !isMounted) return null;

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="relative z-[60] bg-gradient-to-r from-sky-600 via-blue-700 to-sky-600 text-white overflow-hidden shadow-lg border-b border-white/10"
    >
      <div className="container mx-auto px-4 h-10 md:h-12 flex items-center justify-center relative">
        {/* Animated Background Sparkle */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-full bg-white/30 skew-x-[45deg] animate-[shimmer_3s_infinite]" />
        </div>

        <div className="flex items-center gap-4 max-w-full overflow-hidden">
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
            <Megaphone className="w-3 h-3 text-sky-200" />
            <span className="text-[10px] font-black uppercase tracking-tighter">DUYURU</span>
          </div>

          {/* Marquee Container */}
          <div className="flex flex-1 overflow-hidden whitespace-nowrap group">
            <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ 
                duration: 25, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex gap-12 items-center"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 text-xs md:text-sm font-bold tracking-wide">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-300" />
                    Bölgendeki En İyi Vidanjör Firmaları Burada! 🚜
                  </span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  <span>Kanal Açma, Logar Temizleme ve Vidanjör Hizmetleri 7/24 📞</span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  <span className="text-sky-200 font-extrabold uppercase">Reklam Vermek İçin İletişime Geçin 📢</span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Kapat"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(45deg); }
          100% { transform: translateX(400%) skewX(45deg); }
        }
      `}</style>
    </motion.div>
  );
}
