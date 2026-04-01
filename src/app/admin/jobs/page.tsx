"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Filter,
  MoreVertical,
  AlertTriangle
} from "lucide-react";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingJob, setEditingJob] = useState<any | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;
    try {
      const res = await fetch(`/api/admin/jobs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
      }
    } catch (err) {}
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
      }
    } catch (err) {}
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || job.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">İlanlar yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <img src="/icon.png" className="w-8 h-8 object-contain" alt="Icon" />
            İlan Yönetimi
          </h1>
          <p className="text-slate-400 text-sm mt-1">Tüm ilanları görüntüleyin, düzenleyin veya silin.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="İsim, e-posta veya bölge ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 outline-none w-full sm:w-64"
            />
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PENDING">Beklemede</option>
            <option value="ACCEPTED">Kabul Edildi</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="CANCELLED">İptal Edildi</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Müşteri / Tarih</th>
                <th className="px-6 py-4">Hizmet / Bölge</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">Operatör</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Henüz ilan bulunmamaktadır veya arama kriterine uygun ilan yok.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{job.customer?.name}</span>
                        <span className="text-slate-500 text-xs mb-1">{job.customer?.email}</span>
                        <span className="text-slate-500 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(job.createdAt).toLocaleDateString('tr-TR')} {new Date(job.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1 text-sm">
                          <span className="text-sky-400 font-semibold">{job.serviceType}</span>
                          {job.isEmergency && (
                            <span className="bg-red-500/10 text-red-500 text-[9px] px-1.5 py-0.5 rounded-full border border-red-500/20 font-bold">ACİL</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.city} / {job.district}
                        </span>
                        <span className="text-slate-500 text-[10px] italic line-clamp-1 max-w-[200px]">{job.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(job.status)}`}>
                        {job.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                        {job.status === "ACCEPTED" && <img src="/icon.png" className="w-4 h-4 mr-1 object-contain" alt="Icon" />}
                        {job.status === "COMPLETED" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {job.status === "CANCELLED" && <XCircle className="w-3 h-3 mr-1" />}
                        {translateStatus(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {job.operator ? (
                        <div className="flex flex-col">
                          <span className="text-slate-300 text-sm font-medium">{job.operator.name}</span>
                          <span className="text-slate-500 text-[10px]">{job.operator.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Atanmadı</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PENDING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "ACCEPTED": return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    case "COMPLETED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "CANCELLED": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

function translateStatus(status: string) {
  switch (status) {
    case "PENDING": return "Beklemede";
    case "ACCEPTED": return "Kabul Edildi";
    case "COMPLETED": return "Tamamlandı";
    case "CANCELLED": return "İptal Edildi";
    default: return status;
  }
}
