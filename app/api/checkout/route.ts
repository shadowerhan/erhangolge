import { NextResponse } from "next/server";
import { DiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { session } from "@/lib/auth";

export async function POST(request: Request) {
  const currentSession = await session();
  if (!currentSession?.id) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }
  const { addressId, couponCode } = await request.json();
  if (!addressId) return NextResponse.json({ error: "Adres gerekli" }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId: String(currentSession.id) },
      });
      if (!address) throw new Error("Geçersiz teslimat adresi");

      const cart = await tx.cart.findUniqueOrThrow({
        where: { userId: String(currentSession.id) },
        include: { items: { include: { product: true } } },
      });
      if (!cart.items.length) throw new Error("Sepet boş");

      for (const item of cart.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count !== 1) throw new Error(`${item.product.name} için yeterli stok yok`);
      }

      const subtotal = cart.items.reduce((sum, item) => {
        const unitPrice = item.product.discountPrice ?? item.product.price;
        return sum + Number(unitPrice) * item.quantity;
      }, 0);
      let discountAmount = 0;
      let couponId: string | undefined;
      if (couponCode) {
        const now = new Date();
        const coupon = await tx.coupon.findFirst({
          where: { code: String(couponCode).toUpperCase(), isActive: true, startDate: { lte: now }, endDate: { gte: now } },
        });
        if (!coupon || coupon.usedCount >= coupon.usageLimit || subtotal < Number(coupon.minBasketAmount)) {
          throw new Error("Kupon geçersiz veya kullanım süresi dolmuş");
        }
        discountAmount = coupon.discountType === DiscountType.PERCENTAGE
          ? subtotal * Number(coupon.discountValue) / 100
          : Number(coupon.discountValue);
        discountAmount = Math.min(discountAmount, subtotal);
        couponId = coupon.id;
      }

      const cargoAmount = subtotal - discountAmount >= 750 ? 0 : 59.9;
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: `ZHM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          userId: String(currentSession.id),
          addressId,
          totalAmount: subtotal - discountAmount + cargoAmount,
          discountAmount,
          cargoAmount,
          items: { create: cart.items.map((item) => ({ productId: item.productId, price: item.product.discountPrice ?? item.product.price, quantity: item.quantity })) },
        },
      });
      if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return createdOrder;
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sipariş oluşturulamadı" }, { status: 400 });
  }
}
