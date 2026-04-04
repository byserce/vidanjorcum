"use client";

import Link from "next/link";
import { User, Truck, ChevronRight, MessageCircle } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <AuthNavigation backHref="/" />
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10 text-center">
        <div className="mb-12">
           <img src="/icon.png" className="w-16 h-16 mx-auto mb-6 object-contain" alt="Logo" />
           <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
             Nasıl Giriş Yapmak İstersiniz?
           </h1>
           <p className="text-slate-400 text-lg">
             Size en uygun paneli seçerek devam edin.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {/* Müşteri Kutusu */}
          <Link href="/login/customer" className="group">
            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-sky-500/50 hover:bg-slate-900/60 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6 text-sky-500" />
               </div>
               
               <div className="w-20 h-20 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 border border-sky-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <User className="w-10 h-10 text-sky-400" />
               </div>

               <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">Müşteri Girişi</h2>
               <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Vidanjör hizmeti talep etmek, ilanları takip etmek ve teklif almak için.
               </p>
               
               <div className="mt-auto w-full py-3 bg-sky-500/10 rounded-xl text-sky-400 font-bold text-sm tracking-wide group-hover:bg-sky-500 group-hover:text-slate-950 transition-all">
                  Hemen Devam Et
               </div>
            </div>
          </Link>

          {/* Operatör Kutusu */}
          <Link href="/login/operator" className="group">
            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-orange-500/50 hover:bg-slate-900/60 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6 text-orange-500" />
               </div>

               <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                  <Truck className="w-10 h-10 text-orange-400" />
               </div>

               <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Operatör Girişi</h2>
               <p className="text-slate-400 text-sm leading-relaxed">
                  İş taleplerini yanıtlamak, portföyünüzü yönetmek ve kazanç sağlamak için.
               </p>

               <div className="mt-8 w-full py-3 bg-orange-500/10 rounded-xl text-orange-400 font-bold text-sm tracking-wide group-hover:bg-orange-500 group-hover:text-slate-950 transition-all">
                  Panelime Eriş
               </div>
            </div>
          </Link>
        </div>

        <p className="mt-12 text-slate-500 text-sm">
           Hesabınız yok mu?{" "}
           <Link href="/register" className="text-white hover:underline font-medium transition-all underline-offset-4">
             Hemen Kaydolun
           </Link>
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
           <a 
              href="https://wa.me/905050366080?text=Merhaba,%20platformda%20reklam%20vermek%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full border border-emerald-500/20 transition-all"
           >
              <MessageCircle className="w-4 h-4" />
              Reklam ve İş Birliği İçin WhatsApp
           </a>
           
           <div className="opacity-20 hover:opacity-100 transition-opacity">
              <Link href="/login/admin" className="text-[10px] text-slate-600 uppercase tracking-widest hover:text-rose-500 transition-colors">
                 Yönetici Girişi
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
