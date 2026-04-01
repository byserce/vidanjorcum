import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ message: "URL gerekli" }, { status: 400 });
    }

    const newImage = await prisma.businessImage.create({
      data: {
        url,
        userId: (session.user as any).id
      }
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Resim eklenemedi" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID gerekli" }, { status: 400 });
    }

    const image = await prisma.businessImage.findUnique({
      where: { id }
    });

    if (!image || image.userId !== (session.user as any).id) {
      return NextResponse.json({ message: "Resim bulunamadı veya size ait değil" }, { status: 403 });
    }

    await prisma.businessImage.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Resim silindi" });
  } catch (error) {
    return NextResponse.json({ message: "Silme hatası" }, { status: 500 });
  }
}
