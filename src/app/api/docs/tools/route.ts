import { NextResponse } from 'next/server';
import { toolRegistry } from '@/tools';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

interface ToolMetadata {
  name: string;
  description: string;
  parameters: unknown;
  execution: string | null;
}

/* Convert snake_case tool name to CamelCase file name */
function toolNameToFileName(toolName: string): string {
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

      // Grab the execution function source as a string (if available)
      let execution: string | null = null;
      try {
        if (typeof (tool as any).execute === 'function') {
          execution = (tool as any).execute.toString();
        }

        // If execute couldn't be derived, fall back to reading source file
        if (!execution) {
          const fileName = toolNameToFileName(name);
          const filePath = path.join(toolsDir, fileName);
          const source = await fs.readFile(filePath, 'utf8');

          // Extract the anonymous execute function definition
          const match = source.match(/execute\s*:\s*(async\s*)?\([^)]*\)\s*=>\s*{[\s\S]*?}/);
          if (match) {
            execution = match[0].trim();
          }
        }
      } catch {
        execution = null;
      }

      return {
        name,
        description,
        parameters,
        execution,
      };
    }),
  );

  return NextResponse.json(toolMeta);
} 