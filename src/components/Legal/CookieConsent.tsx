"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X, Settings, ChevronRight, Lock, Eye, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LEGAL_CONTENT } from "@/data/legal_content";
import LegalModal from "./LegalModal";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"kvkk" | "privacy" | "cookies">("cookies");

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent-v2");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent-v2", "all");
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent-v2", "necessary");
    setIsVisible(false);
  };

  const openLegal = (type: "kvkk" | "privacy" | "cookies") => {
    setLegalModalType(type);
    setIsLegalModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 pointer-events-none"
          >
            <div className="max-w-5xl mx-auto glass-card rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 pointer-events-auto relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-sky-500/20 shadow-inner group transition-transform hover:scale-110">
                    <ShieldCheck className="w-8 h-8 text-sky-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      Gizlilik ve Çerez Yönetimi
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30 uppercase">KVKK Uyumlu</span>
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                      Deneyiminizi kişiselleştirmek ve sitemizi geliştirmek için çerezleri kullanıyoruz. 
                      <button onClick={() => openLegal("kvkk")} className="text-sky-400 hover:underline font-bold ml-1">KVKK Aydınlatma Metni</button>'ni inceleyebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all border border-slate-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Ayarlar</span>
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-[2] md:flex-none bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-10 py-3.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 whitespace-nowrap active:scale-95"
                  >
                    Tümünü Kabul Et
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/5 pt-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { icon: <Lock className="w-4 h-4" />, title: "Zorunlu", desc: "Sitenin çalışması için teknik olarak gereklidir.", status: "Aktif", color: "text-emerald-400" },
                        { icon: <BarChart3 className="w-4 h-4" />, title: "Analitik", desc: "Ziyaretçi istatistiklerini anonim olarak toplar.", status: "Seçilebilir", color: "text-sky-400" },
                        { icon: <Eye className="w-4 h-4" />, title: "Pazarlama", desc: "Size özel reklam ve içerikler sunar.", status: "Seçilebilir", color: "text-indigo-400" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl group hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                             <div className={`p-2 rounded-lg bg-slate-900 ${item.color}`}>
                               {item.icon}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 leading-tight">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={acceptNecessary}
                        className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                      >
                        Sadece gerekli olanları kaydet <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalModal 
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        title={LEGAL_CONTENT[legalModalType].title}
        content={LEGAL_CONTENT[legalModalType].content}
      />
    </>
  );
}
