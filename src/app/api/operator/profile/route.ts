import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { 
        name: true,
        phone: true,
        vehiclePlate: true,
        image: true,
        serviceCity: true, 
        serviceDistricts: true, 
        serviceNeighborhoods: true,
        businessImages: {
          select: { id: true, url: true }
        }
      }
    });

    return NextResponse.json(user || {});
  } catch (error) {
    return NextResponse.json({ message: "Hata" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "OPERATOR") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const { serviceCity, serviceDistricts, serviceNeighborhoods } = await req.json();

    await prisma.user.update({
      where: { email: session.user.email as string },
      data: { 
        serviceCity, 
        serviceDistricts, 
        serviceNeighborhoods 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Hata" }, { status: 500 });
  }
}
