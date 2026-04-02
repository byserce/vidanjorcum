import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin2@vidanjorcum.com";
  const password = "vidanjorcum123!";
  const name = "Yönetici 2";

  console.log(`Checking if user ${email} exists...`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("User already exists. Updating password and role...");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: "ADMIN",
        name: name,
      },
    });
    console.log("User updated successfully.");
  } else {
    console.log("Creating new admin user...");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        name: name,
      },
    });
    console.log("New admin user created successfully.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
