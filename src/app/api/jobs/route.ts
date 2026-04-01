import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const district = searchParams.get("district");

    const isOperatorOrAdmin = session && ((session.user as any).role === "OPERATOR" || (session.user as any).role === "ADMIN");

    const whereClause: any = {};
    if (city) whereClause.city = city;
    if (district) whereClause.district = district;

    const jobs = await prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!session) {
      // Giriş yapmamış kullanıcılara sadece id yolluyoruz ki frontend'de array.length sayısını alabilsin
      // İlan hakkında en ufak bir detay bile gönderilmiyor.
      const secureJobs = jobs.map((job: any) => ({ id: job.id }));
      return NextResponse.json(secureJobs);
    }

    const processedJobs = jobs.map((job: any) => {
      // Eğer operatör veya admin değilse gizlilik kuralları uygula
      if (!isOperatorOrAdmin && (session?.user as any)?.id !== job.customerId) {
        return {
          ...job,
          // Koordinatları bulanıklaştır (yaklaşık 500m-1km sapma)
          lat: job.lat + (Math.random() - 0.5) * 0.01,
          lng: job.lng + (Math.random() - 0.5) * 0.01,
          description: "Müşteri Gizliliği: Tam Adres Detayı sadece Operatörler görebilir.",
          customer: {
            id: job.customer.id,
            name: "Müşteri (Gizli)",
            phone: "Numara Gizli"
          }
        };
      }
      return job;
    });

    return NextResponse.json(processedJobs);
  } catch (error) {
    return NextResponse.json({ message: "İlanlar getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 403 });
    }

    let userRole = (session.user as any).role;
    let userId = (session.user as any).id;

    // Eğer tarayıcıda NextAuth konfigürasyonundan önce oluşturulmuş eski bir cookie varsa,
    // session içinde role veya id bulunmayabilir. Bu durumda veritabanından çekiyoruz.
    if (!userRole || !userId) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (!dbUser) {
        return NextResponse.json({ message: "Kullanıcı kaydı bulunamadı" }, { status: 403 });
      }
      userRole = dbUser.role;
      userId = dbUser.id;
    }

    if (userRole === "OPERATOR") {
      return NextResponse.json({ message: "Sadece Müşteriler ilan açabilir. Operatör hesabı ile ilan verilemez." }, { status: 403 });
    }

    const body = await req.json();
    const { serviceType, city, district, neighborhood, lat, lng, description, isEmergency } = body;

    const newJob = await prisma.job.create({
      data: {
        serviceType,
        city,
        district,
        neighborhood,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description,
        isEmergency: Boolean(isEmergency),
        customerId: userId,
      }
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "İlan oluşturulamadı" }, { status: 500 });
  }
}
