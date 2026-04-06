import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { prisma } from '@/lib/prisma';
import locationData from '@/data/location_data.json';
import { AuthNavigation } from '@/components/AuthNavigation';
import HomeClient from '@/components/HomeClient';
import JsonLd from '@/components/SEO/JsonLd';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import FaqSection from '@/components/SEO/FaqSection';
import LocationNav from '@/components/SEO/LocationNav';
import { Truck, Zap, Info, Clock, CheckCircle, Search, MessageCircle } from 'lucide-react';

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

interface Props {
  params: { slug: string[] };
}

// Revalidate every 1 hour to keep jobs count fresh
export const revalidate = 3600;

// generateStaticParams: Pre-render all 1000+ location combinations for SEO
export async function generateStaticParams() {
  const params: { slug: string[] }[] = [];
  
  Object.keys(LOCATION_DATA).forEach((city) => {
    const slugCity = city.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
    
    // Add City only param: /vidanjor/istanbul
    params.push({ slug: [slugCity] });
    
    // Add City + District params: /vidanjor/istanbul/besiktas
    Object.keys(LOCATION_DATA[city]).forEach((district) => {
      const slugDistrict = district.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
      params.push({ slug: [slugCity, slugDistrict] });
    });
  });
  
  return params;
}

// Bulunan şehri/ilçeyi normalleştirerek bulma fonksiyonu
function findLocationMatch(slugs: string[]) {
  const [citySlug, districtSlug] = slugs;
  
  const cities = Object.keys(LOCATION_DATA);
  const city = cities.find(c => 
    c.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-') === citySlug
  );

  if (!city) return null;

  if (!districtSlug) {
    return { city, district: undefined };
  }

  const districts = Object.keys(LOCATION_DATA[city]);
  const district = districts.find(d => 
    d.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-') === districtSlug
  );

  if (!district) return { city, district: undefined };

  return { city, district };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugs = await params.slug;
  const match = findLocationMatch(slugs);

  if (!match) return { title: "Sayfa Bulunamadı" };

  const { city, district } = match;
  const title = district 
    ? `7/24 Acil ${district} Vidanjör Hizmetleri - En Uygun Fiyatlar | Vidanjörcüm`
    : `${city} Vidanjör ve Kanal Açma Hizmetleri - 7/24 Acil Servis | Vidanjörcüm`;

  const description = district
    ? `${city} ${district} bölgesinde 7/24 acil vidanjör, kanal açma, logar temizleme ve foseptik çekimi hizmetleri için en yakın operatörlere anında ulaşın. Profesyonel ve hızlı çözüm.`
    : `${city} genelinde profesyonel vidanjör kiralama, kanal açma ve altyapı temizliği hizmetleri. Güvenilir ekipler ve uygun fiyatlı vidanjör hizmeti için tıklayın.`;

  return {
    title,
    description,
    keywords: [
      `${city} vidanjör`,
      `${district || city} kanal açma`,
      `acil vidanjör ${district || city}`,
      `foseptik çekimi ${city}`,
      "vidanjör fiyatları",
      "vidanjör kiralama"
    ],
    openGraph: {
      title,
      description,
      url: `https://vidanjorcum.com/vidanjor/${slugs.join('/')}`,
    },
    alternates: {
       canonical: `https://vidanjorcum.com/vidanjor/${slugs.join('/')}`
    }
  };
}

