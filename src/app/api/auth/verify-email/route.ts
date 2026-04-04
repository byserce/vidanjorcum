import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "E-posta gereklidir" }, { status: 400 });
    }

    // Kullanıcıyı veritabanında güncelle
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ 
      message: "E-posta başarıyla doğrulandı",
      user: { id: user.id, email: user.email }
    });
  } catch (error: any) {
    console.error("Verification update error:", error);
    return NextResponse.json({ message: "Güncelleme sırasında bir hata oluştu" }, { status: 500 });
  }
}
