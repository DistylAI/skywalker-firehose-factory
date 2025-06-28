import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { toolRegistry } from '@/tools';

export const runtime = 'nodejs';

interface ToolMetadata {
  name: string;
  description: string;
  parameters: unknown;
  code: string | null;
}

/*
 * Convert a snake_case tool name (e.g. "get_cat_fact") to the corresponding
 * file name used in the codebase (e.g. "getCatFact.ts").
 */
function toolNameToFileName(toolName: string): string {
  // Split on underscores then capital-case every word after the first.
  const parts = toolName.split('_');
  const camel = parts
    .map((p, idx) => (idx === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
  return `${camel}.ts`;
}

export async function GET() {
  const toolsDir = path.join(process.cwd(), 'src', 'tools');

  const toolMeta: ToolMetadata[] = await Promise.all(
    Object.values(toolRegistry).map(async (tool): Promise<ToolMetadata> => {
      const { name, description, parameters } = tool as any;

      // Try to read the source file containing the tool implementation.
      let code: string | null = null;
      try {
        const fileName = toolNameToFileName(name);
        const filePath = path.join(toolsDir, fileName);
        code = await fs.readFile(filePath, 'utf8');
      } catch {
        // Silently ignore if we cannot read the file.
        code = null;
      }

      return {
        name,
        description,
        parameters,
        code,
      };
    }),
  );

  return NextResponse.json(toolMeta);
} 