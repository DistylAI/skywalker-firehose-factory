import React from 'react';

export interface Order {
  id: string;
  customer: string;
  item: string;
  quantity: number;
  status: string;
}

export const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const normalize = (s: string) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim();

  const statusClasses = {
    'shipped': 'bg-green-100 text-green-800',
    'delivered': 'bg-green-200 text-green-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'returned': 'bg-orange-100 text-orange-800',
    'in transit': 'bg-blue-100 text-blue-800',
  } as Record<string, string>;

  const badgeClasses = statusClasses[normalize(order.status)] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="border border-border rounded-lg p-4 bg-card w-full shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-foreground">Order #{order.id}</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${badgeClasses}`}
        >
          {order.status}
        </span>
      </div>
      {order.customer && (
        <p className="text-sm text-muted-foreground mb-1">{order.customer}</p>
      )}
      <p className="text-sm">
        {order.item} &times; {order.quantity}
      </p>
    </div>
  );
}; 