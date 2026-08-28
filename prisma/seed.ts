import { DiscountType, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  ["Tuhafiye", "tuhafiye"], ["Dikiş Malzemeleri", "dikis-malzemeleri"],
  ["Telalar", "telalar"], ["İpler", "ipler"], ["Örgü İpleri", "orgu-ipleri"],
  ["Makrome", "makrome"], ["Zerber3D", "zerber3d"], ["Zerber Craft", "zerber-craft"],
  ["Boncuk", "boncuk"], ["Kumaş", "kumas"], ["Hobi Setleri", "hobi-setleri"],
  ["Aksesuar", "aksesuar"],
] as const;

const products = [
  "Pamuk Makrome İpi", "Bambu Örgü İpi", "Renkli Keçe Seti", "Ahşap Nakış Kasnağı",
  "Metal Fermuar", "Dantel Şerit", "Punch İğnesi", "Amigurumi Başlangıç Seti",
  "Çanta Sapı", "Saten Kurdele", "Boncuk Başlangıç Seti", "Kumaş Makası",
  "Dikiş İğnesi Seti", "Silikon Tabancası", "Renkli Düğme Seti", "Tela İnce Dokuma",
  "Tela Kalın Dokuma", "3D Mini Saksı", "3D Kalemlik", "3D Eklemli Ejderha",
  "Craft Hediye Kutusu", "Makrome Duvar Seti", "Jüt İp", "Kadife İp", "Penye İp",
  "Miyuki Boncuk", "Ahşap Boncuk", "Patchwork Kumaş", "Punch Kumaşı", "Örgü Tığ Seti",
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();

  const createdCategories = [];
  for (const [name, slug] of categories) {
    createdCategories.push(await prisma.category.create({ data: { name, slug } }));
  }

  const brand = await prisma.brand.create({
    data: { name: "Zerber Atelier", slug: "zerber-atelier" },
  });

  for (const [index, name] of products.entries()) {
    await prisma.product.create({
      data: {
        name,
        slug: `${name.toLocaleLowerCase("tr-TR").replaceAll(" ", "-")}-${index + 1}`,
        description: "Yaratıcı projelerinize renk katacak, özenle seçilmiş kaliteli hobi malzemesi.",
        shortDesc: "Özenle seçilmiş hobi malzemesi.",
        sku: `ZHB-${String(index + 1).padStart(4, "0")}`,
        price: 59.9 + index * 8,
        discountPrice: index % 3 === 0 ? 49.9 + index * 8 : null,
        stock: 8 + index,
        isNew: index >= 24,
        isBestSeller: index < 8,
        isFeatured: index < 12,
        categoryId: createdCategories[index % createdCategories.length].id,
        brandId: brand.id,
        images: {
          create: {
            url: `https://images.unsplash.com/photo-${index % 2 ? "1455390582262-044cdead277a" : "1607082349566-187342175e2f"}?w=700&q=80`,
            alt: name,
            isMain: true,
          },
        },
      },
    });
  }

  const now = new Date();
  await prisma.coupon.create({
    data: {
      code: "ZERBER10",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      startDate: now,
      endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    },
  });
  await prisma.banner.createMany({
    data: [
      { title: "Hayal Et. Tasarla. Üret.", subTitle: "Yaratıcılığını ortaya çıkar", image: "/hero.jpg", buttonText: "Keşfet", buttonUrl: "/urunler", order: 1 },
      { title: "Zerber3D Dünyası", subTitle: "Hayaller şimdi üç boyutlu", image: "/hero-3d.jpg", buttonText: "İncele", buttonUrl: "/urunler?category=zerber3d", order: 2 },
      { title: "Craft Koleksiyonu", subTitle: "Ellerinden çıkan her şey eşsiz", image: "/hero-craft.jpg", buttonText: "İncele", buttonUrl: "/urunler?category=zerber-craft", order: 3 },
    ],
  });

  await prisma.user.create({ data: { email: "admin@zerberhobi.com", name: "Zerber Admin", password: await bcrypt.hash("Admin123!", 12), role: Role.ADMIN } });
  await prisma.user.create({ data: { email: "musteri@zerberhobi.com", name: "Demo Müşteri", password: await bcrypt.hash("Musteri123!", 12) } });
}

main().finally(async () => prisma.$disconnect());
