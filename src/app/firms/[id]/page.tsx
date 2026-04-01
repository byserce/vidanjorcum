"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Phone, Star, ArrowLeft, MessageSquare, ShieldCheck, Lock, Image as ImageIcon, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FirmDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [firm, setFirm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFirm = async () => {
    try {
      const res = await fetch(`/api/firms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFirm(data);
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchFirm();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!session) {
      alert("Yorum yapmak için giriş yapmalısınız.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          operatorId: id,
          rating,
          comment
        })
      });
      if (res.ok) {
        setComment("");
        setRating(5);
        fetchFirm(); // Listeyi yenile
      } else {
        const data = await res.json();
        alert(data.message || "Yorum gönderilemedi.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/icon.png" className="w-12 h-12 object-contain animate-bounce" alt="Icon" />
          <p className="text-slate-500 animate-pulse">Firma bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Firma bulunamadı.</h1>
        <Link href="/" className="text-sky-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-bold truncate text-white">{firm.name}</h1>
          </div>
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white flex-shrink-0">
             <Home className="w-6 h-6" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-5xl">
        {/* Hero Section */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="flex items-center md:items-start gap-4 md:col-span-1">
            <div className="w-24 h-24 md:w-full md:aspect-square bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden relative group shadow-2xl flex-shrink-0">
              {firm.image ? (
                <img src={firm.image} alt={firm.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <img src="/icon.png" className="w-10 h-10 md:w-20 md:h-20 object-contain opacity-20" alt="Icon" />
                </div>
              )}
            </div>
            
            {/* Mobile Title/Badges */}
            <div className="md:hidden flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Onaylı
                </span>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                  <Star className="w-3 h-3 fill-current" /> {firm.avgRating || "Yeni"}
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-white truncate">{firm.name}</h2>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>{firm.serviceCity}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="hidden md:flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Onaylı Operatör
              </span>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                <Star className="w-3 h-3 fill-current" /> {firm.avgRating || "Yeni"} ({firm.reviewCount} Yorum)
              </div>
            </div>

            <h2 className="hidden md:block text-3xl md:text-5xl font-extrabold mb-4 text-white">{firm.name}</h2>
            
            <div className="hidden md:block space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-sky-500" />
                <span className="text-lg">{firm.serviceCity} {firm.serviceDistricts && firm.serviceDistricts !== '["Tümü"]' ? "ve seçili bölgeler" : "- Tüm İl"}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`tel:${firm.phone}`} className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20">
                <Phone className="w-5 h-5" /> {firm.phone || "Belirtilmemiş"}
              </a>
              <a 
                href={`https://wa.me/90${(firm.phone || "").replace(/\D/g, "").startsWith("0") ? (firm.phone || "").replace(/\D/g, "").substring(1) : (firm.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`vidanjorcum.com sitesi üzerinden size ulaşıyorum`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all border border-emerald-500/20 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
              >
                <MessageSquare className="w-5 h-5" /> WhatsApp ile Yaz
              </a>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-6 h-6 text-sky-400" />
            <h3 className="text-2xl font-bold text-white">İşletme Galerisi</h3>
          </div>
          
          {firm.businessImages && firm.businessImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {firm.businessImages.map((img: any) => (
                <motion.div 
                   key={img.id}
                   whileHover={{ scale: 1.02 }}
                   className="aspect-video bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg cursor-pointer"
                >
                  <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Bu işletme henüz fotoğraf eklememiş.</p>
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-amber-500 fill-current" />
              <h3 className="text-2xl font-bold text-white">Müşteri Yorumları</h3>
            </div>
            <div className="text-sm text-slate-500">{firm.reviewCount} toplam yorum</div>
          </div>

          {/* Add Review Form */}
          {!session ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl mb-12 text-center">
              <Lock className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Yorum Yapmak İster Misiniz?</h4>
              <p className="text-slate-400 mb-6">Deneyiminizi paylaşmak için lütfen önce giriş yapın.</p>
              <button 
                onClick={() => signIn()}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-lg"
              >
                Giriş Yap / Kayıt Ol
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-sky-500/20 p-6 rounded-3xl mb-12 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors" />
              
              <h4 className="text-lg font-bold text-white mb-4">Deneyiminizi Paylaşın</h4>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 mr-2">Puanınız:</span>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 ${num <= rating ? "text-amber-500 fill-current" : "text-slate-700 hover:text-slate-500"}`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bu firma hakkında ne düşünüyorsunuz? Hizmet kalitesi, hız ve iletişim nasıldı?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-sky-500 transition-all resize-none min-h-[120px] placeholder:text-slate-600"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || !comment.trim()}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    {submitting ? "Gönderiliyor..." : "Yorumu Yayınla"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {firm.reviewsReceived && firm.reviewsReceived.length > 0 ? (
              firm.reviewsReceived.map((review: any) => (
                <div key={review.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                        {review.customer.image ? (
                          <img src={review.customer.image} alt="User" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-slate-500 font-bold">{review.customer.name?.[0] || "U"}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold">{review.customer.name || "Anonim Kullanıcı"}</div>
                        <div className="text-[10px] text-slate-500">{new Date(review.createdAt).toLocaleDateString("tr-TR")}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-amber-500 fill-current" : "text-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 italic text-sm leading-relaxed">
                    "{review.comment || "Yorum bırakılmadı."}"
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 text-center text-slate-500">
                Henüz yorum yapılmamış. İlk yorumu siz yapabilirsiniz!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
