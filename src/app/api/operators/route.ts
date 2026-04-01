import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const district = searchParams.get("district");

    let whereClause: any = { role: "OPERATOR", isAvailable: true, isSuspended: false }; // Sadece aktif (isAvailable) olanlar mı? Yoksa hepsi mi? Sistemdeki tüm operatörler mantıklı. Şimdilik isAvailable kısıtlamıyoruz.

    whereClause = { role: "OPERATOR", isSuspended: false };

    if (city) {
      whereClause.serviceCity = city;
    }

    if (district) {
      whereClause.OR = [
        { serviceDistricts: { contains: "\"Tümü\"" } },
        { serviceDistricts: { contains: `"${district}"` } },
      ];
    }

    const operators = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        image: true,
        serviceCity: true,
        serviceDistricts: true,
        reviewsReceived: {
          select: {
            rating: true
          }
        }
      },
    });

    const operatorsWithRating = operators.map(op => {
      const totalReviews = op.reviewsReceived.length;
      const avgRating = totalReviews > 0 
        ? op.reviewsReceived.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
        : 0;
      
      const { reviewsReceived, ...rest } = op;
      return { 
        ...rest, 
        avgRating: Math.round(avgRating * 10) / 10, 
        reviewCount: totalReviews 
      };
    });

    return NextResponse.json(operatorsWithRating);
  } catch (error) {
    return NextResponse.json({ message: "Operatörler getirilemedi" }, { status: 500 });
  }
}
