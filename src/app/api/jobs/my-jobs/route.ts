import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const myJobs = await prisma.job.findMany({
      where: {
        customerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        operator: {
          select: {
            name: true,
            phone: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(myJobs);
  } catch (error) {
    console.error("My jobs fetch error:", error);
    return NextResponse.json({ message: "İlanlarınız getirilemedi" }, { status: 500 });
  }
}
