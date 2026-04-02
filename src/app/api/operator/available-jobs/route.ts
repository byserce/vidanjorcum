import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const operator = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        serviceCity: true,
        serviceDistricts: true,
        serviceNeighborhoods: true,
      },
    });

    if (!operator || !operator.serviceCity) {
      return NextResponse.json([]);
    }

    const serviceDistricts = operator.serviceDistricts ? JSON.parse(operator.serviceDistricts) : [];
    const serviceNeighborhoods = operator.serviceNeighborhoods ? JSON.parse(operator.serviceNeighborhoods) : [];

    // Pending işleri çek
    const jobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
        city: operator.serviceCity,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          }
        }
      }
    });

    // Filtreleme (İlçe ve Mahalle bazlı)
    // Eğer operatör "Tümü" seçtiyse her şeyi görür
    const filteredJobs = jobs.filter(job => {
      const districtMatch = serviceDistricts.includes("Tümü") || serviceDistricts.includes(job.district);
      const neighborhoodMatch = serviceNeighborhoods.includes("Tümü") || serviceNeighborhoods.includes(job.neighborhood);
      
      return districtMatch && neighborhoodMatch;
    });

    return NextResponse.json(filteredJobs);
  } catch (error) {
    console.error("Available jobs fetch error:", error);
    return NextResponse.json({ message: "İşler getirilemedi" }, { status: 500 });
  }
}
