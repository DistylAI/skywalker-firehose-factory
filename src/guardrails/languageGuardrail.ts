import { detectLanguageExecute } from '../tools/executions/detectLanguageExecute';
import { 
  type InputGuardrail,
  type InputGuardrailFunctionArgs,
  type GuardrailFunctionOutput 
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
    // Extract text from input
    let inputText: string;
    
    if (typeof args.input === 'string') {
      inputText = args.input;
    } else {
      // Find the latest user message from ModelItem[]
      const userMessages = args.input.filter(item => 
        item.type === 'message' && item.role === 'user'
      );
      
      if (userMessages.length === 0) {
        // No user message found, allow through
        return {
          tripwireTriggered: false,
          outputInfo: { detectedLanguage: 'unknown', isAllowed: true }
        };
      }
      
      // Get the latest user message and extract text
      const latestMessage = userMessages[userMessages.length - 1];
      if (latestMessage.type === 'message' && latestMessage.role === 'user') {
        if (typeof latestMessage.content === 'string') {
          inputText = latestMessage.content;
        } else if (Array.isArray(latestMessage.content)) {
          // Find text content in the content array
          const textContent = latestMessage.content.find(c => 
            'text' in c && c.type === 'input_text'
          );
          inputText = textContent?.text || '';
        } else {
          inputText = '';
        }
      } else {
        inputText = '';
      }
    }
    
    // Run the language detection
    const result = await languageGuardrail(inputText);
    
    return {
      tripwireTriggered: !result.isAllowed,
      outputInfo: result
    };
  }
};

// For now, let's create a simpler decorator that can be used with agents
// This will be enhanced once we understand the exact TypeScript API structure
export function createLanguageGuardrail() {
  return {
    name: 'language_guardrail',
    description: 'Validates that user input is in supported languages (English or Spanish)',
    validate: languageGuardrail
  };
} 