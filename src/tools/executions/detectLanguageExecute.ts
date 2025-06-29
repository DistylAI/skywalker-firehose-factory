import openai from '../../lib/openai';

export async function detectLanguageExecute(input: { text: string }) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Analyze the given text and return ONLY the ISO 639-1 two-letter language code (e.g., "en" for English, "es" for Spanish, "fr" for French, etc.). If you cannot determine the language, return "unknown".'
        },
        {
          role: 'user',
          content: input.text
        }
      ],
      max_tokens: 10,
    });

    const languageCode = response.choices[0].message.content?.trim().toLowerCase() || 'unknown';
    
    return {
      languageCode,
      text: input.text
    };
  } catch (error) {
    console.error('Error detecting language:', error);
    return {
      languageCode: 'unknown',
      text: input.text
    };
  }
} 