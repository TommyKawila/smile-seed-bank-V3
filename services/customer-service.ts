import { prisma } from "@/lib/prisma";
import { prismaWhereOrderPaymentConfirmed } from "@/lib/order-paid";

export type CustomerProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  lineUserId: string | null;
  isWholesale: boolean;
  currentLoyaltyPoints: number;
  lifetimeSpend: number;
};

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFee: number;
  trackingNumber: string | null;
  shippingProvider: string | null;
  createdAt: string | null;
};

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const [customer, paidAgg] = await Promise.all([
    prisma.customers.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        address: true,
        line_user_id: true,
        is_wholesale: true,
      },
    }),
    prisma.orders.aggregate({
      where: {
        customer_id: userId,
        ...prismaWhereOrderPaymentConfirmed,
      },
      _sum: {
        total_amount: true,
        points_redeemed: true,
      },
    }),
  ]);

  if (!customer) return null;

  const lifetimeSpend = Number(paidAgg._sum.total_amount ?? 0);
  const earned = Math.floor(lifetimeSpend / 100);
  const redeemed = Number(paidAgg._sum.points_redeemed ?? 0);

  return {
    id: customer.id,
    fullName: customer.full_name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    lineUserId: customer.line_user_id,
    isWholesale: Boolean(customer.is_wholesale),
    currentLoyaltyPoints: Math.max(0, earned - redeemed),
    lifetimeSpend,
  };
}

export async function getCustomerOrders(userId: string): Promise<CustomerOrderSummary[]> {
  const orders = await prisma.orders.findMany({
    where: { customer_id: userId },
    orderBy: { created_at: "desc" },
    take: 20,
    select: {
      id: true,
      order_number: true,
      status: true,
      payment_status: true,
      total_amount: true,
      shipping_fee: true,
      tracking_number: true,
      shipping_provider: true,
      created_at: true,
    },
  });

  return orders.map((order) => ({
    id: String(order.id),
    orderNumber: order.order_number,
    status: order.status ?? "PENDING",
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
    shippingFee: Number(order.shipping_fee ?? 0),
    trackingNumber: order.tracking_number,
    shippingProvider: order.shipping_provider,
    createdAt: order.created_at?.toISOString() ?? null,
  }));
}
