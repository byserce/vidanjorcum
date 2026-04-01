import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { customer: { select: { id: true, name: true } } }
    });

    if (!job) {
      return NextResponse.json({ message: "İlan bulunamadı" }, { status: 404 });
    }

    // Sadece ilan sahibi veya admin görebilir
    if (job.customerId !== (session.user as any).id && (session.user as any).role !== "ADMIN") {
       return NextResponse.json({ message: "Bu işlemi yapmaya yetkiniz yok" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (err) {
    return NextResponse.json({ message: "İlan getirilemedi" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });

    const job = await prisma.job.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ message: "İlan bulunamadı" }, { status: 404 });

    // Sadece ilan sahibi güncelleyebilir
    if (job.customerId !== (session.user as any).id) {
       return NextResponse.json({ message: "Bu işlemi yapmaya yetkiniz yok" }, { status: 403 });
    }

    // Sadece PENDING durumdaki ilanlar düzenlenebilir
    if (job.status !== "PENDING") {
      return NextResponse.json({ message: "Kabul edilmiş veya tamamlanmış ilanlar düzenlenemez" }, { status: 400 });
    }

    const body = await req.json();
    const { serviceType, city, district, neighborhood, description, isEmergency, lat, lng } = body;

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        serviceType,
        city,
        district,
        neighborhood,
        description,
        isEmergency,
        lat: lat ? parseFloat(lat) : job.lat,
        lng: lng ? parseFloat(lng) : job.lng,
      }
    });

    return NextResponse.json(updatedJob);
  } catch (err) {
    return NextResponse.json({ message: "İlan güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });

    const job = await prisma.job.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ message: "İlan bulunamadı" }, { status: 404 });

    // Sadece ilan sahibi silebilir
    if (job.customerId !== (session.user as any).id) {
       return NextResponse.json({ message: "Bu işlemi yapmaya yetkiniz yok" }, { status: 403 });
    }

    // Sadece PENDING ilanlar silinebilir (veya admin ise her zaman)
    if (job.status !== "PENDING" && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Kabul edilmiş ilanlar silinemez" }, { status: 400 });
    }

    await prisma.job.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "İlan silindi" });
  } catch (err) {
    return NextResponse.json({ message: "İlan silinemedi" }, { status: 500 });
  }
}
