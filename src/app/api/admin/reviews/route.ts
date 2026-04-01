import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        operator: { select: { name: true } },
        job: { select: { id: true, serviceType: true, city: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ message: "Yorum listesi alınamadı" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID eksik" }, { status: 400 });
    }

    await prisma.review.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Yorum silinemedi" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id, rating, comment } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID eksik" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id: id },
      data: { rating, comment }
    });

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ message: "Yorum güncellenemedi" }, { status: 500 });
  }
}
