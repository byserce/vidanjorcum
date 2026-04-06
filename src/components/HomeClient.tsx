"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MapPin, AlertTriangle, LogIn, LogOut, Search, Clock, Phone, Globe, Lock, Star, ChevronDown, FileText, CheckCircle2, AlertCircle, Pencil, Trash2, Truck } from "lucide-react";
import EditJobModal from "@/components/EditJobModal";
import locationData from "@/data/location_data.json";
import ImageMarquee from "@/components/ImageMarquee";
import Link from "next/link";
import ActiveUsersCounter from "@/components/ActiveUsersCounter";
import AnnouncementBar from "@/components/AnnouncementBar";
import { ShieldCheck, Zap, Award, Users } from "lucide-react";

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

// Tarayıcı tarafında çalışması gerektiği için dinamik yükleme yapıyoruz
const JobMap = dynamic(() => import("@/components/JobMap"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-900 animate-pulse rounded-3xl flex items-center justify-center text-slate-500">Harita yükleniyor...</div>
});

export default function HomeClient({ 
  pendingJobsCount, 
  initialRegion 
}: { 
  pendingJobsCount: number;
  initialRegion?: { city: string; district?: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [region, setRegion] = useState<{city: string, district?: string} | null>(null);
  const [tempCity, setTempCity] = useState("");
  const [tempDistrict, setTempDistrict] = useState("");
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loadingMyJobs, setLoadingMyJobs] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (initialRegion) {
      setRegion(initialRegion);
      setTempCity(initialRegion.city);
      if (initialRegion.district) setTempDistrict(initialRegion.district);
      return;
    }

    const saved = localStorage.getItem("vidanjorcum_region");
    if (saved) {
      try {
        setRegion(JSON.parse(saved));
      } catch(e) {}
    }
    setIsInitializing(false);
  }, [initialRegion]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (isInitializing || !region) return;
      setLoadingJobs(true);
      try {
        const url = new URL("/api/jobs", window.location.origin);
        if (region.city) url.searchParams.append("city", region.city);
        if (region.district) url.searchParams.append("district", region.district);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (err) {}
      setLoadingJobs(false);
    };
    fetchJobs();
  }, [session, region, isInitializing]);
  
  const fetchMyJobs = async () => {
    if (!session || (session.user as any).role === "OPERATOR") return;
    setLoadingMyJobs(true);
    try {
      const res = await fetch("/api/jobs/my-jobs");
      if (res.ok) {
        const data = await res.json();
        setMyJobs(data);
      }
    } catch (err) {}
    setLoadingMyJobs(false);
  };

  useEffect(() => {
    fetchMyJobs();
  }, [session]);

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMyJobs();
      } else {
        const err = await res.json();
        alert(err.message || "Silme işlemi başarısız.");
      }
    } catch (err) {
      alert("Bağlantı hatası.");
    }
  };

  const handleManualLocationSubmit = () => {
    if (!tempCity) return;
    const newRegion = { city: tempCity, district: tempDistrict || undefined };
    setRegion(newRegion);
    localStorage.setItem("vidanjorcum_region", JSON.stringify(newRegion));
  };

  const handleGeolocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servisini desteklemiyor. Lütfen listeden seçiniz.");
      setLoadingLocation(false);
      return;
    }
    
    // Yardımcı fonksiyon: Metni temizle ve Büyük harfe çevir (Türkçe karakter duyarlı)
    const normalize = (str: string) => {
      if (!str) return "";
      return str
        .replace(/( İli| İlçesi| Belediyesi| Valiliği| Büyükşehir Belediyesi| Eyaleti| Province| City| State)$/i, "")
        .trim()
        .toLocaleUpperCase('tr-TR');
    };

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
        
        if (res.ok) {
          const data = await res.json();
          const address = data.address;
          
          // Nominatim'den gelen farklı alanları kontrol et
          const rawCity = address.province || address.city || address.state || address.admin_area;
          const rawDistrict = address.town || address.district || address.county || address.suburb || address.city_district;
          
          if (rawCity) {
            const searchCity = normalize(rawCity);
            const cities = Object.keys(LOCATION_DATA);
            
            // 1. Tam eşleşme ara
            let matchedCity = cities.find(c => c === searchCity);
            
            // 2. Kısmi eşleşme ara (İçinde geçiyor mu?)
            if (!matchedCity) {
              matchedCity = cities.find(c => searchCity.includes(c) || c.includes(searchCity));
            }
            
            // 3. LocaleCompare ile garantiye al
            if (!matchedCity) {
              matchedCity = cities.find(c => c.localeCompare(searchCity, 'tr', { sensitivity: 'base' }) === 0);
            }

            if (matchedCity) {
              // İlçe eşleştirmesi
              let matchedDistrict = undefined;
              if (rawDistrict) {
                const searchDistrict = normalize(rawDistrict);
                const districts = Object.keys(LOCATION_DATA[matchedCity] || {});
                matchedDistrict = districts.find(d => 
                  d === searchDistrict || 
                  searchDistrict.includes(d) || 
                  d.includes(searchDistrict) ||
                  d.localeCompare(searchDistrict, 'tr', { sensitivity: 'base' }) === 0
                );
              }

              const newRegion = { city: matchedCity, district: matchedDistrict };
              setRegion(newRegion);
              localStorage.setItem("vidanjorcum_region", JSON.stringify(newRegion));
              
              // Seçimi senkronize et
              setTempCity(matchedCity);
              if (matchedDistrict) setTempDistrict(matchedDistrict);
              
            } else {
              alert(`Konumunuzdaki il (${rawCity}) hizmet bölgelerimizde bulunamadı. Lütfen listeden seçiniz.`);
            }
          } else {
            alert("Konumunuzdaki il tespit edilemedi. Lütfen listeden seçiniz.");
          }
        }
      } catch (err) {
        console.error("Geolocation error:", err);
        alert("Konum çözümlenirken bir hata oluştu. Lütfen İnternet bağlantınızı kontrol edin.");
      }
      setLoadingLocation(false);
    }, (err) => {
      let msg = "Konum izni reddedildi veya konum bulunamadı.";
      if (err.code === 1) msg = "Konum izni reddedildi. Lütfen tarayıcı ayarlarından konuma izin verin.";
      else if (err.code === 2) msg = "Konum bilgisi alınamadı (GPS kapalı olabilir).";
      else if (err.code === 3) msg = "Konum alma işlemi zaman aşımına uğradı.";
      
      alert(msg);
      setLoadingLocation(false);
    }, { timeout: 10000 });
  };

  useEffect(() => {
    if (region) {
      const element = document.getElementById("firms-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [region]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <AnnouncementBar />
      
      <header className="sticky top-0 w-full z-50 glass-header">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src="/icon.png" alt="Vidanjörcüm Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-lg md:text-2xl font-black bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent tracking-tighter">
              vidanjörcüm
            </span>
          </Link>

          <div className="hidden lg:block">
            <ActiveUsersCounter />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {session ? (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                    {session.user?.name}
                  </span>
                  <span className="text-[9px] text-sky-400 font-black uppercase tracking-tighter mt-1">
                    {(session.user as any).role === 'OPERATOR' ? 'Operatör' : 'Müşteri'}
                  </span>
                </div>
                {(session.user as any).role === 'OPERATOR' && (
                  <button 
                    onClick={() => router.push('/operator')}
                    className="flex items-center gap-1.5 bg-sky-500 text-slate-950 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all text-[10px] md:text-xs font-black shadow-lg shadow-sky-500/20 active:scale-95"
                  >
                    <Zap className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                    <span className="hidden md:inline">PANELİM</span>
                    <span className="md:hidden">PANEL</span>
                  </button>
                )}
                <button onClick={() => signOut()} className="p-2 md:p-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full transition-all border border-white/5">
                  <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => signIn()} 
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all text-xs md:text-sm font-bold border border-white/10 shadow-xl"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Giriş</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 flex flex-col items-center justify-center relative overflow-hidden mesh-bg">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

        {/* Görsel Şerit (Marquee) Section */}
        <div className="relative z-20 overflow-hidden mb-12 w-full pt-12 md:pt-20">
          <ImageMarquee />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full mb-6 md:mb-8 hover:bg-sky-500/20 transition-colors group cursor-default"
          >
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            <span className="text-[10px] md:text-xs font-black text-sky-400 uppercase tracking-[0.2em]">Türkiye'nin Vidanjör Platformu</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl xs:text-4xl md:text-7xl font-black tracking-tight mb-4 md:mb-6 max-w-5xl leading-[1.1] text-white"
          >
            {initialRegion ? (
              <>
                <span className="text-transparent bg-clip-text premium-gradient">
                   {initialRegion.district || initialRegion.city} Vidanjör
                </span> <br /> Acil Kanal Açma
              </>
            ) : (
              <>
                Altyapı Sorunlarına <br />
                <span className="text-transparent bg-clip-text premium-gradient">
                  Kesin Çözüm.
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-xl text-slate-400 mb-8 md:mb-12 max-w-2xl px-4 leading-relaxed font-medium"
          >
            Size en yakın profesyonel vidanjör operatörlerini anında bulun, 
            <span className="text-white font-bold"> tek tıkla</span> iletişime geçin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-8 w-full max-w-2xl mx-auto items-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mx-auto">
              <button
                onClick={() => session ? router.push("/post-job") : router.push("/login/customer")}
                className="flex-1 group relative overflow-hidden premium-gradient text-white font-black px-8 py-5 rounded-[2rem] transition-all flex items-center justify-center space-x-3 shadow-[0_20px_50px_rgba(14,165,233,0.3)] hover:-translate-y-1 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Zap className="w-6 h-6 relative z-10 fill-current" />
                <span className="relative z-10 text-base md:text-lg">Hemen Talep Oluştur</span>
              </button>

              {!session && (
                <button
                  onClick={() => router.push("/login/operator")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-5 rounded-[2rem] transition-all border border-white/10 hover:border-white/20 flex items-center justify-center space-x-3 backdrop-blur-md active:scale-95 shadow-xl"
                >
                  <Truck className="w-6 h-6 text-sky-400" />
                  <span className="text-base md:text-lg">Operatör Girişi</span>
                </button>
              )}
            </div>

            {/* My Jobs Section for Customers */}
            {session && (session.user as any).role !== "OPERATOR" && myJobs.length > 0 && (
              <div className="w-full max-w-2xl sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-700 mt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    İlanlarım ({myJobs.length})
                  </h3>
                  <button 
                    onClick={() => router.push("/post-job")}
                    className="text-[10px] uppercase font-bold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Yeni Ekle +
                  </button>
                </div>
                
                <div className="space-y-3">
                  {myJobs.slice(0, 3).map((job) => (
                    <div 
                      key={job.id} 
                      className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-sky-500/50 transition-all shadow-lg ring-1 ring-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${job.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {job.status === 'PENDING' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-white leading-none mb-1 truncate">{job.serviceType}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                            {job.district} / {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          job.status === 'PENDING' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {job.status === 'PENDING' ? 'Bekliyor' : 'Kayıt Alındı'}
                        </span>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          {job.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingJob(job);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors border border-slate-700"
                                title="Düzenle"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg transition-colors border border-slate-700"
                                title="Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {job.status !== 'PENDING' && (
                            <div className="flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter">Ekip Yolda</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {myJobs.length > 3 && (
                    <p className="text-center text-[10px] text-slate-600 italic">Daha fazla ilanınız bulunmaktadır.</p>
                  )}
                </div>
              </div>
            )}

            {editingJob && (
              <EditJobModal 
                job={editingJob}
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingJob(null);
                }}
                onSuccess={() => fetchMyJobs()}
              />
            )}

            {/* Basic Location Selector in Hero */}
            <div className="w-full glass-card p-6 md:p-8 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-3xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-sky-500/20">
                Hızlı Arama
              </div>

              <p className="text-slate-300 text-sm md:text-base font-bold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400 animate-pulse" />
                Bölgendeki operatörleri hemen listele:
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                    onClick={handleGeolocation} 
                    disabled={loadingLocation}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-5 py-4 rounded-2xl flex items-center justify-center border border-white/10 transition-all disabled:opacity-50 text-sm font-bold active:scale-95"
                  >
                    <MapPin className={`w-5 h-5 mr-2 ${loadingLocation ? "animate-bounce text-sky-400" : "text-sky-400"}`} />
                    {loadingLocation ? "Bulunuyor..." : "Konumumu Bul"}
                  </button>

                  <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 group">
                      <select 
                        value={tempCity} 
                        onChange={(e) => {
                          setTempCity(e.target.value);
                          setTempDistrict("");
                        }}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-4 pr-10 py-4 text-white outline-none focus:border-sky-500 appearance-none text-sm cursor-pointer transition-all hover:bg-slate-950"
                      >
                        <option value="">İl Seçiniz</option>
                        {Object.keys(LOCATION_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                    
                    <div className="relative flex-1 group">
                      <select 
                        value={tempDistrict} 
                        onChange={(e) => setTempDistrict(e.target.value)}
                        disabled={!tempCity}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-4 pr-10 py-4 text-white outline-none focus:border-sky-500 appearance-none disabled:opacity-30 text-sm cursor-pointer transition-all hover:bg-slate-950"
                      >
                        <option value="">İlçe (Tümü)</option>
                        {tempCity && Object.keys(LOCATION_DATA[tempCity] || {}).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                    </div>
                  </div>

                  <button 
                    onClick={handleManualLocationSubmit}
                    disabled={!tempCity}
                    className="w-full sm:w-auto premium-gradient text-white font-black px-10 py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-lg shadow-sky-600/20 active:scale-95"
                  >
                    LİSTELE
                  </button>
                </div>
              </div>

              {region && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 italic">Şu an seçili:</span>
                    <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full border border-sky-500/30 font-medium">
                      {region.city}{region.district ? ` - ${region.district}` : " (Tüm İl)"}
                    </span>
                    <button 
                      onClick={() => { setRegion(null); localStorage.removeItem("vidanjorcum_region"); setJobs([]); }} 
                      className="text-slate-500 hover:text-red-400 transition-colors ml-1 underline underline-offset-2"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scroll Indicator */}
            {region && (
              <motion.div 
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center gap-2 mt-8 cursor-pointer group"
                onClick={() => document.getElementById("firms-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="text-xs font-bold tracking-widest uppercase text-sky-500/80 group-hover:text-sky-400 transition-colors">
                  Aşağıdaki Firmaları Gör
                </span>
                <div className="p-2 rounded-full bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40 transition-all">
                   <ChevronDown className="w-6 h-6 text-sky-400" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <section id="firms-section" className="bg-slate-900 border-t border-slate-800 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          
          {/* Hizmetlerimiz SEO Section */}
          <div className="mb-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { title: "Kanal Açma", desc: "Robotik cihazlarla kırmadan kanal açma.", icon: <Search className="w-8 h-8 text-sky-400" />, badge: "7/24 Acil" },
              { title: "Logar Temizlik", desc: "Periyodik bakım ve logar tahliyesi.", icon: <CheckCircle2 className="w-8 h-8 text-sky-400" />, badge: "Hijyenik" },
              { title: "Foseptik", desc: "Büyük araçlarla hızlı ve temiz çekim.", icon: <Truck className="w-8 h-8 text-sky-400" />, badge: "Uzman Ekip" },
              { title: "Gider Açma", desc: "Mutfak ve banyo lavabo tıkanıklıkları.", icon: <AlertCircle className="w-8 h-8 text-sky-400" />, badge: "Garantili" },
            ].map((s, i) => (
              <div key={i} className="p-6 glass-card rounded-[2.5rem] text-center group hover:border-sky-500/30 transition-all flex flex-col items-center">
                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 border border-sky-500/20 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <div className="bg-sky-500/10 text-sky-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-sky-500/20 mb-3">{s.badge}</div>
                <h3 className="text-white font-black mb-3 group-hover:text-sky-400 transition-colors uppercase tracking-tight text-sm md:text-base">{s.title}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>

          {region && (
            <div className="animate-fade-in mb-24">
              <OperatorList region={region} session={session} />
            </div>
          )}

          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                {region ? `${region.city}${region.district ? ` - ${region.district}` : ""} Aktif İlanlar` : "Bölgendeki Aktif İlanlar"}
              </h2>
              {region && (
                <div className="inline-block bg-sky-500/10 border border-sky-500/20 rounded-full px-6 py-2 mb-4">
                  <span className="text-sky-400 font-medium">
                    Sistemde şu an <strong className="text-white text-lg">{jobs.length}</strong> aktif iş var!
                  </span>
                </div>
              )}
              <p className="text-slate-500 mt-2 text-sm max-w-xl mx-auto">
                Konumlar gizlilik gereği Mahalle / İlçe düzeyinde gösterilir. Operatör numaraları tüm kullanıcılara açıktır.
              </p>
            </div>

            <div className="w-full">
              {isInitializing ? (
                <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
                  <p className="text-slate-500">Yükleniyor...</p>
                </div>
              ) : !region ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 text-center">
                  <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Lütfen yukarıdan bir konum seçerek aktif ilanları ve haritayı görüntüleyin.</p>
                </div>
              ) : loadingJobs ? (
                <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
                  <p className="text-slate-500 animate-pulse text-lg">İlanlar yükleniyor...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="relative h-[500px] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg group">
                  <div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 blur-[2px] pointer-events-none">
                     <JobMap jobs={[]} />
                  </div>
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <AlertTriangle className="w-16 h-16 text-slate-500 mb-6" />
                    <p className="text-white text-2xl font-bold mb-3">Bu bölgede henüz ilan bulunmamaktadır.</p>
                    <p className="text-slate-300 text-base max-w-md bg-slate-900/80 px-6 py-4 rounded-xl border border-slate-700 shadow-xl">
                      Farklı bir bölge seçebilir veya yeni bir ilan oluşturabilirsiniz.
                    </p>
                  </div>
                </div>
              ) : !session ? (
                <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-sky-500/5 backdrop-blur-3xl z-0 transition-opacity duration-500 group-hover:bg-sky-500/10" />
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-2xl border border-slate-700 relative">
                       <MapPin className="w-12 h-12 text-slate-500 opacity-50" />
                       <div className="absolute -bottom-2 -right-2 bg-slate-950 rounded-full p-2 border-2 border-slate-800 shadow-xl">
                         <Lock className="w-6 h-6 text-sky-400" />
                       </div>
                     </div>
                     <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Harita ve İlan Detayları Gizli</h3>
                     <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed">
                       <strong className="text-white text-xl">{region.city} {region.district ? `- ${region.district}` : ""}</strong> bölgesinde şu an <strong className="text-white text-xl">{jobs.length}</strong> aktif ilan bulunmaktadır. İlanların detaylarını görmeniz için giriş yapmalısınız.
                     </p>
                     <button onClick={() => signIn()} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center space-x-3 text-lg hover:-translate-y-1">
                       <LogIn className="w-6 h-6" />
                       <span>Giriş Yap / Kayıt Ol</span>
                     </button>
                  </div>
                </div>
              ) : (
                <JobMap jobs={jobs} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEO Footer Section */}
      <footer className="bg-slate-950 border-t border-slate-800 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-500" />
                Vidanjörcüm Hizmetleri
              </h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Acil Vidanjör Kiralama</li>
                <li>Foseptik Çukuru Temizliği</li>
                <li>Logar ve Kanal Açma</li>
                <li>Mutfak ve Lavabo Gider Açma</li>
                <li>Sanayi Tipi Atık Çekimi</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-500" />
                Popüler Şehirler
              </h3>
              <div className="grid grid-cols-2 gap-2 text-slate-400 text-sm">
                <Link href="/vidanjor/istanbul">İstanbul Vidanjör</Link>
                <Link href="/vidanjor/ankara">Ankara Vidanjör</Link>
                <Link href="/vidanjor/izmir">İzmir Vidanjör</Link>
                <Link href="/vidanjor/antalya">Antalya Vidanjör</Link>
                <Link href="/vidanjor/bursa">Bursa Vidanjör</Link>
                <Link href="/vidanjor/kocaeli">Kocaeli Vidanjör</Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-sky-500" />
                Hakkımızda
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Vidanjörcüm, Türkiye'nin her noktasında profesyonel operatörleri müşterilerle buluşturan 
                ilk ve en büyük vidanjör platformudur. Altyapı sorunlarınıza hızlı, uygun fiyatlı ve garantili çözümler sunuyoruz.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest leading-loose">
             &copy; {new Date().getFullYear()} Vidanjörcüm - Tüm Hakları Saklıdır. <br />
             Müşteri & Operatör Buluşma Noktası
          </div>
        </div>
      </footer>
    </div>
  );
}

// SEO Footer için Link importu gerebilir, üstte Link yoksa ekle (ama router kullanıyoruz genelde)
// Aslında statik linkler için normal <a> veya Link farketmez ama Link daha hızlı.
// Başa import ekliyorum.

// Operators Bileşeni
function OperatorList({ region, session }: { region: any, session: any }) {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/operators", window.location.origin);
        if (region.city) url.searchParams.append("city", region.city);
        if (region.district) url.searchParams.append("district", region.district);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setOperators(data);
        }
      } catch (err) {}
      setLoading(false);
    };
    fetchOperators();
  }, [region]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4">
        <img src="/icon.png" className="w-12 h-12 object-contain animate-bounce opacity-20" alt="Icon" />
        <span className="animate-pulse">Bölgenizdeki operatörler taranıyor...</span>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center max-w-3xl mx-auto">
        <img src="/icon.png" className="w-12 h-12 object-contain mx-auto mb-4 opacity-40" alt="Icon" />
        <p className="text-lg text-slate-400 font-medium">Bu bölgede henüz kayıtlı bir vidanjör firması bulunmuyor.</p>
        <p className="text-sm text-slate-500 mt-2">İlk olmak için hemen kayıt olabilirsiniz!</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tümü Onaylı Firmalar</span>
        </div>
        <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">
          {region.city} Vidanjör Firmaları
        </h3>
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-medium">Bölgenizdeki lisanslı ve güvenilir ekiplere doğrudan ulaşın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {operators.map((op) => (
          <div key={op.id} className="glass-card rounded-[3rem] p-8 hover:border-sky-500/50 transition-all group flex flex-col h-full relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/5 blur-[40px] rounded-full group-hover:bg-sky-500/10 transition-colors" />
            
            <div className="flex items-start gap-5 mb-8 relative z-10">
              <div className="w-20 h-20 bg-slate-950/50 rounded-3xl flex flex-shrink-0 items-center justify-center overflow-hidden border border-white/5 group-hover:border-sky-500/50 transition-colors shadow-2xl">
                {op.image ? (
                  <img src={op.image} alt={op.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <img src="/icon.png" className="w-10 h-10 object-contain brightness-75 group-hover:brightness-110 transition-all" alt="Icon" />
                    <span className="text-[8px] font-black text-slate-500 mt-1 uppercase">V-CERT</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1 mb-2">
                   <div className="flex items-center gap-1.5">
                     <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20 tracking-tighter">Kurumsal Onaylı</span>
                     {op.reviewCount > 5 && <Award className="w-3 h-3 text-amber-500" />}
                   </div>
                   <h4 className="text-xl font-black text-white leading-tight truncate group-hover:text-sky-400 transition-colors">{op.name || "İsimsiz Firma"}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-black">{op.avgRating > 0 ? op.avgRating : "Yeni"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{op.reviewCount || 0} DEĞERLENDİRME</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-8 flex-1 relative z-10">
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                <MapPin className="w-4 h-4 mt-0.5 text-sky-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Hizmet Alanı</span>
                  <p className="text-xs text-slate-300 font-bold leading-tight">
                    {op.serviceCity} {op.serviceDistricts && op.serviceDistricts !== '["Tümü"]' ? "ve seçili ilçeler" : "- Tüm Bölgeler"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">7/24 Aktif</span>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                  <Users className="w-3 h-3 text-sky-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Uzman Ekip</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto relative z-10">
              <a 
                href={`tel:${op.phone}`} 
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20 group/phone overflow-hidden relative active:scale-95"
              >
                <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover/phone:translate-x-full transition-transform duration-700 skew-x-[45deg]" />
                <Phone className="w-5 h-5 relative z-10 fill-current" />
                <span className="relative z-10 text-base">HEMEN ARA</span>
              </a>
              
              <button 
                onClick={() => router.push(`/firms/${op.id}`)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/10 shadow-xl active:scale-95"
              >
                <span>Firma Detaylarını Gör</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
