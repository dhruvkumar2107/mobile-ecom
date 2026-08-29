import { route, ok, body } from '@/lib/api';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

const CreateOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(['cod', 'card', 'upi', 'netbanking', 'wallet']),
  couponCode: z.string().optional(),
});

export const POST = route(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const input = await body(req, CreateOrderSchema);

  // Get user's cart
  const cart = await db.cart.findFirst({
    where: {
      userId: user.id,
      status: 'active',
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { brand: true },
              },
            },
          },
          protectionPlan: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return new Response(JSON.stringify({ error: 'Cart is empty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify address belongs to user
  const address = await db.address.findFirst({
    where: { id: input.addressId, userId: user.id, deletedAt: null },
  });

  if (!address) {
    return new Response(JSON.stringify({ error: 'Invalid address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate totals
  let subtotalPaise = 0;
  let taxablePaise = 0;
  let taxPaise = 0;
  let protectionPaise = 0;
  let discountPaise = 0;

  const orderItems: any[] = [];

  for (const item of cart.items) {
    const variant = item.variant;
    const product = variant.product;
    
    const unitPricePaise = variant.pricePaise;
    const mrpPaise = variant.mrpPaise;
    const quantity = item.quantity;
    const itemDiscountPaise = (mrpPaise - unitPricePaise) * quantity;
    
    const gstRate = product.gstRate;
    const itemTaxablePaise = Math.round((unitPricePaise * quantity * 100) / (100 + gstRate));
    const itemTaxPaise = (unitPricePaise * quantity) - itemTaxablePaise;

    subtotalPaise += unitPricePaise * quantity;
    taxablePaise += itemTaxablePaise;
    taxPaise += itemTaxPaise;
    discountPaise += itemDiscountPaise;

    let protectionName = null;
    let itemProtectionPaise = 0;

    if (item.protectionPlan) {
      protectionName = item.protectionPlan.name;
      itemProtectionPaise = item.protectionPlan.priceType === 'percent'
        ? Math.round(unitPricePaise * item.protectionPlan.priceValue / 100)
        : item.protectionPlan.priceValue;
      protectionPaise += itemProtectionPaise;
    }

    orderItems.push({
      variantId: variant.id,
      productName: product.name,
      brandName: product.brand.name,
      variantLabel: `${variant.colorName} / ${variant.ramGb}GB / ${variant.storageGb}GB`,
      sku: variant.sku,
      imageGradient: product.heroGradient,
      quantity,
      mrpPaise,
      unitPricePaise,
      discountPaise: itemDiscountPaise,
      hsnCode: product.hsnCode,
      gstRate,
      taxablePaise: itemTaxablePaise,
      taxPaise: itemTaxPaise,
      lineTotalPaise: unitPricePaise * quantity,
      protectionPlanId: item.protectionPlanId,
      protectionName,
      protectionPaise: itemProtectionPaise,
      warrantyMonths: product.warrantyMonths,
      isAccessory: item.isAccessory,
    });
  }

  // Shipping
  const shippingPaise = subtotalPaise >= 4999900 ? 0 : 5900;
  
  // COD fee
  const codFeePaise = input.paymentMethod === 'cod' ? 5000 : 0;

  const totalPaise = subtotalPaise + protectionPaise + shippingPaise + codFeePaise;

  // Create order
  const orderNo = `VO${Date.now()}${nanoid(6).toUpperCase()}`;

  const order = await db.order.create({
    data: {
      orderNo,
      userId: user.id,
      status: 'pending',
      paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'pending',
      fulfilmentType: 'standard',
      addressId: address.id,
      addressSnapshot: JSON.stringify({
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      }),
      subtotalPaise,
      discountPaise,
      couponCode: input.couponCode,
      couponDiscountPaise: 0,
      protectionPaise,
      shippingPaise,
      codFeePaise,
      taxablePaise,
      taxPaise,
      totalPaise,
      amountPaidPaise: 0,
      amountDuePaise: totalPaise,
      paymentMethod: input.paymentMethod,
      placedAt: new Date(),
      items: {
        create: orderItems,
      },
      events: {
        create: {
          status: 'pending',
          note: 'Order placed',
          actorType: 'customer',
        },
      },
    },
    include: {
      items: true,
    },
  });

  // Clear cart
  await db.cart.update({
    where: { id: cart.id },
    data: { status: 'converted' },
  });

  await db.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  // Update stock (simplified - in production you'd use transactions)
  for (const item of cart.items) {
    await db.inventoryStock.updateMany({
      where: {
        variantId: item.variantId,
        quantity: { gte: item.quantity + 10 }, // account for reserved
      },
      data: {
        quantity: { decrement: item.quantity },
        reserved: { increment: item.quantity },
      },
    });
  }

  return ok({
    id: order.id,
    orderNo: order.orderNo,
    totalPaise: order.totalPaise,
  });
});
