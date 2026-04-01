"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, Search, X, ShieldAlert, ShieldCheck, User as UserIcon, Truck, Shield, Filter, Ban, CheckCircle2, Users, Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  vehiclePlate: string | null;
  isSuspended: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);

  // Düzenleme Modal State'leri
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kullanıcıyı sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert("Silme başarısız.");
      }
    } catch {}
  };

  const toggleSuspension = async (user: User) => {
    const action = user.isSuspended ? "aktif etmek" : "askıya almak";
    if (!confirm(`Bu hesabı ${action} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !user.isSuspended })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u));
      } else {
        alert("İşlem başarısız.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  const startEdit = (user: User) => {
    setEditingUser({ ...user });
    setEditModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setEditModalOpen(false);
        fetchUsers();
      } else {
        alert("Güncelleme başarısız.");
      }
    } catch {}
    setIsUpdating(false);
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
                           (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
                           (u.phone || "").includes(search);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Users className="w-8 h-8 text-sky-500" />
             Kullanıcı Yönetimi
           </h1>
           <p className="text-slate-400 mt-1">Platformdaki tüm kullanıcıları denetleyin, rolleri yönetin ve hesapları askıya alın.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="İsim, e-posta veya telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-2xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-600 shadow-lg"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-40 bg-slate-900 border border-slate-800 text-white pl-9 pr-4 py-3 rounded-2xl focus:border-sky-500 outline-none transition-all appearance-none shadow-lg"
            >
              <option value="ALL">Tüm Roller</option>
              <option value="USER">Müşteri</option>
              <option value="OPERATOR">Operatör</option>
              <option value="ADMIN">Yönetici</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Kullanıcı", val: users.length, color: "text-white" },
          { label: "Operatörler", val: users.filter(u => u.role === "OPERATOR").length, color: "text-amber-500" },
          { label: "Askıya Alınanlar", val: users.filter(u => u.isSuspended).length, color: "text-rose-500" },
          { label: "Yeni (Son 7 Gün)", val: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7*86400000)).length, color: "text-emerald-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/40 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Kullanıcı</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Durum</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">İletişim</th>
                <th 
                  className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-white transition-colors"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  <div className="flex items-center gap-1">
                    Kayıt Tarihi
                    {sortOrder === "desc" ? <ArrowDown className="w-3 h-3 text-sky-500" /> : <ArrowUp className="w-3 h-3 text-sky-500" />}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                       <span className="text-slate-500 animate-pulse font-medium">Veriler getiriliyor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <AlertCircle className="w-12 h-12 text-slate-700" />
                       <span className="text-slate-500 font-medium">Eşleşen kullanıcı bulunamadı.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-800/20 transition-all group ${user.isSuspended ? 'bg-rose-500/[0.02]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                          user.isSuspended ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 
                          'bg-slate-800 border-slate-700 text-slate-400 group-hover:border-sky-500/50'
                        }`}>
                          {user.role === "ADMIN" ? <Shield className="w-5 h-5" /> : 
                           user.role === "OPERATOR" ? <Truck className="w-5 h-5" /> : 
                           <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-none mb-1 flex items-center gap-2">
                            {user.name || "İsimsiz"}
                            {user.role === "ADMIN" && <span className="bg-rose-500/10 text-rose-500 text-[8px] px-1 py-0.5 rounded border border-rose-500/20">ROOT</span>}
                          </p>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${
                            user.role === "OPERATOR" ? "text-amber-500/70" : "text-sky-500/70"
                          }`}>{user.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isSuspended ? (
                          <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 px-2 py-1 rounded-lg border border-rose-500/20">
                            <ShieldAlert className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Askıya Alındı</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Aktif</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-300 font-medium">{user.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{user.phone || "Telefon Yok"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-slate-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleSuspension(user)} 
                          className={`p-2 rounded-xl transition-all border ${
                            user.isSuspended 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950' 
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                          }`}
                          title={user.isSuspended ? "Kilidi Aç" : "Askıya Al"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEdit(user)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)} 
                          disabled={user.role === "ADMIN"}
                          className="p-2 text-slate-500 hover:text-white hover:bg-red-600 bg-slate-800 border border-slate-700 rounded-xl transition-all disabled:opacity-0"
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

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
              onClick={() => setEditModalOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Kullanıcı Profilini Düzenle</h2>
                <button onClick={() => setEditModalOpen(false)} className="p-2 hover:bg-slate-700 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={saveEdit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Tam İsim</label>
                    <input 
                      type="text" 
                      value={editingUser.name || ""} 
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">E-posta</label>
                    <input 
                      type="email" 
                      value={editingUser.email || ""} 
                      disabled
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-500 outline-none cursor-not-allowed opacity-50 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Sistem Rolü</label>
                    <select 
                      value={editingUser.role} 
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium appearance-none"
                    >
                      <option value="USER">Müşteri (USER)</option>
                      <option value="OPERATOR">Operatör (OPERATOR)</option>
                      <option value="ADMIN">Yönetici (ADMIN)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Telefon</label>
                    <input 
                      type="text" 
                      value={editingUser.phone || ""} 
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="Henüz belirtilmemiş"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {editingUser.role === "OPERATOR" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Araç Plakası</label>
                    <input 
                      type="text" 
                      value={editingUser.vehiclePlate || ""} 
                      onChange={(e) => setEditingUser({ ...editingUser, vehiclePlate: e.target.value })}
                      placeholder="34 ABC 01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium uppercase"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">İptal</button>
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="flex-1 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
