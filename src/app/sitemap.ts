import { MetadataRoute } from 'next';
import locationData from '@/data/location_data.json';

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vidanjorcum.com';

  // Ana sayfa
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Şehir ve İlçe sayfaları
  const cityPages: MetadataRoute.Sitemap = [];
  
  Object.keys(LOCATION_DATA).forEach((city) => {
    const slugCity = city.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
    
    // Şehir bazlı sayfa
    cityPages.push({
      url: `${baseUrl}/vidanjor/${slugCity}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });

    // İlçe bazlı sayfalar
    Object.keys(LOCATION_DATA[city]).forEach((district) => {
      const slugDistrict = district.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
      cityPages.push({
        url: `${baseUrl}/vidanjor/${slugCity}/${slugDistrict}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    });
  });

  return [...staticPages, ...cityPages];
}
