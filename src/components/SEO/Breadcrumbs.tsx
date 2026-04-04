import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  item: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://vidanjorcum.com${item.item}`
    }))
  };

  return (
    <nav className="flex mb-8 overflow-x-auto pb-2 no-scrollbar" aria-label="Breadcrumb">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="inline-flex items-center space-x-1 md:space-x-3 whitespace-nowrap">
        <li className="inline-flex items-center">
          <Link href="/" className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors">
            <Home className="w-3 h-3 mr-2" />
            Ana Sayfa
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />
              <Link
                href={item.item}
                className={`ml-1 text-xs font-medium transition-colors ${
                  index === items.length - 1 
                    ? "text-sky-400 font-bold pointer-events-none" 
                    : "text-slate-400 hover:text-sky-400"
                }`}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
