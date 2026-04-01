"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, Edit, Check, X, MessageSquare, User } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  customer: { name: string; email: string };
  operator: { name: string };
  job: { id: string; serviceType: string; city: string } | null;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err) {}
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rating: editRating, comment: editComment }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchReviews();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-sky-400" />
          Yorum ve Puan Yönetimi
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Müşteri / İş</th>
                <th className="px-6 py-4 font-semibold">Firma (Operatör)</th>
                <th className="px-6 py-4 font-semibold">Puan / Yorum</th>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-500">Yorumlar yükleniyor...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-500">Henüz yorum yapılmamış.</td></tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-800/20 transition-colors align-top">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          {review.customer.name}
                        </span>
                        <span className="text-xs text-slate-500">{review.customer.email}</span>
                        {review.job && (
                          <div className="mt-2 text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1 w-fit">
                            <img src="/icon.png" className="w-4 h-4 object-contain opacity-50" alt="Icon" />
                            {review.job.serviceType} (#{review.job.id.slice(0,6)})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sky-400 font-medium">{review.operator.name}</span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {editingId === review.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(num => (
                              <button key={num} onClick={() => setEditRating(num)}>
                                <Star className={`w-4 h-4 ${num <= editRating ? "text-amber-500 fill-current" : "text-slate-600"}`} />
                              </button>
                            ))}
                          </div>
                          <textarea 
                            value={editComment} 
                            onChange={(e) => setEditComment(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-sky-500"
                            rows={3}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(num => (
                              <Star key={num} className={`w-3 h-3 ${num <= review.rating ? "text-amber-500 fill-current" : "text-slate-700"}`} />
                            ))}
                            <span className="ml-1 font-bold text-amber-500 text-xs">{review.rating}</span>
                          </div>
                          <p className="text-slate-400 text-xs line-clamp-3 italic">
                            "{review.comment || "Yorum bırakılmadı."}"
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === review.id ? (
                          <>
                            <button onClick={() => saveEdit(review.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Kaydet">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="İptal">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(review)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(review.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
