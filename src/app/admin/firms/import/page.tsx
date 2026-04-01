"use client";

import { useState } from "react";
import { Upload, FileCode, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

export default function BulkImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      // JSON geçerlilik kontrolü
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("Geçersiz JSON formatı. Lütfen kontrol ediniz.");
      }

      const res = await fetch("/api/admin/firms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      } else {
        const data = await res.json();
        throw new Error(data.message || "İşlem sırasında bir hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center space-x-3">
        <Upload className="w-8 h-8 text-sky-400" />
        <h1 className="text-3xl font-bold text-white">Toplu Firma Aktar</h1>
      </div>

      <p className="text-slate-400">
        JSON formatındaki firma verilerini aşağıdaki alana yapıştırarak sisteme toplu yükleme yapabilirsiniz. 
        Sistem telefon numarasına göre kontrol yapacak ve mevcut kayıtları koruyacaktır.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          JSON Verisi
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"0532...": {"Firma_Adi": "...", "Telefon": "...", "Il": "...", "Hizmet_Bolgeleri": ["...", "..."]}, ...}'
          className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-sky-300 outline-none focus:border-sky-500 transition-all resize-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading || !jsonInput.trim()}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? "İşleniyor..." : "Verileri İçe Aktar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <XCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      {results && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-fade-in shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            İşlem Özeti
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
              <span className="block text-emerald-500 font-bold text-2xl">{results.added}</span>
              <span className="text-emerald-400/70 text-sm">Yeni Eklenen Firma</span>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl">
              <span className="block text-sky-400 font-bold text-2xl">{results.skipped}</span>
              <span className="text-sky-400/70 text-sm">Atlanan (Zaten Kayıtlı)</span>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div>
              <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Hatalar ve Uyarılar ({results.errors.length})
              </h3>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 max-h-60 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {results.errors.map((err: string, i: number) => (
                  <div key={i} className="text-xs text-slate-400 flex items-start gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-red-500 select-none">•</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
