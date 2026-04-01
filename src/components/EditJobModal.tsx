"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Droplets, AlertCircle, Save, Loader2 } from "lucide-react";
import locationData from "@/data/location_data.json";

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

const SERVICES = [
  { title: "Foseptik Çukuru Boşaltma", desc: "Dolmuş atık su depolarının tahliyesi" },
  { title: "Kanal Açma ve Temizleme", desc: "Tıkanmış ana hatların açılması" },
  { title: "Logar Temizliği", desc: "Bina rögar boru ve kuyularının vakumlanması" },
  { title: "Atık Su Tahliyesi", desc: "Su baskınında tahliye işlemleri" },
  { title: "Endüstriyel Atık Temizliği", desc: "Fabrika veya tesis atık suları" },
  { title: "Periyodik Bakım", desc: "Otel / site altyapı temizliği" },
];

interface EditJobModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditJobModal({ job, isOpen, onClose, onSuccess }: EditJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: job.serviceType,
    city: job.city,
    district: job.district,
    neighborhood: job.neighborhood,
    description: job.description,
    isEmergency: job.isEmergency,
  });

  const availableDistricts = Object.keys(LOCATION_DATA[formData.city] || {});
  const availableNeighborhoods = LOCATION_DATA[formData.city]?.[formData.district] || [];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Re-calculate geocoding if location changed (simplified for modal, reuse logic if possible)
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || "Güncelleme başarısız.");
      }
    } catch (err) {
      alert("Bir bağlantı hatası oluştu.");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
                  İlanı Düzenle
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">İlan bilgilerinizi güncelleyebilirsiniz.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Servis Türü */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  Hizmet Türü
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICES.map((s) => (
                    <div 
                      key={s.title}
                      onClick={() => setFormData({ ...formData, serviceType: s.title })}
                      className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        formData.serviceType === s.title 
                        ? "bg-sky-500/10 border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.1)]" 
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <h3 className="text-xs font-bold text-slate-200">{s.title}</h3>
                    </div>
                  ))}
                </div>
              </div>

              {/* Konum */}
              <div className="space-y-4">
                 <label className="block text-sm font-medium text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Konum Detayları
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select 
                    value={formData.city} 
                    onChange={e => setFormData({ ...formData, city: e.target.value, district: Object.keys(LOCATION_DATA[e.target.value])[0], neighborhood: LOCATION_DATA[e.target.value][Object.keys(LOCATION_DATA[e.target.value])[0]][0] })} 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none appearance-none"
                  >
                    {Object.keys(LOCATION_DATA).map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                   <select 
                    value={formData.district} 
                    onChange={e => setFormData({ ...formData, district: e.target.value, neighborhood: LOCATION_DATA[formData.city][e.target.value]?.[0] || "" })} 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none appearance-none"
                  >
                    {availableDistricts.map(district => <option key={district} value={district}>{district}</option>)}
                  </select>
                  <select 
                    value={formData.neighborhood} 
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none appearance-none"
                  >
                    {availableNeighborhoods.map(hood => <option key={hood} value={hood}>{hood}</option>)}
                  </select>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Açıklama / Not</label>
                <textarea 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-500 outline-none resize-none"
                  placeholder="İş birimi hakkında detaylı bilgi..."
                />
              </div>

              {/* Aciliyet */}
              <label className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.isEmergency}
                  onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })}
                  className="w-4 h-4 accent-red-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Acil Müdahale İstiyorum
                  </span>
                  <span className="text-[10px] text-slate-500">Operatörlere öncelikli bildirim gider.</span>
                </div>
              </label>

              {/* Submit */}
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
