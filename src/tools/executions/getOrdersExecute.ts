export default async function getOrdersExecute() {
  const orders = [
    {
      id: '1001',
      customer: 'Luke Skywalker',
      item: 'Lightsaber',
      quantity: 1,
      status: 'shipped',
    },
    {
      id: '1002',
      customer: 'Han Solo',
      item: 'Blaster',
      quantity: 2,
      status: 'processing',
    },
    {
      id: '1003',
      customer: 'Leia Organa',
      item: 'Droid',
      quantity: 1,
      status: 'delivered',
    },
  ];

  return { orders };
} 