import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { session } from "@/lib/auth";

export async function POST(request: Request) {
  const currentSession = await session();
  if (!currentSession?.id) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const { productId, quantity = 1 } = await request.json();
  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Geçersiz sepet isteği" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { stock: true },
  });
  if (!product || product.stock < quantity) {
    return NextResponse.json({ error: "Yeterli stok bulunmuyor" }, { status: 409 });
  }

  const cart = await prisma.cart.upsert({
    where: { userId: String(currentSession.id) },
    create: { userId: String(currentSession.id) },
    update: {},
  });
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (existing && existing.quantity + quantity > product.stock) {
    return NextResponse.json({ error: "Yeterli stok bulunmuyor" }, { status: 409 });
  }

  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: { increment: quantity } },
  });
  return NextResponse.json(item, { status: 201 });
}
