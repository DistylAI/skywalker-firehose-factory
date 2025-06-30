import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { runAllJsonEvals, loadAllJsonEvals, runJsonEval } from './helpers/jsonEvalRunner';

const EVAL_DIR = join(__dirname, 'evals');

describe('JSON-based Evaluations', () => {
  it('should load all JSON eval definitions without errors', () => {
    const evals = loadAllJsonEvals(EVAL_DIR);
    expect(evals.length).toBeGreaterThan(0);
    
    // Ensure all evals have required fields
    for (const evalDef of evals) {
      expect(evalDef.name).toBeDefined();
      expect(evalDef.input).toBeDefined();
      expect(evalDef.assertions).toBeDefined();
      expect(evalDef.assertions.length).toBeGreaterThan(0);
    }
  });

  it('should run all JSON evaluations successfully', async () => {
    const results = await runAllJsonEvals(EVAL_DIR);
    
    expect(results.length).toBeGreaterThan(0);
    
    // Log summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`\nJSON Eval Summary: ${passed}/${total} passed`);
    
    // Check if all evaluations passed
    const failedEvals = results.filter(r => !r.passed);
    if (failedEvals.length > 0) {
      console.log('\nFailed evaluations:');
      for (const failed of failedEvals) {
        console.log(`- ${failed.name}: ${failed.error || 'Assertion failures'}`);
      }
    }
    
    // For now, we expect all to pass - but you can change this based on your needs
    expect(failedEvals.length).toBe(0);
  }, 120000); // 2 minute timeout for all evals

  // Individual tests for each eval (optional - useful for debugging)
  describe('Individual JSON Evaluations', () => {
    const evals = loadAllJsonEvals(EVAL_DIR);
    
    evals.forEach(evalDef => {
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
});