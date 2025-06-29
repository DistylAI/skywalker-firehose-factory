import { detectLanguageExecute } from '../tools/executions/detectLanguageExecute';
import {
  type InputGuardrail,
  type InputGuardrailFunctionArgs,
  type GuardrailFunctionOutput,
} from '@openai/agents';

// Accepted language codes
const ACCEPTED_LANGUAGES = ['en', 'es'];

export interface LanguageGuardrailResult {
  isAllowed: boolean;
  detectedLanguage: string;
  errorMessage?: string;
}

export async function languageGuardrail(userInput: string): Promise<LanguageGuardrailResult> {
  try {
    // Detect the language of the input
    const result = await detectLanguageExecute({ text: userInput });
    const detectedLanguage = result.languageCode;
    
    // If language detection failed or returned unknown, allow the message through
    if (detectedLanguage === 'unknown') {
      return {
        isAllowed: true,
        detectedLanguage: 'unknown'
      };
    }
    
    // Check if the detected language is in the accepted list
    const isAllowed = ACCEPTED_LANGUAGES.includes(detectedLanguage);
    
    return {
      isAllowed,
      detectedLanguage,
      errorMessage: isAllowed ? undefined : '[[ error unsupported language ]]'
    };
  } catch (error) {
    console.error('Error in language guardrail:', error);
    // If detection fails, allow the message through
    return {
      isAllowed: true,
      detectedLanguage: 'unknown'
    };
  }
}

// SDK-compatible input guardrail
export const sdkLanguageGuardrail: InputGuardrail = {
  name: 'language_guardrail',
  execute: async (args: InputGuardrailFunctionArgs): Promise<GuardrailFunctionOutput> => {
    const rawInput = args.input;
    let inputText: string;
    if (typeof rawInput === 'string') {
      inputText = rawInput;
    } else {
      const texts: string[] = [];
      for (const item of rawInput as any[]) {
        if (item.type === 'message' && item.role === 'user') {
          if (typeof item.content === 'string') {
            texts.push(item.content);
          } else if (Array.isArray(item.content)) {
            for (const c of item.content) {
              if (c.type === 'input_text' && typeof c.text === 'string') {
                texts.push(c.text);
              }
            }
          }
        }
      }
      inputText = texts.join(' ').trim();
      if (!inputText) {
        // default fallback to unknown
        return {
          tripwireTriggered: false,
          outputInfo: { detectedLanguage: 'unknown', isAllowed: true },
        };
      }
    }
    
    // Run the language detection
    const result = await languageGuardrail(inputText);
    
    return {
      tripwireTriggered: !result.isAllowed,
      outputInfo: result,
    };
  },
}; 