/**
 * Turkish Phone Number Validation
 * Valid formats: 
 * - 05321234567
 * - 5321234567
 * - +905321234567
 * 
 * Domestic mobile numbers in Turkey are 10 digits starting with 5.
 */
export function validateTurkishPhone(phone: string): boolean {
  // Alan kodları, boşluklar vb. temizle
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  // Türkiye mobil numara formatı:
  // 5xx xxx xx xx (10 hane)
  // 05xx xxx xx xx (11 hane)
  // +905xx xxx xx xx (13 hane)
  
  if (cleaned.startsWith("+90")) {
    return cleaned.length === 13 && /^\+905\d{9}$/.test(cleaned);
  }
  if (cleaned.startsWith("0")) {
    return cleaned.length === 11 && /^05\d{9}$/.test(cleaned);
  }
  // Başında 0 veya +90 yoksa direkt 5 ile başlamalı ve 10 hane olmalı
  return cleaned.length === 10 && /^5\d{9}$/.test(cleaned);
}

/**
 * Normalize phone number to +905XXXXXXXXX format for Firebase/Backend
 */
export function normalizeTurkishPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = "+90" + cleaned.substring(1);
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+90" + cleaned;
  }
  
  return cleaned;
}

interface RateLimitData {
  count: number;
  firstAttemptTime: number;
}

/**
 * Check if the user is allowed to request an OTP (Max 3 per hour)
 */
export function checkOtpRateLimit(phone: string): { allowed: boolean; message?: string } {
  if (typeof window === "undefined") return { allowed: true };

  const normalizedPhone = normalizeTurkishPhone(phone);
  const key = `otp_limit_${normalizedPhone}`;
  const storedData = localStorage.getItem(key);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  if (!storedData) {
    return { allowed: true };
  }

  try {
    const data: RateLimitData = JSON.parse(storedData);
    
    // If more than 1 hour passed since the first attempt in this window, reset
    if (now - data.firstAttemptTime > ONE_HOUR) {
      return { allowed: true };
    }

    if (data.count >= 3) {
      const remainingTime = Math.ceil((ONE_HOUR - (now - data.firstAttemptTime)) / (60 * 1000));
      return { 
        allowed: false, 
        message: `Çok fazla deneme yaptınız. Lütfen ${remainingTime} dakika sonra tekrar deneyin.` 
      };
    }

    return { allowed: true };
  } catch (e) {
    // If data is corrupted, allow and reset
    return { allowed: true };
  }
}

/**
 * Increment OTP attempt count for a phone number
 */
export function incrementOtpAttempts(phone: string): void {
  if (typeof window === "undefined") return;

  const normalizedPhone = normalizeTurkishPhone(phone);
  const key = `otp_limit_${normalizedPhone}`;
  const storedData = localStorage.getItem(key);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  if (!storedData) {
    const newData: RateLimitData = { count: 1, firstAttemptTime: now };
    localStorage.setItem(key, JSON.stringify(newData));
    return;
  }

  try {
    const data: RateLimitData = JSON.parse(storedData);
    
    if (now - data.firstAttemptTime > ONE_HOUR) {
      // Reset window
      const newData: RateLimitData = { count: 1, firstAttemptTime: now };
      localStorage.setItem(key, JSON.stringify(newData));
    } else {
      // Increment in current window
      const newData: RateLimitData = { ...data, count: data.count + 1 };
      localStorage.setItem(key, JSON.stringify(newData));
    }
  } catch (e) {
    const newData: RateLimitData = { count: 1, firstAttemptTime: now };
    localStorage.setItem(key, JSON.stringify(newData));
  }
}
