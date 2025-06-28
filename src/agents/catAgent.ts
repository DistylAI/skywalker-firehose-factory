import { Agent } from '@openai/agents';
import getCatFact from '@/tools/getCatFact';

const catAgent = new Agent({
  name: 'Cat Facts Agent',
  instructions: 'You are an expert on cat facts. Provide interesting cat facts when asked.',
  handoffDescription:
    'Use this agent when the user asks for information or fun facts about cats.',
  tools: [getCatFact],
  modelSettings: { toolChoice: 'required' },
});

export default catAgent; 