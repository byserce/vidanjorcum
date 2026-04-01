import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all jobs for Admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        operator: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ message: "İlanlar getirilemedi" }, { status: 500 });
  }
}

// DELETE a job (Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID belirtilmedi" }, { status: 400 });
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "İlan silinemedi" }, { status: 500 });
  }
}

// UPDATE a job (Admin only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ message: "ID belirtilmedi" }, { status: 400 });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        serviceType: data.serviceType,
        description: data.description,
        status: data.status,
        city: data.city,
        district: data.district,
        neighborhood: data.neighborhood,
        isEmergency: data.isEmergency,
      }
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    return NextResponse.json({ message: "İlan güncellenemedi" }, { status: 500 });
  }
}
