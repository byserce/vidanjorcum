import HomeClient from "@/components/HomeClient";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Operatörleri direkt kendi panellerine yönlendir
  if (session && (session.user as any).role === "OPERATOR") {
    redirect("/operator");
  }

  // DB'den bekleyen işlerin sayısını dinamik olarak çek
  const pendingJobsCount = await prisma.job.count({
    where: {
      status: "PENDING"
    }
  });

  return <HomeClient pendingJobsCount={pendingJobsCount} />;
}
