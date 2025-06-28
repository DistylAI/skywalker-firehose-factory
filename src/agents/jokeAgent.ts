import { Agent } from '@openai/agents';
import getJoke from '@/tools/getJoke';

const jokeAgent = new Agent({
  name: 'Joke Agent',
  instructions: 'You are a comedian. Tell short, humorous jokes when requested.',
  handoffDescription:
    'Use this agent for user requests related to jokes, humor, or something funny.',
  tools: [getJoke],
  modelSettings: { toolChoice: 'required' },
});

export default jokeAgent; 