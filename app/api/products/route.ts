import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const take = Math.min(48, Math.max(1, Number(params.get("limit")) || 12));
  const category = params.get("category");

  const where = {
    isActive: true,
    name: { contains: query, mode: "insensitive" as const },
    ...(category ? { category: { slug: category } } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { images: true, category: true, brand: true },
      skip: (page - 1) * take,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / take) });
}
