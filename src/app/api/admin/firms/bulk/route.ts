import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    }

    const firmsData = await req.json();
    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Firmalar bazen obje içinde telefon numarası key olarak gelebilir (kullanıcı örneğindeki gibi)
    const firmsArray = Object.keys(firmsData).map(key => firmsData[key]);

    for (const firm of firmsArray) {
      const phone = String(firm.Telefon).replace(/\s/g, "");
      const name = firm.Firma_Adi;
      const city = firm.Il;
      const address = firm.Adres;
      const serviceDistricts = firm.Hizmet_Bolgeleri || [];

      try {
        // Telefon ile ara
        const existingByPhone = await prisma.user.findUnique({
          where: { phone: phone },
        });

        if (existingByPhone) {
          if (existingByPhone.name === name) {
            results.skipped++;
            continue;
          } else {
            results.errors.push(`${phone} numarası zaten "${existingByPhone.name}" firmasına ait. (İstenen: "${name}")`);
            continue;
          }
        }

        // Placeholder email oluştur (Email unique kısıtlaması için)
        const email = `${phone}@vidanjorcum.com`;
        const existingByEmail = await prisma.user.findUnique({
          where: { email: email },
        });

        if (existingByEmail) {
          results.errors.push(`${email} adresi zaten kullanımda.`);
          continue;
        }

        // Varsayılan şifre olarak telefon numarasını ata
        const hashedPassword = await bcrypt.hash(phone, 10);

        await prisma.user.create({
          data: {
            email: email,
            name: name,
            phone: phone,
            password: hashedPassword,
            role: "OPERATOR",
            isAvailable: true,
            serviceCity: city,
            serviceDistricts: JSON.stringify(serviceDistricts),
            // Adres bilgisi için şimdilik description alanını kullanalım 
            // Veya modele field eklememişsek null geçelim. 
            // Modele address eklemedik, o yüzden description'a yazabiliriz.
          },
        });

        results.added++;
      } catch (err: any) {
        results.errors.push(`${name} (${phone}) eklenirken hata: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: "İşlem tamamlandı",
      results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
