"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import locationData from "@/data/location_data.json";
import { 
  MapPin, Save, CheckCircle2, AlertCircle, Trash2, Plus, 
  Image as ImageIcon, LayoutDashboard, User, Briefcase, 
  Phone, Truck, Camera, Globe, ExternalLink, MessageSquare, 
  Clock, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

export default function OperatorDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"jobs" | "profile">("jobs");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile Basic Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [image, setImage] = useState("");

  // Service Areas
  const [city, setCity] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  
  // Gallery
  const [gallery, setGallery] = useState<any[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  // Available Jobs
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/operator/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setPhone(data.phone || "");
          setVehiclePlate(data.vehiclePlate || "");
          setImage(data.image || "");
          
          if (data.serviceCity) setCity(data.serviceCity);
          if (data.serviceDistricts) {
            try { setDistricts(JSON.parse(data.serviceDistricts)); } catch(e) {}
          }
          if (data.serviceNeighborhoods) {
            try { setNeighborhoods(JSON.parse(data.serviceNeighborhoods)); } catch(e) {}
          }
          if (data.businessImages) setGallery(data.businessImages);
        }
      } catch (err) {}
      setLoading(false);
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/operator/available-jobs");
      if (res.ok) {
        const data = await res.json();
        setAvailableJobs(data);
      }
    } catch (err) {}
    setLoadingJobs(false);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setDistricts([]);
    setNeighborhoods([]);
  };

  const toggleDistrict = (dist: string) => {
    if (dist === "Tümü") {
      setDistricts(["Tümü"]);
      setNeighborhoods(["Tümü"]);
      return;
    }
    
    let newDists = [...districts].filter(d => d !== "Tümü");
    if (newDists.includes(dist)) {
      newDists = newDists.filter(d => d !== dist);
    } else {
      newDists.push(dist);
    }
    setDistricts(newDists);
    setNeighborhoods([]);
  };

  const toggleNeighborhood = (hood: string) => {
    if (hood === "Tümü") {
      setNeighborhoods(["Tümü"]);
      return;
    }

    let newHoods = [...neighborhoods].filter(h => h !== "Tümü");
    if (newHoods.includes(hood)) {
      newHoods = newHoods.filter(h => h !== hood);
    } else {
      newHoods.push(hood);
    }
    setNeighborhoods(newHoods);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      // 1. Basic Info Update
      const basicRes = await fetch("/api/operator/profile/basic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, vehiclePlate, image }),
      });

      // 2. Service Areas Update
      const areaRes = await fetch("/api/operator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCity: city,
          serviceDistricts: JSON.stringify(districts),
          serviceNeighborhoods: JSON.stringify(neighborhoods)
        }),
      });

      if (basicRes.ok && areaRes.ok) {
        setMessage({ type: "success", text: "Firma ve profil bilgileriniz başarıyla güncellendi." });
      } else {
        setMessage({ type: "error", text: "Güncelleme sırasında bir hata oluştu." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setAddingImage(true);
    try {
      const res = await fetch("/api/operator/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newImageUrl }),
      });
      if (res.ok) {
        const newImg = await res.json();
        setGallery([...gallery, newImg]);
        setNewImageUrl("");
      }
    } catch (err) {}
    setAddingImage(false);
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await fetch(`/api/operator/gallery?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGallery(gallery.filter(img => img.id !== id));
      }
    } catch (err) {}
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <img src="/icon.png" className="w-16 h-16 animate-pulse opacity-50" />
      <span className="text-slate-400 font-medium">Panel Yükleniyor...</span>
    </div>
  );

  const currentDistricts = city ? Object.keys(LOCATION_DATA[city] || {}) : [];
  let currentNeighborhoods: string[] = [];
  if (city && districts.length > 0 && !districts.includes("Tümü")) {
    districts.forEach(d => {
      const hoods = LOCATION_DATA[city][d] || [];
      currentNeighborhoods = [...currentNeighborhoods, ...hoods];
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tab Navigation */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-full max-w-md mx-auto mb-10">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all font-bold ${
            activeTab === "jobs" 
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>İş İlanları</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all font-bold ${
            activeTab === "profile" 
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Firma Bilgilerim</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "jobs" ? (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <LayoutDashboard className="text-emerald-500" />
                  Müsait İşler
                </h1>
                <p className="text-slate-400 mt-1">Hizmet bölgelerinizdeki bekleyen ilanlar.</p>
              </div>
              <button 
                onClick={fetchJobs}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition-colors border border-slate-700"
                title="Yenile"
              >
                <Clock className={`w-5 h-5 ${loadingJobs ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-inner">
                  <AlertTriangle className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Şu an uygun iş bulunamadı</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Belirlediğiniz hizmet alanlarında ({city}) aktif iş kaydı bulunmamaktadır. Daha fazla iş görmek için hizmet bölgenizi genişletebilirsiniz.
                </p>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className="mt-6 text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 decoration-2"
                >
                  Bölgelerimi Düzenle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableJobs.map((job) => (
                  <motion.div 
                    layout
                    key={job.id} 
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all group flex flex-col h-full shadow-xl ring-1 ring-white/5 active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${job.isEmergency ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {job.isEmergency && (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-md animate-pulse">ACİL LİSTELENDİ</span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{job.serviceType}</h3>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800 italic">
                      "{job.description || "Açıklama belirtilmemiş."}"
                    </p>

                    <div className="space-y-3 mb-8">
                       <div className="flex items-center text-sm text-slate-300">
                         <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                         <span>{job.district} / {job.neighborhood}</span>
                       </div>
                       <div className="flex items-center text-sm text-slate-300">
                         <User className="w-4 h-4 mr-2 text-emerald-500" />
                         <span>Müşteri: {job.customer?.name}</span>
                       </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                       <a 
                        href={`https://wa.me/90${job.customer?.phone?.replace(/\D/g, '')}?text=Merhaba, Vidanjörcüm üzerinden gönderdiğiniz ${job.serviceType} ilanı için ulaşıyorum.`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
                       >
                         <MessageSquare className="w-4 h-4" />
                         <span>WhatsApp</span>
                       </a>
                       <a 
                        href={`tel:${job.customer?.phone}`}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl transition-all border border-slate-700"
                       >
                         <Phone className="w-4 h-4" />
                         <span>Ara</span>
                       </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* General Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
               <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                 <Truck className="text-emerald-500" />
                 Firma Profili
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-wider">İşletme Adı</label>
                   <div className="relative">
                     <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                     <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-emerald-500 outline-none transition-all"
                      placeholder="Örn: Mert Vidanjör"
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-wider">Telefon Numarası</label>
                   <div className="relative">
                     <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                     <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-emerald-500 outline-none transition-all"
                      placeholder="05XX XXX XX XX"
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-wider">Araç Plakası (Opsiyonel)</label>
                   <div className="relative">
                     <Truck className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                     <input 
                      type="text" 
                      value={vehiclePlate} 
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-emerald-500 outline-none transition-all"
                      placeholder="34 ABC 123"
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-wider">Profil Resmi URL</label>
                   <div className="relative">
                     <Camera className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                     <input 
                      type="text" 
                      value={image} 
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-emerald-500 outline-none transition-all"
                      placeholder="https://..."
                     />
                   </div>
                 </div>
               </div>
            </div>

            {/* Service Areas Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Globe className="text-emerald-500" />
                Hizmet Bölgeleri
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">1. Şehir</label>
                  <select 
                    value={city} 
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 appearance-none max-w-md ring-1 ring-white/5 shadow-inner"
                  >
                    <option value="">Şehir Seçiniz</option>
                    {Object.keys(LOCATION_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {city && (
                  <div className="animate-in slide-in-from-top duration-500">
                    <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">2. İlçeler (Çoklu Seçim)</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleDistrict("Tümü")}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          districts.includes("Tümü") 
                            ? "bg-emerald-500 text-slate-950 border-emerald-500" 
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        Tüm İlçe ve Mahalleler
                      </button>
                      {currentDistricts.map(d => (
                        <button
                          key={d}
                          onClick={() => toggleDistrict(d)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            districts.includes(d) 
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" 
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {city && districts.length > 0 && !districts.includes("Tümü") && (
                  <div className="animate-in slide-in-from-top duration-500">
                    <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">3. Mahalleler (Seçili {districts.length} İlçeden)</label>
                    <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto p-4 border border-slate-800 rounded-2xl bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      <button
                        onClick={() => toggleNeighborhood("Tümü")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          neighborhoods.includes("Tümü") 
                            ? "bg-emerald-500 text-slate-950 border-emerald-500" 
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        Tüm Mahalleler (Seçili İlçelerdeki)
                      </button>
                      {currentNeighborhoods.map(h => (
                        <button
                          key={h}
                          onClick={() => toggleNeighborhood(h)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            neighborhoods.includes(h) 
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" 
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <ImageIcon className="text-emerald-500" />
                İşletme Resimleri
              </h2>
              <p className="text-slate-500 text-sm mb-8">Profilinizde müşterilere gösterilecek fotoğraflar ekleyin.</p>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Resim URL'si: https://site.com/foto.jpg"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handleAddImage}
                  disabled={addingImage || !newImageUrl.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {addingImage ? "Ekleniyor..." : <><Plus className="w-5 h-5" /> Ekle</>}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.map((img) => (
                  <div key={img.id} className="relative aspect-square bg-slate-800 rounded-2xl overflow-hidden group border border-slate-800 shadow-xl">
                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        onClick={() => handleDeleteImage(img.id)}
                        className="bg-red-500 hover:bg-red-400 text-white p-3 rounded-full transition-all transform scale-75 group-hover:scale-100 shadow-2xl"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Henüz resim eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Save Button */}
            <div className="sticky bottom-6 flex justify-center z-40">
              <button 
                onClick={handleSaveProfile}
                disabled={saving || !city || districts.length === 0}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-12 py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50 text-lg uppercase tracking-wider group"
              >
                <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span>{saving ? "Kaydediliyor..." : "Tüm Bilgileri Kaydet"}</span>
              </button>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`fixed top-24 right-6 z-50 p-4 rounded-3xl shadow-2xl flex items-center space-x-3 backdrop-blur-md border ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10' 
                      : 'bg-red-500/10 text-red-400 border-red-500/50 shadow-red-500/10'
                  }`}
                >
                  <div className={`p-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <span className="font-bold">{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
