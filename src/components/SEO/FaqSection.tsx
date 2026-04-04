"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  items: FaqItem[];
  city?: string;
  district?: string;
}

export default function FaqSection({ items, city, district }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <section className="mt-16 bg-slate-900/30 rounded-3xl p-6 md:p-8 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
          <HelpCircle className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
             {district || city} Vidanjör Hakkında Sıkça Sorulanlar
          </h2>
          <p className="text-sm text-slate-500">Müşterilerimizden gelen popüler soruları yanıtladık.</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
              openIndex === index 
                ? "bg-slate-900/80 border-sky-500/30 border-b-2 shadow-lg h-auto" 
                : "bg-slate-950/20 border-slate-800 hover:border-slate-700 h-16 md:h-20"
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 md:p-6 text-left"
            >
              <span className="text-sm md:text-base font-semibold text-slate-200 group-hover:text-white transition-colors">
                {item.question}
              </span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className={`w-5 h-5 ${openIndex === index ? "text-sky-400" : "text-slate-600"}`} />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-6 text-sm md:text-base text-slate-400 leading-relaxed border-t border-slate-800 mt-2 pt-4">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