export default async function LocationPage({ params }: Props) {
  const slugs = await params.slug;
  const match = findLocationMatch(slugs);

  if (!match) notFound();

  const { city, district } = match;

  // DB'den bekleyen işlerin sayısını dinamik olarak çek
  const pendingJobsCount = await prisma.job.count({
    where: {
      status: "PENDING",
      city: city,
      ...(district && { district: district })
    }
  });

  const locationName = district || city;
  
  const breadcrumbItems = district 
    ? [{ name: city, item: `/vidanjor/${slugs[0]}` }, { name: district, item: `/vidanjor/${slugs[0]}/${slugs[1]}` }]
    : [{ name: city, item: `/vidanjor/${slugs[0]}` }];

  const faqs = [
    {
      question: `${locationName} vidanjör hizmeti ne kadar sürer?`,
      answer: `Ekiplerimiz ${locationName} bölgesinde genellikle 30-60 dakika içerisinde adresinize ulaşmaktadır. Talebinizin aciliyetine ve trafik durumuna göre en yakın müsait operatör size yönlendirilir.`
    },
    {
      question: `${locationName} vidanjör kiralama fiyatları nedir?`,
      answer: `Fiyatlar yapılacak işlemin türüne (foseptik çekimi, kanal açma, logar temizliği) ve mesafe durumuna göre değişiklik gösterir. En güncel ve uygun fiyat teklifleri için operatörlerimizle doğrudan iletişime geçebilirsiniz.`
    },
    {
      question: `Hangi saatlerde hizmet veriyorsunuz?`,
      answer: `${locationName} genelinde 7 gün 24 saat kesintisiz vidanjör ve kanal açma hizmeti sunuyoruz. Acil durumlarda gece veya gündüz fark etmeksizin bize ulaşabilirsiniz.`
    }
  ];

  return (
    <div className="bg-slate-950 min-h-screen">
      <JsonLd 
        type="LocalBusiness" 
        data={{ 
          city, 
          district,
          name: `${locationName} Vidanjör Hizmetleri - Vidanjörcüm`,
        }} 
      />
      
      <div className="container mx-auto px-4 pt-24 max-w-6xl">
        <Breadcrumbs items={breadcrumbItems} />
        
        <div className="mb-20">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.1]"
            >
                {locationName} <br />
                <span className="text-transparent bg-clip-text premium-gradient uppercase">Vidanjör & Kanal Açma</span>
            </motion.h1>

            <div className="prose prose-invert max-w-none text-slate-400 space-y-12">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
                    <p className="text-lg md:text-xl leading-relaxed font-medium relative z-10">
                       <strong>{locationName}</strong> bölgesinde profesyonel vidanjör hizmetleri arıyorsanız, Vidanjörcüm platformu size en yakın ve en uygun fiyatlı çözümleri sunar. 
                       {city} ilinin tüm noktalarına hâkim tecrübeli operatörlerimizle; {district ? `${district} ilçesinde` : "tüm mahallelerde"} 
                       7/24 kesintisiz hizmet sağlıyoruz.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 my-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
                           <Zap className="w-6 h-6 text-sky-500" />
                           {locationName} Profesyonel Hizmetler
                        </h2>
                        <div className="space-y-4">
                            {[
                                { title: "Kanalizasyon Açma", desc: "Tıkanmış ana hatların robotik cihazlarla hızlıca açılması." },
                                { title: "Foseptik Temizliği", desc: "Yüksek emiş gücüne sahip araçlarla hijyenik tahliye." },
                                { title: "Logar Temizleme", desc: "Koku ve taşma yapan logarların basınçlı suyla temizliği." },
                                { title: "Pimaş & Gider Açma", desc: "Mutfak, banyo ve tuvalet giderlerine kırmadan müdahale." }
                            ].map((s, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-500/30 transition-all">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">{s.title}</h4>
                                        <p className="text-xs text-slate-500">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
                           <Info className="w-6 h-6 text-sky-500" />
                           {locationName} Vidanjör Fiyatları
                        </h2>
                        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
                           <p className="text-sm text-slate-400 leading-relaxed mb-6">
                             {locationName} vidanjör kiralama fiyatları, yapılacak işlemin niteliğine, kullanılacak vidanjör aracının büyüklüğüne ve çalışılacak süreye göre değişiklik göstermektedir.
                           </p>
                           <ul className="space-y-3">
                              <li className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                <span className="text-slate-500 font-bold tracking-tight uppercase">Kanal Açma Başlangıç</span>
                                <span className="text-white font-black">En Uygun Teklif</span>
                              </li>
                              <li className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                <span className="text-slate-500 font-bold tracking-tight uppercase">Foseptik Çekimi (Sefer)</span>
                                <span className="text-white font-black">Operatöre Sor</span>
                              </li>
                              <li className="flex justify-between items-center text-xs pb-2">
                                <span className="text-slate-500 font-bold tracking-tight uppercase">7/24 Acil Müdahale</span>
                                <span className="text-sky-400 font-black">Hemen Ara</span>
                              </li>
                           </ul>
                           <div className="mt-6 p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-[10px] text-sky-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                              Kesin fiyat teklifi için sisteme kayıtlı operatörleri doğrudan arayarak bilgi alabilirsiniz.
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {!district && (
           <div className="mb-24">
              <LocationNav currentCity={city} type="districts" />
           </div>
        )}

        <HomeClient 
          pendingJobsCount={pendingJobsCount} 
          initialRegion={{ city, district }} 
        />

        <FaqSection items={faqs} city={city} district={district} />
      </div>

      <footer className="mt-20 py-10 border-t border-slate-900 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
         Vidanjörcüm - {locationName} Yerel SEO Landing Page
      </footer>
    </div>
  );
}
