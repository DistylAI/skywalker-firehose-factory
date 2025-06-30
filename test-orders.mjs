import { runAgentWithContext } from './tests/helpers/jsonEvalRunner.js';

async function testOrders() {
  try {
    const context = { scenario: 'default', auth_level: '1' };
    const response = await runAgentWithContext(context, 'Show me my orders');
    console.log('=== ACTUAL AGENT RESPONSE ===');
    console.log(response);
    console.log('=== END RESPONSE ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrders();