"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import locationData from "@/data/location_data.json";

const LOCATION_DATA = locationData as Record<string, Record<string, string[]>>;

interface LocationNavProps {
  currentCity?: string;
  type: "cities" | "districts";
}

export default function LocationNav({ currentCity, type }: LocationNavProps) {
  const cities = Object.keys(LOCATION_DATA);
  const majorCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Kocaeli", "Konya", "Mersin", "Gaziantep"];

  const renderCities = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {cities.map((city) => {
          const isMajor = majorCities.includes(city);
          const slug = city.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-");
          return (
            <Link
              key={city}
              href={`/vidanjor/${slug}`}
              className={`p-3 rounded-2xl glass-card text-xs md:text-sm font-bold text-center transition-all hover:border-sky-500/50 hover:text-sky-400 ${isMajor ? 'border-sky-500/30 bg-sky-500/5' : ''}`}
            >
              {city} Vidanjör
            </Link>
          );
        })}
      </div>
    );
  };

  const renderDistricts = () => {
    if (!currentCity || !LOCATION_DATA[currentCity]) return null;
    const districts = Object.keys(LOCATION_DATA[currentCity]);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-sky-500" />
          <h3 className="text-xl font-black text-white tracking-tighter uppercase">{currentCity} Hizmet Bölgeleri</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {districts.map((district) => {
            const citySlug = currentCity.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-");
            const districtSlug = district.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-");
            return (
              <Link
                key={district}
                href={`/vidanjor/${citySlug}/${districtSlug}`}
                className="p-3 rounded-xl border border-white/5 bg-white/5 text-[10px] md:text-[11px] font-black text-slate-400 text-center transition-all hover:bg-sky-500 hover:text-slate-950 hover:border-sky-500 uppercase tracking-tighter"
              >
                {district}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-12 mb-20 relative z-10">
      {type === "cities" ? renderCities() : renderDistricts()}
    </div>
  );
}
