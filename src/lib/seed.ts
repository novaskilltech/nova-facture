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

  // 1. La Conciergerie (Compte OKALI)
  await prisma.entity.upsert({
    where: { id: "entity-conciergerie" },
    update: {
      legalName: "LA CONCIERGERIE",
      commercialName: "Omrayanair / La Conciergerie (OKALI)",
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
      logoPath: "/conciergerie-logo.jpg",
      isActive: true,
    },
    create: {
      id: "entity-conciergerie",
      legalName: "LA CONCIERGERIE",
      commercialName: "Omrayanair / La Conciergerie (OKALI)",
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
      logoPath: "/conciergerie-logo.jpg",
      isActive: true,
    },
  })

  // 2. La Conciergerie (Compte Revolut Bank UAB)
  await prisma.entity.upsert({
    where: { id: "entity-conciergerie-revolut" },
    update: {
      legalName: "LA CONCIERGERIE",
      commercialName: "Omrayanair / La Conciergerie (Revolut)",
      legalForm: "SASU",
      siren: "980508238",
      rcs: "Compiègne",
      capital: "500",
      address: "98 Avenue Claude Péroche",
      postalCode: "60180",
      city: "Nogent-sur-Oise",
      tvaMention: "TVA non applicable - article 293 B du CGI",
      bankName: "Revolut Bank UAB",
      bankIban: "FR76 2823 3000 0101 1682 6546 184",
      bankBic: "REVOFRP2",
      bankHolder: "LA CONCIERGERIE",
      paymentMethods: "virement,especes,cb-revolut",
      logoPath: "/conciergerie-logo.jpg",
      isActive: true,
    },
    create: {
      id: "entity-conciergerie-revolut",
      legalName: "LA CONCIERGERIE",
      commercialName: "Omrayanair / La Conciergerie (Revolut)",
      legalForm: "SASU",
      siren: "980508238",
      rcs: "Compiègne",
      capital: "500",
      address: "98 Avenue Claude Péroche",
      postalCode: "60180",
      city: "Nogent-sur-Oise",
      tvaMention: "TVA non applicable - article 293 B du CGI",
      bankName: "Revolut Bank UAB",
      bankIban: "FR76 2823 3000 0101 1682 6546 184",
      bankBic: "REVOFRP2",
      bankHolder: "LA CONCIERGERIE",
      paymentMethods: "virement,especes,cb-revolut",
      logoPath: "/conciergerie-logo.jpg",
      isActive: true,
    },
  })

  // 3. Horizon Solutions
  await prisma.entity.upsert({
    where: { id: "entity-horizon" },
    update: {
      logoPath: "/horizon-solutions-logo.jpg",
    },
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
      logoPath: "/horizon-solutions-logo.jpg",
      isActive: true,
    },
  })

  // 4. Horizon Services
  await prisma.entity.upsert({
    where: { id: "entity-horizon-services" },
    update: {
      logoPath: "/horizon-services-logo.png",
    },
    create: {
      id: "entity-horizon-services",
      legalName: "LAMKHANNET Yasmine Habiba Saadia",
      commercialName: "HORIZON SERVICES",
      legalForm: "Entreprise individuelle",
      siren: "940974231",
      siret: "94097423100018",
      apeCode: "7990Z",
      address: "98 Avenue Claude Péroche",
      postalCode: "60180",
      city: "Nogent-sur-Oise",
      tvaMention: "TVA non applicable - article 293 B du CGI",
      bankName: "Revolut",
      bankIban: "FR76 2823 3000 0187 0446 1681 147",
      bankBic: "REVOFR2DXXX",
      bankHolder: "YASMINE LAMKHANNET",
      paymentMethods: "virement,especes,cb-stripe,cb-revolut",
      logoPath: "/horizon-services-logo.png",
      isActive: true,
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
