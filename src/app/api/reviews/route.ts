import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Belirli bir operatörün yorumlarını getir
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId");

    if (!operatorId) {
      return NextResponse.json({ message: "Operatör ID belirtilmedi" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { 
        operatorId: operatorId,
        customer: { isSuspended: false }
      },
      include: {
        customer: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ message: "Yorumlar getirilemedi" }, { status: 500 });
  }
}

// Yeni yorum ekle
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });
    }

    const { operatorId, jobId, rating, comment } = await req.json();

    if (!operatorId || !rating) {
      return NextResponse.json({ message: "Eksik bilgi" }, { status: 400 });
    }

    // Kullanıcının bu iş için zaten yorum yapıp yapmadığını kontrol et
    if (jobId) {
       const existing = await prisma.review.findUnique({
         where: { jobId: jobId }
       });
       if (existing) {
         return NextResponse.json({ message: "Bu iş için zaten yorum yapılmış" }, { status: 400 });
       }
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        customerId: (session.user as any).id,
        operatorId,
        jobId: jobId || null
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ message: "Yorum kaydedilemedi" }, { status: 500 });
  }
}
