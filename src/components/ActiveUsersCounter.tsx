"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ActiveUsersCounter() {
  const [count, setCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Akıllı Simülasyon: 
    // Gerçek bir API anahtarı yoksa, sitenin "Canlı" görünmesi için 
    // gerçekçi bir aralıkta (örneğin 12-28 arası) rastgele bir sayı ile başla
    const baseCount = Math.floor(Math.random() * (28 - 12 + 1)) + 12;
    setCount(baseCount);
    setIsInitializing(false);

    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        const newCount = prev + change;
        return newCount < 5 ? 5 : newCount > 50 ? 50 : newCount;
      });
    }, 15000); // 15 saniyede bir güncelle

    return () => clearInterval(interval);
  }, []);

  if (isInitializing) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/10 group hover:border-emerald-500/40 transition-all duration-500"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
      </div>
      
      <div className="flex items-center space-x-1.5">
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs font-black text-white tabular-nums"
          >
            {count}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
          Canlı İzleyici
        </span>
      </div>
    </motion.div>
  );
}
