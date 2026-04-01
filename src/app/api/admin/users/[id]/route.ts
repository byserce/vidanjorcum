import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { role, name, phone, vehiclePlate, isSuspended } = body;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        role,
        name,
        phone,
        vehiclePlate,
        isSuspended: isSuspended !== undefined ? isSuspended : undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json({ message: "Güncellemde hata oluştu" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Kullanıcı silindi" });
  } catch (err) {
    return NextResponse.json({ message: "Silmede hata oluştu" }, { status: 500 });
  }
}
