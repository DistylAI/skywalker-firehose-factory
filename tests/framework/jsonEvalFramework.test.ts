import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { loadAllJsonEvals, runAllJsonEvals } from '../helpers/jsonEvalRunner';

// Directory containing JSON evaluation definition files
const EVAL_DIR = join(__dirname, '..', 'evals');

describe('JSON Evaluation Framework', () => {
  it('should load all JSON evaluation definitions without errors', () => {
    const evals = loadAllJsonEvals(EVAL_DIR);
    expect(evals.length).toBeGreaterThan(0);

    // Ensure each eval definition contains required fields
    for (const evalDef of evals) {
      expect(evalDef.name).toBeDefined();
      expect(evalDef.input).toBeDefined();
      expect(evalDef.assertions).toBeDefined();
      expect(evalDef.assertions.length).toBeGreaterThan(0);
    }
  });

  it('should successfully execute every JSON evaluation', async () => {
    const results = await runAllJsonEvals(EVAL_DIR);
    expect(results.length).toBeGreaterThan(0);

    const failedEvals = results.filter((r) => !r.passed);
    if (failedEvals.length) {
      console.log('\nFailed evaluations:');
      for (const failed of failedEvals) {
        console.log(`- ${failed.name}: ${failed.error || 'Assertion failures'}`);
      }
    }

    // All evals must pass for this test suite to succeed
    expect(failedEvals.length).toBe(0);
  }, 120000);
}); 