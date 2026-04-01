import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name, role, phone, vehiclePlate, companyName } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Zorunlu alanları doldurunuz" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Telefon mükerrerlik kontrolü
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingPhone) {
        return NextResponse.json(
          { message: "Bu telefon numarası zaten kayıtlı" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalRole = email === "admin@vidanjorcum.com" ? "ADMIN" : (role === "OPERATOR" ? "OPERATOR" : "USER");

    // Operatörler için telefon numarası kontrolü
    if (finalRole === "OPERATOR") {
      if (!phone) {
        return NextResponse.json({ message: "Operatörler için telefon numarası zorunludur" }, { status: 400 });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: finalRole,
        phone: phone || null,
        phoneVerified: finalRole === "OPERATOR" ? new Date() : null,
        vehiclePlate: vehiclePlate || null,
        companyName: companyName || null,
      }
    });

    return NextResponse.json({ message: "Kayıt başarılı", user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { message: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
