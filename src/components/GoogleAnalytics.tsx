"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/firebase";
import { logEvent, isSupported } from "firebase/analytics";

export default function GoogleAnalytics() {
  useEffect(() => {
    const initAnalytics = async () => {
      const supported = await isSupported();
      if (supported && typeof window !== "undefined" && analytics) {
        // İlk sayfa görüntüleme olayını tetikleyebiliriz
        logEvent(analytics, "page_view", {
          page_location: window.location.href,
          page_path: window.location.pathname,
          page_title: document.title,
        });
      }
    };

    initAnalytics();
  }, []);

  return null; // Görünmez bir bileşendir
}
