"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MapPin, AlertCircle, Droplets, CheckCircle2 } from "lucide-react";
import locationData from "@/data/location_data.json";

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

export default function PostJobPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  
  // Varsayılan il, ilçe ve mahalle bilgilerini JSON'dan alalım
  const defaultCity = Object.keys(LOCATION_DATA)[0] || "";
  const defaultDistrict = Object.keys(LOCATION_DATA[defaultCity] || {})[0] || "";
  const defaultNeighborhood = LOCATION_DATA[defaultCity]?.[defaultDistrict]?.[0] || "";

  const [formData, setFormData] = useState({
    serviceType: "Foseptik Çukuru Boşaltma",
    city: defaultCity, 
    district: defaultDistrict,
    neighborhood: defaultNeighborhood,
    description: "",
    isEmergency: false,
  });


  const availableDistricts = Object.keys(LOCATION_DATA[formData.city] || {});
  const availableNeighborhoods = LOCATION_DATA[formData.city]?.[formData.district] || [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") {
    return null;
  }

  const SERVICES = [
    { title: "Foseptik Çukuru Boşaltma", desc: "Dolmuş atık su depolarının tahliyesi" },
    { title: "Kanal Açma ve Temizleme", desc: "Tıkanmış ana hatların açılması" },
    { title: "Logar Temizliği", desc: "Bina rögar boru ve kuyularının vakumlanması" },
    { title: "Atık Su Tahliyesi", desc: "Su baskınında tahliye işlemleri" },
    { title: "Endüstriyel Atık Temizliği", desc: "Fabrika veya tesis atık suları" },
    { title: "Periyodik Bakım", desc: "Otel / site altyapı temizliği" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // İstanbul varsayılan koordinatı (geocoding başarısız olursa diye fallback)
      let finalLat = 41.0082;
      let finalLng = 28.9784;

      try {
        const cleanNeighborhood = formData.neighborhood.replace(" Mah.", "").trim();
        const addressQuery = `${cleanNeighborhood}, ${formData.district}, ${formData.city}, Turkey`;
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            // Gizlilik için mahalleye 100-200 metre civarı rastgele sapma eklendi
            const randomLatOffset = (Math.random() - 0.5) * 0.003;
            const randomLngOffset = (Math.random() - 0.5) * 0.003;
            finalLat = parseFloat(geoData[0].lat) + randomLatOffset;
            finalLng = parseFloat(geoData[0].lon) + randomLngOffset;
          }
        }
      } catch (err) {
        console.error("Geocoding hatası:", err);
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, lat: finalLat, lng: finalLng })
      });

      if (res.ok) {
        alert("İlanınız başarıyla oluşturuldu! Operatörler yakında görecektir.");
        router.push("/");
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || "Hata oluştu.");
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-4">
            <img src="/icon.png" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt="Logo" />
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Vidanjörcüm
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Hizmet Talebi Oluştur</h1>
          <p className="text-slate-400">Bölgendeki profesyonelleri hızla bul.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
          
          {/* Servis Seçimi */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Droplets className="w-5 h-5 text-sky-400 mr-2" />
              1. Hizmet Türü Seçimi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICES.map((s) => (
                <div 
                  key={s.title}
                  onClick={() => setFormData({ ...formData, serviceType: s.title })}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    formData.serviceType === s.title 
                    ? "bg-sky-500/10 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)] ring-1 ring-sky-500" 
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-slate-200 text-sm">{s.title}</h3>
                    {formData.serviceType === s.title && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                  </div>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Konum Bilgileri */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 text-sky-400 mr-2" />
              2. Konum Detayları
            </h2>
            <p className="text-xs text-slate-500 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-sky-400 font-semibold mb-1 block">Gizlilik Kuralları Uygulanmaktadır:</span>
              Ziyaretçiler ve harita üzerindeki herkes tam adresinizi <strong>göremez</strong>. Sistem haritada noktanızı Mahalle seviyesinde bulanıklaştırarak gösterir. Sadece işi kabul etmek isteyen veya kabul eden Operatörler telefon numaranıza erişebilir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">İl (Şehir)</label>
                <select 
                  required 
                  value={formData.city} 
                  onChange={e => setFormData({ ...formData, city: e.target.value, district: Object.keys(LOCATION_DATA[e.target.value])[0], neighborhood: LOCATION_DATA[e.target.value][Object.keys(LOCATION_DATA[e.target.value])[0]][0] })} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 appearance-none"
                >
                  {Object.keys(LOCATION_DATA).map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">İlçe</label>
                <select 
                  required 
                  value={formData.district} 
                  onChange={e => setFormData({ ...formData, district: e.target.value, neighborhood: LOCATION_DATA[formData.city][e.target.value]?.[0] || "" })} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 appearance-none"
                >
                  {availableDistricts.map(district => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mahalle</label>
                <select 
                  required 
                  value={formData.neighborhood} 
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-sky-500 appearance-none"
                >
                  {availableNeighborhoods.map(hood => <option key={hood} value={hood}>{hood}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tam Adres veya Müşteri Notu</label>
              <textarea 
                rows={3}
                required
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Rögar kapağının altında, sokak başında vb..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 resize-none text-sm" 
              />
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Aciliyet */}
          <section className="flex items-center space-x-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
            <input 
              type="checkbox" 
              id="emergency" 
              checked={formData.isEmergency}
              onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })}
              className="w-5 h-5 accent-red-500 cursor-pointer" 
            />
            <label htmlFor="emergency" className="cursor-pointer select-none">
              <span className="flex items-center text-red-400 font-bold mb-0.5">
                <AlertCircle className="w-4 h-4 mr-1.5" /> Acil Müdahale Gerekiyor
              </span>
              <span className="text-xs text-slate-500">Işınlanma butonuyla tüm operatörlere öncelikli bildirim atılır.</span>
            </label>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all disabled:opacity-50 flex items-center justify-center text-lg"
          >
            {loading ? "Oluşturuluyor..." : "İlanı Yayınla"}
          </button>
        </form>
      </div>
    </div>
  );
}
