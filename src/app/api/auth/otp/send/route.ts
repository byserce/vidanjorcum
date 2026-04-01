import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ message: "Telefon numarası gerekli" }, { status: 400 });
    }

    // 6 haneli rastgele kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika geçerli

    // Varsa eski kodları sil ve yenisini ekle
    await prisma.phoneVerification.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt }
    });

    // SMS MOCK: Konsola yazdır
    console.log(`\n--- [SMS MOCK] ---`);
    console.log(`Telefon: ${phone}`);
    console.log(`Doğrulama Kodu: ${code}`);
    console.log(`------------------\n`);

    return NextResponse.json({ 
      message: "Doğrulama kodu gönderildi",
      mockCode: process.env.NODE_ENV === "development" ? code : undefined // Dev ortamında kolaylık için
    });
  } catch (err) {
    console.error("OTP Send Error:", err);
    return NextResponse.json({ message: "Kod gönderilemedi" }, { status: 500 });
  }
}
