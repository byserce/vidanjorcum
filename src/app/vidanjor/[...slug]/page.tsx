import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import locationData from '@/data/location_data.json';
import { AuthNavigation } from '@/components/AuthNavigation';
import HomeClient from '@/components/HomeClient';
import JsonLd from '@/components/SEO/JsonLd';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import FaqSection from '@/components/SEO/FaqSection';

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

interface Props {
  params: { slug: string[] };
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
        
        <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                {locationName} <span className="text-sky-500">Vidanjör ve Kanal Açma</span> Hizmetleri
            </h1>
            <div className="prose prose-invert max-w-none text-slate-400">
                <p className="text-lg leading-relaxed">
                   <strong>{locationName}</strong> bölgesinde profesyonel vidanjör hizmetleri arıyorsanız doğru yerdesiniz. 
                   Vidanjörcüm platformu olarak, {city} ilinde {district ? `${district} ilçesi dahil` : "tüm bölgelerde"} 
                   geniş araç parkuruna sahip operatörlerimizle tıkanıklık açma, logar temizleme ve foseptik çekimi gibi 
                   altyapı sorunlarınıza 7/24 hızlı çözümler sunuyoruz.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-sky-400 font-bold mb-3 flex items-center gap-2">
                           <span className="w-2 h-2 bg-sky-500 rounded-full" />
                           Neden Bizi Seçmelisiniz?
                        </h3>
                        <ul className="space-y-2 text-sm italic">
                            <li>• {locationName} Bölgesine En Yakın Operatörler</li>
                            <li>• 7/24 Kesintisiz Acil Müdahale</li>
                            <li>• Modern Ekipman ve Profesyonel Kadro</li>
                            <li>• Şeffaf ve Uygun Fiyat Garantisi</li>
                        </ul>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-sky-400 font-bold mb-3 flex items-center gap-2">
                           <span className="w-2 h-2 bg-sky-500 rounded-full" />
                           Verilen Hizmetler
                        </h3>
                        <ul className="space-y-2 text-sm italic">
                            <li>• Kanat ve Gider Açma işlemleri</li>
                            <li>• Foseptik ve Atık Çekimi</li>
                            <li>• Logar Bakımı ve Temizliği</li>
                            <li>• Fabrika ve Sanayi Tipi Atık Yönetimi</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

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
