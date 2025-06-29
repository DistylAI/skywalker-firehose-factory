# Development Guidelines for Future Coding Agents

## Project Overview

This is an AI agent for customer services. Any changes to this repo should strictly follow Test-Driven Development (TDD) and evaluation-driven development patterns whenever possible. In addition, there should be a bias to have agents respond in natural language, and to have evals (tests) use llmj (llm-as-a-judge) to evaluate those answers, unless specific hard coded responses and deterministic checks are requested.

## Core Development Philosophy: TDD/Eval-Driven Development

**MANDATORY PROCESS for ALL code changes:**

1. **Verify Current State**: Always run `npm run evals` to ensure all existing tests pass before making any changes
2. **Write Failing Test**: Add a new test that asserts the behavior you want to implement
3. **Confirm Test Fails**: Run the test to ensure it actually fails (prevents false positives)
4. **Implement Solution**: Write minimal code to make the test pass
5. **Verify Success**: Run all tests to ensure your change works and doesn't break existing functionality
6. **Final Validation**: Run build and lint checks to ensure code quality

## Testing Framework

### Test Commands
```bash
# Run tests in watch mode (development)
npm run test

# Run all evaluations once (before commits)
npm run evals

# Build the application
npm run build

# Run linting
npm run lint
```

### Test Structure
- **Test files**: Located in `tests/` directory
- **Framework**: Vitest with Node.js environment
- **Config**: `vitest.config.ts` and `vitest.setup.ts`
- **Pattern**: Files named `*.test.ts`

## LLM Judge for Response Evaluation

**CRITICAL**: When testing natural language responses, use `llmJudge` instead of brittle regex assertions.

### LLM Judge Usage
```typescript
import { llmJudge } from './helpers/llmJudge';

// Instead of regex matching, use LLM evaluation
const evaluation = await llmJudge({
  response: actualResponse,
  requirements: 'The response should be helpful, polite, and in English. It should not contain any error messages.'
});

expect(evaluation.meets).toBe(true);
if (!evaluation.meets) {
  console.log('LLM Judge reasoning:', evaluation.reason);
}
```

### When to Use LLM Judge
- Testing AI agent responses for quality, tone, or content
- Verifying complex natural language requirements
- Evaluating contextual appropriateness
- Any test where regex would be fragile or insufficient

### When NOT to Use LLM Judge
- Simple string matching (exact values, IDs, etc.)
- Performance-critical tests (LLM calls add latency)
- Deterministic outputs that can be precisely matched

## Test Categories

### 1. Unit Tests
Test individual tools and components in isolation.

### 2. Integration Tests
Test how components work together, especially:
- Guardrails and their blocking behavior
- Tool interactions
- Context handling

### 3. End-to-End Tests
Test complete user workflows with realistic scenarios:
- Different authentication levels
- Various data scenarios (`default`, `single`, `multiple`, `cancelled`, `returned`, `intranit`)
- Error conditions and edge cases

## Testing Patterns

### Agent Testing Helper
```typescript
// Use the standardized agent runner for consistent testing
async function runAgentWithContext(context: any, prompt: string): Promise<string> {
  const history = [userMessage(prompt)];
  const agent = createAssistantAgent(context);
  
  const streamed = await run(agent, history, { 
    stream: true,
    context: context
  });
  
  let response = '';
  for await (const ev of streamed) {
    if (ev.type === 'raw_model_stream_event' && ev.data.type === 'output_text_delta') {
      response += ev.data.delta as string;
    }
  }
  
  return response.trim();
}
```

### Authentication Testing
Always test different auth levels:
- **Auth Level 0**: Should deny access to sensitive information
- **Auth Level 1**: Should provide full access

### Scenario-Based Testing
Use the existing scenario system for comprehensive coverage:
```typescript
const context = createContext('default'); // or 'single', 'multiple', etc.
```

## Test Writing Best Practices

### Descriptive Test Names
```typescript
describe('Feature Name', () => {
  describe('Expected Behavior Category', () => {
    it('should perform specific action under specific conditions', async () => {
      // Test implementation
    });
  });
});
```

### Test Structure
1. **Arrange**: Set up test data and context
2. **Act**: Execute the code being tested
3. **Assert**: Verify the results (prefer llmJudge for AI responses)

### Error Testing
Always test error conditions:
- Invalid inputs
- Missing authentication
- Edge cases (empty data, malformed requests)

## Pre-Commit Checklist

Before committing any changes:

1. ✅ `npm run evals` passes all tests
2. ✅ `npm run build` completes successfully
3. ✅ `npm run lint` passes without errors
4. ✅ All new functionality has corresponding tests
5. ✅ Tests use `llmJudge` for natural language assertions

## Development Workflow Example

```bash
# 1. Verify current state
npm run evals

# 2. Create failing test
# Write test in tests/ directory

# 3. Confirm test fails
npm run test -- path/to/your/test.ts

# 4. Implement feature
# Write minimal code to make test pass

# 5. Verify all tests pass
npm run evals

# 6. Final validation
npm run build && npm run lint
```

## Key Files and Directories

- `tests/` - All test files
- `tests/helpers/llmJudge.ts` - LLM-based response evaluation
- `vitest.config.ts` - Test configuration
- `vitest.setup.ts` - Test setup and mocking
- `package.json` - Available npm scripts

## Remember

- **NO CHANGES** without corresponding tests
- **USE LLM JUDGE** for AI response testing
- **VERIFY ALL TESTS PASS** before and after changes
- **FOLLOW TDD CYCLE**: Red → Green → Refactor
- **TEST AUTH LEVELS** and different scenarios
- **RUN BUILD AND LINT** before considering work complete

This disciplined approach ensures system reliability and prevents regressions as the AI system evolves.