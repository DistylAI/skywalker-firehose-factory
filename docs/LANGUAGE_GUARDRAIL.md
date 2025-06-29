# Language Detection Guardrail

## Overview

The language detection guardrail is an input validation system that ensures the chatbot only processes messages in supported languages (currently English and Spanish). When a user sends a message in an unsupported language, the system immediately returns an error message without processing the request through the AI agent.

## How It Works

### 1. Language Detection
- When a user sends a message, the system first extracts the latest user message
- The message is sent to a language detection service (using OpenAI's GPT-4o-mini model)
- The service returns an ISO 639-1 two-letter language code (e.g., "en" for English, "es" for Spanish)

### 2. Language Validation
- The detected language code is checked against the list of accepted languages: `['en', 'es']`
- If the language is supported, the message continues to the assistant agent
- If the language is not supported, the system returns: `[[ error unsupported language ]]`

### 3. Error Handling
- If language detection fails for any reason, the message is allowed through (fail-open approach)
- This ensures the system remains functional even if the language detection service is unavailable

## Architecture

```
User Input → Language Detection → Validation → Agent Processing
                                      ↓
                                 Error Response
```

## Files Structure

- `src/tools/detectLanguage.ts` - Language detection tool definition
- `src/tools/executions/detectLanguageExecute.ts` - Language detection implementation
- `src/guardrails/languageGuardrail.ts` - Guardrail logic and validation
- `src/app/api/chat/route.ts` - Integration point where guardrail is applied
- `tests/languageGuardrail.test.ts` - Unit tests for the guardrail

## Configuration

### Supported Languages
To modify the list of supported languages, edit the `ACCEPTED_LANGUAGES` array in `src/guardrails/languageGuardrail.ts`:

```typescript
const ACCEPTED_LANGUAGES = ['en', 'es']; // Add more ISO 639-1 codes as needed
```

### Error Message
To customize the error message, modify the `errorMessage` in the guardrail:

```typescript
errorMessage: isAllowed ? undefined : '[[ error unsupported language ]]'
```

## Testing

Run the language guardrail tests:
```bash
npm test languageGuardrail.test.ts
```

## Examples

### Allowed Languages

**English:**
- Input: "Hello, how are you?"
- Result: Message processed normally

**Spanish:**
- Input: "Hola, ¿cómo estás?"
- Result: Message processed normally

### Blocked Languages

**French:**
- Input: "Bonjour, comment allez-vous?"
- Result: `[[ error unsupported language ]]`

**German:**
- Input: "Guten Tag!"
- Result: `[[ error unsupported language ]]`

## Performance Considerations

- Language detection adds ~200-500ms latency to each request
- Uses GPT-4o-mini for cost efficiency
- Detection runs on every user message (not on assistant responses)
- Failed detections don't block the user (fail-open approach)

## Future Enhancements

1. **Caching**: Cache language detection results for repeated messages
2. **User Preferences**: Store user language preferences to skip detection
3. **Multi-language Responses**: Automatically respond in the detected language
4. **Offline Detection**: Consider using a local language detection library for faster processing
5. **Configurable Messages**: Support custom error messages per language 