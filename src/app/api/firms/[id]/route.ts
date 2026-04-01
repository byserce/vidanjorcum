import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const firm = await prisma.user.findUnique({
      where: { id: params.id, role: "OPERATOR", isSuspended: false },
      select: {
        id: true,
        name: true,
        phone: true,
        image: true,
        serviceCity: true,
        serviceDistricts: true,
        serviceNeighborhoods: true,
        businessImages: {
          select: { id: true, url: true }
        },
        reviewsReceived: {
          where: {
            customer: { isSuspended: false }
          },
          include: {
            customer: { select: { name: true, image: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!firm) {
      return NextResponse.json({ message: "Firma bulunamadı" }, { status: 404 });
    }

    // Puan ortalamasını hesapla
    const totalReviews = firm.reviewsReceived.length;
    const avgRating = totalReviews > 0 
      ? firm.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
      : 0;

    return NextResponse.json({
      ...firm,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: totalReviews
    });
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
