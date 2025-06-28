import { Agent } from '@openai/agents';
import catAgent from './catAgent';
import jokeAgent from './jokeAgent';

const assistantAgent = Agent.create({
  name: 'Assistant',
  instructions: `You are a helpful assistant. 
If the user requests:
  • A joke or something funny – immediately hand off to the "Joke Agent".
  • Cat facts or anything about cats – immediately hand off to the "Cat Facts Agent".
Do NOT answer these requests yourself; always hand off. For all other topics respond normally.`,
  handoffs: [catAgent, jokeAgent],
});

export default assistantAgent; 