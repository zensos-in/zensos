import { AppIcon } from "../ui/AppIcon";
import type { Order } from "../../types";
import {
  formatOrderAddressBlock,
  getOrderBillingAddress,
  getOrderShippingAddress,
  getOrderShippingContact,
  isOrderShippingSameAsBilling,
} from "../../utils/orderAddresses";

type OrderAddressCardsProps = {
  order: Order;
  compact?: boolean;
};

function AddressCard({
  title,
  name,
  phone,
  address,
  compact,
}: {
  title: string;
  name?: string;
  phone?: string;
  address: string;
  compact?: boolean;
}) {
  if (!address && !name && !phone) return null;

  return (
    <div className={`rounded-xl bg-slate-50 dark:bg-slate-900/80 ${compact ? "p-2.5" : "p-3"}`}>
      <p
        className={`inline-flex items-center gap-2 font-bold uppercase tracking-wider text-slate-400 mb-1.5 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400">
          <AppIcon name="location" className="text-[13px]" />
        </span>
        {title}
      </p>
      <p className={`whitespace-pre-line text-slate-700 dark:text-slate-300 ${compact ? "text-xs" : "text-sm"}`}>
        {formatOrderAddressBlock(address, name, phone)}
      </p>
    </div>
  );
}

export function OrderAddressCards({ order, compact = false }: OrderAddressCardsProps) {
  const billingAddress = getOrderBillingAddress(order);
  const shippingAddress = getOrderShippingAddress(order);
  const sameAsBilling = isOrderShippingSameAsBilling(order);
  const shippingContact = getOrderShippingContact(order);

  if (!billingAddress && !shippingAddress) return null;

  return (
    <div className={`space-y-2 ${compact ? "" : "space-y-3"}`}>
      <AddressCard
        title="Billing Address"
        name={order.customerName}
        phone={order.customerPhone}
        address={billingAddress}
        compact={compact}
      />
      {sameAsBilling ? (
        <p className={`text-slate-500 italic ${compact ? "text-xs px-1" : "text-sm px-1"}`}>
          Shipping address same as billing address
        </p>
      ) : (
        <AddressCard
          title="Shipping Address"
          name={shippingContact.name}
          phone={shippingContact.phone}
          address={shippingAddress}
          compact={compact}
        />
      )}
    </div>
  );
}
