import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { phone, newPassword } = await req.json();

    if (!phone || !newPassword) {
      return NextResponse.json(
        { message: "Telefon numarası ve yeni şifre gereklidir" },
        { status: 400 }
      );
    }

    // Telefon numarasını normalleştir (baştaki +90 veya 0 durumları için)
    // Kayıt sırasında nasıl kaydedildiyse öyle aramalıyız.
    // Frontend'den gelen 'phone' değerinin veritabanındakiyle eşleştiğinden emin olun.
    
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Bu telefon numarasına ait bir hesap bulunamadı" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: "Şifreniz başarıyla güncellendi" }, { status: 200 });
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);
    return NextResponse.json(
      { message: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
