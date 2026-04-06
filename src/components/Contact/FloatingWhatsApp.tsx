"use client";

import { MessageCircle, X, Megaphone, Phone, ShieldCheck, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const whatsappNumber = "905050366080";
  const message = encodeURIComponent("Merhaba, reklam vermek / sorun bildirmek istiyorum.");

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 5000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 20000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[90] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {showTooltip && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="glass-card text-white px-5 py-3 rounded-[1.5rem] shadow-2xl text-xs font-bold whitespace-nowrap relative pointer-events-auto border-sky-500/30 ring-4 ring-sky-500/5 group hover:scale-105 transition-transform cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/10 rounded-lg">
                 <Megaphone className="w-4 h-4 text-sky-400 animate-[bounce_2s_infinite]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-sky-300 uppercase tracking-tighter opacity-80">İletişim Hattı</span>
                <span className="text-sm">7/24 Destek & Reklam 🚀</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1.5 border border-white/20 hover:bg-rose-500 transition-colors shadow-lg"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            {/* Arrow */}
            <div className="absolute top-full right-8 w-4 h-4 bg-slate-900 rotate-45 -translate-y-2 border-b border-r border-white/5" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-72 rounded-[2.5rem] p-6 mb-2 pointer-events-auto border-sky-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
               <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                 <HeartPulse className="w-6 h-6 text-emerald-400 animate-pulse" />
               </div>
               <div className="flex flex-col">
                 <h4 className="text-white font-black tracking-tight">Hizmet Merkezi</h4>
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black uppercase tracking-widest">Çevrimiçi</span>
                 </div>
               </div>
            </div>

            <div className="space-y-3">
               <a 
                 href={`https://wa.me/${whatsappNumber}?text=${message}`}
                 className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 group/btn"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 <MessageCircle className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                 <div className="flex flex-col items-start leading-tight">
                   <span className="text-[9px] uppercase font-black tracking-tighter opacity-70">En Hızlı Yol</span>
                   <span className="font-bold text-sm">WhatsApp Destek</span>
                 </div>
               </a>

               <a 
                 href={`tel:+905050366080`}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-white px-5 py-4 rounded-2xl flex items-center gap-3 transition-all border border-slate-700 shadow-xl active:scale-95 group/btn"
               >
                 <Phone className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                 <div className="flex flex-col items-start leading-tight">
                   <span className="text-[9px] uppercase font-black tracking-tighter opacity-70">Doğrudan Ara</span>
                   <span className="font-bold text-sm">Müşteri Hattı</span>
                 </div>
               </a>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-4 opacity-50">
               <div className="flex items-center gap-1.5">
                 <ShieldCheck className="w-3 h-3 text-sky-400" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Güvenli Hat</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)] text-white p-4 sm:p-5 rounded-[2rem] shadow-2xl relative pointer-events-auto ring-8 ring-emerald-500/5 transition-all group"
      >
        <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] animate-ping opacity-10 group-hover:hidden" />
        
        <div className="relative">
          {isExpanded ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform" />}
          {/* Badge */}
          {!isExpanded && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full animate-pulse shadow-lg flex items-center justify-center text-[8px] font-black">
              1
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
