"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Phone, MessageSquare, Lock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

// Marker icon fixing for Leaflet in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Job {
  id: string;
  serviceType: string;
  city: string;
  district: string;
  neighborhood: string;
  lat: number;
  lng: number;
  description: string;
  isEmergency: boolean;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
}

interface JobMapProps {
  jobs: Job[];
}

export default function JobMap({ jobs }: JobMapProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Map center logic: Default to Istanbul or the first job
  const center: [number, number] = jobs.length > 0 
    ? [jobs[0].lat, jobs[0].lng] 
    : [41.0082, 28.9784];

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {jobs.map((job) => (
          <Marker 
            key={job.id} 
            position={[job.lat, job.lng]}
          >
            <Popup className="custom-popup">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl min-w-[200px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-sky-500/10 text-sky-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-sky-500/20">
                    {job.serviceType}
                  </span>
                  {job.isEmergency && (
                    <span className="animate-pulse bg-red-500/10 text-red-500 font-bold text-[10px] px-2 py-0.5 rounded-full border border-red-500/20">
                      ACİL
                    </span>
                  )}
                </div>
                
                <h3 className="text-white font-bold text-sm mb-1">
                  {job.neighborhood.includes("Mah.") ? job.neighborhood : `${job.neighborhood} Mah.`}
                </h3>
                {job.isEmergency && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase mb-2 animate-pulse w-fit">
                    <AlertCircle className="w-3 h-3" /> ACİL
                  </div>
                )}
                <p className="text-slate-400 text-[11px] mb-3">
                  {job.district} / {job.city}
                </p>

                {/* Müşteri Bilgileri ve WhatsApp - Sadece Operatörler veya ilan sahibi için (API bu kısmı zaten kısıtlıyor) */}
                {job.customer?.phone !== "Numara Gizli" ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-300 leading-none">{job.customer.name}</span>
                        <span className="text-[9px] text-slate-500 leading-none">{job.customer.phone}</span>
                      </div>
                    </div>

                    <a 
                      href={`https://wa.me/90${(job.customer?.phone || "").replace(/\D/g, "").startsWith("0") ? (job.customer?.phone || "").replace(/\D/g, "").substring(1) : (job.customer?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`vidanjorcum.com sitesinden vermiş olduğunuz ${job.serviceType} ilanı için size ulaşıyorum`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-1 shadow-lg shadow-emerald-500/20"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp ile Yaz</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 italic flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Detaylar sadece Operatörlere açıktır.
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-container {
          background-color: #020617 !important;
        }
        .leaflet-popup-content-wrapper {
          background-color: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background-color: #0f172a !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
      `}</style>
    </div>
  );
}
