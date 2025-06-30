import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { loadAllJsonEvals, runJsonEval } from '../helpers/jsonEvalRunner';

// Directory containing JSON evaluation definition files
const EVAL_DIR = join(__dirname, '..', 'evals');

describe('Individual JSON Evaluations', () => {
  const evals = loadAllJsonEvals(EVAL_DIR);

  evals.forEach((evalDef) => {
    it(`should pass: ${evalDef.name}`, async () => {
      const result = await runJsonEval(evalDef);

      if (!result.passed) {
        console.log(`\nFailed eval: ${evalDef.name}`);
        console.log(`Response: ${result.response}`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        for (const assertion of result.assertionResults) {
          if (!assertion.passed) {
            console.log(`Failed assertion (${assertion.type}): ${assertion.description}`);
            if (assertion.error) {
              console.log(`Reason: ${assertion.error}`);
            }
          }
        }
      }

      expect(result.passed).toBe(true);
    }, 30000);
  });
}); 