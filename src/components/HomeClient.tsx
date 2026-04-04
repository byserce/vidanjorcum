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
      <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <img src="/icon.png" alt="Vidanjörcüm" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">
              Vidanjörcüm
            </span>
          </div>

          <div>
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
                  <span className="text-sm text-white font-medium block leading-none">
                    {session.user?.name}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-700 uppercase tracking-tighter mt-1">
                    {(session.user as any).role === 'OPERATOR' ? 'Operatör' : 'Müşteri'}
                  </span>
                </div>
                {(session.user as any).role === 'OPERATOR' && (
                  <button 
                    onClick={() => router.push('/operator')}
                    className="flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1.5 sm:px-3 rounded-full transition-all text-[10px] sm:text-xs font-bold"
                  >
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Operatör İşlemleri</span>
                    <span className="sm:hidden">Panelim</span>
                  </button>
                )}
                <button onClick={() => signOut()} className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full transition-all text-sm font-medium">
                  <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Çıkış</span>
                </button>
              </div>
            ) : (
              <button onClick={() => signIn()} className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full transition-all text-sm font-medium">
                <LogIn className="w-4 h-4" /><span>Giriş Yap</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Görsel Şerit (Marquee) Section */}
        <div className="relative z-20 overflow-hidden mb-6 w-full">
          <ImageMarquee />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl leading-tight"
          >
            {initialRegion ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                   {initialRegion.district || initialRegion.city} Vidanjör
                </span> <br /> Acil Kanal Açma Hizmetleri
              </>
            ) : (
              <>
                Altyapı Sorunlarına <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                  Profesyonel Çözüm
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-slate-400 mb-8 max-w-lg"
          >
            Bölgendeki en yakın ve müsait vidanjör operatörlerine sadece tek tıkla ulaş. Güvenilir, hızlı ve konum bazlı hizmet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-8 w-full max-w-2xl mx-auto items-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
              <button
                onClick={() => session ? router.push("/post-job") : router.push("/login/customer")}
                className="flex-1 group relative overflow-hidden bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <MapPin className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Vidanjör Talebi Oluştur</span>
              </button>

              {!session && (
                <button
                  onClick={() => router.push("/login/operator")}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-4 rounded-2xl transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2"
                >
                  <Truck className="w-5 h-5 text-sky-400" />
                  <span>Vidanjörcüyüm, Giriş Yap</span>
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
            <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center">
              <p className="text-slate-300 text-sm font-medium mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Bölgendeki vidanjörcüleri ve ilanları görmek için konum seç:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button 
                  onClick={handleGeolocation} 
                  disabled={loadingLocation}
                  className="sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl flex items-center justify-center border border-slate-700 transition-all disabled:opacity-50 text-sm whitespace-nowrap"
                  title="Konumumu Bul"
                >
                  <MapPin className={`w-4 h-4 mr-2 ${loadingLocation ? "animate-bounce" : ""}`} />
                  {loadingLocation ? "Bulunuyor..." : "Konumumu Bul"}
                </button>

                <div className="flex flex-1 gap-2">
                  <select 
                    value={tempCity} 
                    onChange={(e) => {
                      setTempCity(e.target.value);
                      setTempDistrict("");
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white outline-none focus:border-sky-500 appearance-none text-sm"
                  >
                    <option value="">İl Seçiniz</option>
                    {Object.keys(LOCATION_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <select 
                    value={tempDistrict} 
                    onChange={(e) => setTempDistrict(e.target.value)}
                    disabled={!tempCity}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white outline-none focus:border-sky-500 appearance-none disabled:opacity-50 text-sm"
                  >
                    <option value="">İlçe (Tümü)</option>
                    {tempCity && Object.keys(LOCATION_DATA[tempCity] || {}).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <button 
                  onClick={handleManualLocationSubmit}
                  disabled={!tempCity}
                  className="sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-sky-600/20 active:scale-95"
                >
                  Gör
                </button>
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
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {region.city} {region.district ? `- ${region.district}` : ""} Vidanjör Firmaları
          <span className="ml-3 text-sky-400 text-lg font-medium bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            {operators.length} Firma
          </span>
        </h3>
        <p className="text-slate-400">Bu bölgede hizmet veren profesyonel operatörlere doğrudan ulaşın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.map((op) => (
          <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-sky-500/50 transition-all shadow-xl group flex flex-col h-full ring-1 ring-white/5 hover:ring-sky-500/30">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-2xl flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-sky-500 transition-colors shadow-inner">
                {op.image ? (
                  <img src={op.image} alt={op.name} className="w-full h-full object-cover" />
                ) : (
                  <img src="/icon.png" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" alt="Icon" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-1.5 mb-1">
                   <div className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">Onaylı</div>
                   <h4 className="text-base sm:text-lg font-bold text-white truncate">{op.name || "İsimsiz Operatör"}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-500">
                    <Star className={`w-3 h-3 ${op.avgRating > 0 ? "fill-current" : ""}`} />
                    <span className="text-xs font-bold ml-1">{op.avgRating > 0 ? op.avgRating : "Yeni"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">({op.reviewCount} yorum)</span>
                </div>
                <div className="flex items-center text-[10px] text-slate-400 mt-1">
                  <MapPin className="w-3 h-3 mr-1 text-sky-500/70" />
                  <span className="truncate">{op.serviceCity} {op.serviceDistricts && op.serviceDistricts !== '["Tümü"]' ? "ve seçili bölgeler" : "- Tüm İl"}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-auto">
              <a 
                href={`tel:${op.phone}`} 
                className="w-full bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-400 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center space-x-2 border border-sky-500/20 shadow-lg shadow-sky-500/5 group/phone"
              >
                <Phone className="w-4 h-4 group-hover/phone:animate-bounce" />
                <span>Ara: {op.phone || "Belirtilmemiş"}</span>
              </a>
              
              <button 
                onClick={() => router.push(`/firms/${op.id}`)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-2xl transition-all flex items-center justify-center space-x-2 border border-slate-700 shadow-lg"
              >
                <span>Detaylı Bilgi & Yorumlar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
