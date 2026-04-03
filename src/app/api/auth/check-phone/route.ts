import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTurkishPhone } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { message: "Telefon numarası eksik" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeTurkishPhone(phone);

    // Veritabanında numaranın kayıtlı olup olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu telefon numarası zaten başka bir hesapla kayıtlı. Lütfen giriş yapın." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Phone Check Error:", err);
    return NextResponse.json(
      { message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
