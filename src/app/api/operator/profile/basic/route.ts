import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const { name, phone, vehiclePlate, image } = await req.json();
    const userId = (session.user as any).id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        vehiclePlate: vehiclePlate || undefined,
        image: image || undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Profil güncellenemedi" }, { status: 500 });
  }
}
