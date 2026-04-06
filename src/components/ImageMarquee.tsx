"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function ImageMarquee() {
  const images = useMemo(() => [
    { src: "/vidanjor1.png", alt: "Profesyonel Vidanjör Hizmetleri - Tıkanıklık Açma" },
    { src: "/vidanjor1 (2).png", alt: "Acil Kanal Açma ve Altyapı Temizliği" },
    { src: "/vidanjor1 (3).png", alt: "Logar ve Foseptik Çekimi Hizmeti" },
    { src: "/vidanjor1 (4).png", alt: "Belediye Tipi Büyük Vidanjör Kiralama" },
    { src: "/vidanjor1 (5).png", alt: "Modern Kanalizasyon Görüntüleme ve Açma" },
    { src: "/vidanjor1 (6).png", alt: "7/24 Acil Vidanjör Servis Aracı" },
  ], []);

  // Sonsuz döngü için resim listesini iki kez çoğaltıyoruz
  const doubledImages = [...images, ...images];

  return (
    <div className="w-full overflow-hidden bg-white/[0.02] py-12 border-y border-white/5 relative">
      {/* Yanlardaki solma efektleri (gradient mask) */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-6 items-center px-4"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
        style={{ width: "fit-content" }}
      >
        {doubledImages.map((imgData, index) => (
          <div
            key={index}
            className="flex-shrink-0 group relative"
          >
            <div className="w-[180px] md:w-[260px] aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 shadow-2xl transition-all duration-500 group-hover:border-sky-500/50 group-hover:scale-[1.02]">
              <img
                src={imgData.src}
                alt={imgData.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
