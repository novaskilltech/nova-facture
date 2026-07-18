import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("Khouribga111*", 10)

  await prisma.user.upsert({
    where: { email: "omrayanair@gmail.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "omrayanair@gmail.com",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
    },
  })

  await prisma.entity.upsert({
    where: { id: "entity-conciergerie" },
    update: {},
    create: {
      id: "entity-conciergerie",
      legalName: "LA CONCIERGERIE",
      commercialName: "Omrayanair / La Conciergerie",
      legalForm: "SASU",
      siren: "980508238",
      rcs: "Compiègne",
      capital: "500",
      address: "98 Avenue Claude Péroche",
      postalCode: "60180",
      city: "Nogent-sur-Oise",
      tvaMention: "TVA non applicable - article 293 B du CGI",
      bankName: "OKALI",
      bankIban: "FR76 3000 0000 0000 0000 0000 000",
      bankBic: "SFPEFRP2",
      bankHolder: "LA CONCIERGERIE",
      paymentMethods: "virement,especes",
    },
  })

  await prisma.entity.upsert({
    where: { id: "entity-horizon" },
    update: {},
    create: {
      id: "entity-horizon",
      legalName: "LAMKHANNET Salah Edine Ahmed",
      commercialName: "HORIZON SOLUTIONS",
      legalForm: "Entreprise individuelle",
      siren: "508592441",
      siret: "50859244100036",
      apeCode: "7990Z",
      address: "98 Avenue Claude Péroche",
      postalCode: "60180",
      city: "Nogent-sur-Oise",
      tvaMention: "TVA non applicable - article 293 B du CGI",
      bankName: "Revolut",
      bankIban: "FR76 3000 0000 0000 0000 0000 001",
      bankBic: "REVOFRP2",
      bankHolder: "SALAH EDINE AHMED LAMKHANNET",
      paymentMethods: "virement,especes,cb-stripe,cb-revolut",
    },
  })

  console.log("Seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
