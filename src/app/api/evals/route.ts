import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { loadAllJsonEvals, runAllJsonEvals } from '../../../../tests/helpers/jsonEvalRunner';

const EVAL_DIR = join(process.cwd(), 'tests', 'evals');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    switch (action) {
      case 'list':
        // Return all eval definitions
        const evals = loadAllJsonEvals(EVAL_DIR);
        const filteredEvals = tags.length > 0 
          ? evals.filter(e => e.tags?.some(tag => tags.includes(tag)))
          : evals;
        
        return NextResponse.json({
          success: true,
          data: filteredEvals,
          count: filteredEvals.length
        });

      case 'run':
        // Run all evaluations and return results
        const results = await runAllJsonEvals(EVAL_DIR);
        const filteredResults = tags.length > 0 
          ? results.filter(r => r.tags?.some(tag => tags.includes(tag)))
          : results;
        
        const summary = {
          total: filteredResults.length,
          passed: filteredResults.filter(r => r.passed).length,
          failed: filteredResults.filter(r => !r.passed).length
        };
        
        return NextResponse.json({
          success: true,
          data: filteredResults,
          summary
        });

      case 'tags':
        // Return all available tags
        const allEvals = loadAllJsonEvals(EVAL_DIR);
        const allTags = new Set<string>();
        allEvals.forEach(e => e.tags?.forEach(tag => allTags.add(tag)));
        
        return NextResponse.json({
          success: true,
          data: Array.from(allTags).sort()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: list, run, or tags'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in evals API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}