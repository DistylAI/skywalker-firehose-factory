interface ExecutionContext {
  context?: {
    scenario?: string;
  };
}

export default async function getOrdersExecute(
  _params?: Record<string, unknown>,
  executionContext?: ExecutionContext
) {
  const scenario: string =
    executionContext?.context?.scenario ?? 'default';

  let orders;

  switch (scenario) {
    case 'cancelled':
      orders = [
        {
          id: '2001',
          customer: 'Anakin Skywalker',
          item: 'Podracer Engine',
          quantity: 1,
          status: 'cancelled',
        },
        {
          id: '2002',
          customer: 'Mace Windu',
          item: 'Purple Lightsaber Crystal',
          quantity: 1,
          status: 'cancelled',
        },
      ];
      break;

    case 'multiple':
      orders = [
        {
          id: '3001',
          customer: 'Han Solo',
          item: 'Blaster',
          quantity: 3,
          status: 'processing',
        },
        {
          id: '3002',
          customer: 'Chewbacca',
          item: 'Bowcaster Bolts',
          quantity: 5,
          status: 'processing',
        },
      ];
      break;

    case 'single':
      orders = [
        {
          id: '4001',
          customer: 'Leia Organa',
          item: 'Droid',
          quantity: 1,
          status: 'shipped',
        },
      ];
      break;

    case 'intransit':
      orders = [
        {
          id: '5001',
          customer: 'Obi-Wan Kenobi',
          item: 'Jedi Robes',
          quantity: 2,
          status: 'in_transit',
        },
        {
          id: '5002',
          customer: 'Plo Koon',
          item: 'Breathing Mask',
          quantity: 1,
          status: 'in_transit',
        },
      ];
      break;

    case 'returned':
      orders = [
        {
          id: '6001',
          customer: 'Jar Jar Binks',
          item: 'Gungan Energy Shield',
          quantity: 1,
          status: 'returned',
        },
      ];
      break;

    default:
      orders = [
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
  }

  return { orders };
} 