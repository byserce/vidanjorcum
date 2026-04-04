import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import locationData from '@/data/location_data.json';
import { AuthNavigation } from '@/components/AuthNavigation';
import HomeClient from '@/components/HomeClient';
import JsonLd from '@/components/SEO/JsonLd';

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
    ? `${district} Vidanjör Hizmetleri - ${city} | Vidanjörcüm`
    : `${city} Vidanjör ve Kanal Açma Hizmetleri | Vidanjörcüm`;

  const description = district
    ? `${city} ili ${district} ilçesinde 7/24 acil vidanjör, kanal açma ve foseptik temizliği hizmeti veren en yakın ekipler burada.`
    : `${city} genelinde profesyonel vidanjör ve kanal açma operatörlerine anında ulaşın. Güvenilir ve hızlı çözüm.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://vidanjorcum.com/vidanjor/${slugs.join('/')}`,
    }
  };
}

export default async function LocationPage({ params }: Props) {
  const slugs = await params.slug;
  const match = findLocationMatch(slugs);

  if (!match) notFound();

  const { city, district } = match;

  // DB'den bekleyen işlerin sayısını dinamik olarak çek (Opsiyonel: lokasyon bazlı filtreleme de yapılabilir)
  const pendingJobsCount = await prisma.job.count({
    where: {
      status: "PENDING",
      city: city,
      ...(district && { district: district })
    }
  });

  return (
    <>
      <JsonLd 
        type="LocalBusiness" 
        data={{ 
          city, 
          district,
          name: `${district || city} Vidanjör Hizmetleri`,
        }} 
      />
      
      {/* 
         Burada HomeClient'ı kullanıyoruz ancak bir "initialRegion" prop'u ekleyerek 
         sayfanın o lokasyonla açılmasını sağlayacağız.
      */}
      <HomeClient 
        pendingJobsCount={pendingJobsCount} 
        initialRegion={{ city, district }} 
      />

      {/* SEO Content Section (Arka Plan için) */}
      <article className="sr-only">
        <h1>{district ? `${district} Vidanjör` : `${city} Vidanjör`}</h1>
        <p>
          {city} bölgesinde vidanjör kiralama, kanal açma ve logar temizliği hizmetleri. 
          {district && `${district} ilçesine özel hızlı servis imkanı.`}
        </p>
      </article>
    </>
  );
}
