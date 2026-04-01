import { prisma } from "@/lib/prisma";
import { Users, UserCheck, Wrench, Briefcase } from "lucide-react";

export default async function AdminDashboard() {
  const totalUsers = await prisma.user.count();
  const customers = await prisma.user.count({ where: { role: "USER" } });
  const operators = await prisma.user.count({ where: { role: "OPERATOR" } });
  const totalJobs = await prisma.job.count();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Özet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-sky-500/10 p-4 rounded-xl">
            <Users className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Toplam Kullanıcı</p>
            <p className="text-2xl font-bold text-white">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl">
            <UserCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Müşteriler</p>
            <p className="text-2xl font-bold text-white">{customers}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-amber-500/10 p-4 rounded-xl">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Operatörler</p>
            <p className="text-2xl font-bold text-white">{operators}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4">
          <div className="bg-indigo-500/10 p-4 rounded-xl">
            <Briefcase className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Toplam Açılan İş</p>
            <p className="text-2xl font-bold text-white">{totalJobs}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Hoş Geldiniz</h2>
        <p className="text-slate-400">
          Sol taraftaki menüyü kullanarak platformdaki tüm kullanıcıların rollerini değiştirebilir, Müşteri ve Operatörleri yönetebilir veya uygun olmayan hesapları silebilirsiniz.
        </p>
        <p className="text-slate-400 mt-2">
          Bu alan tamamen güvenli olup sadece ADMIN yetkilendirmesi almış e-posta hesapları tarafından görülebilir.
        </p>
      </div>
    </div>
  );
}
