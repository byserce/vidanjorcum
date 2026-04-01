import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ message: "Telefon ve kod gerekli" }, { status: 400 });
    }

    const verification = await prisma.phoneVerification.findFirst({
      where: { phone, code }
    });

    if (!verification) {
      return NextResponse.json({ message: "Geçersiz kod" }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ message: "Kodun süresi dolmuş" }, { status: 400 });
    }

    // Doğrulama başarılı
    return NextResponse.json({ success: true, message: "Telefon doğrulandı" });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    return NextResponse.json({ message: "Doğrulama hatası" }, { status: 500 });
  }
}
