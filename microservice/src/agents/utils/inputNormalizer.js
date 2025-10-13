/**
 * Input Normalizer Utility
 * Normalizes messy text input, detects language, and classifies request type
 */

/**
 * Normalize and classify user input
 * @param {string} input - Raw user input
 * @returns {object} - { text, language, kind }
 */
export function normalizeAndClassify(input) {
  // Handle null/undefined/non-string inputs
  if (!input) {
    return {
      text: '',
      language: 'en',
      kind: 'info'
    };
  }

  // Convert to string and normalize whitespace
  const text = input
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 2000); // Limit length to 2000 chars

  // Empty check after normalization
  if (!text) {
    return {
      text: '',
      language: 'en',
      kind: 'info'
    };
  }

  const lower = text.toLowerCase();

  // Classify request type (trade vs info)
  const tradeKeywords = [
    'swap', 'trade', 'buy', 'sell', 'quote', 'exchange',
    'convert', 'slippage', 'execute', 'approve', 'transaction'
  ];
  
  const isTrade = tradeKeywords.some(keyword => lower.includes(keyword));
  const kind = isTrade ? 'trade' : 'info';

  // Detect language (simple heuristic-based detection)
  const language = detectLanguage(text);

  console.log('🧹 [InputNormalizer]', {
    originalLength: input.toString().length,
    normalizedLength: text.length,
    language,
    kind
  });

  return { text, language, kind };
}

/**
 * Detect language from text using simple heuristics
 * @param {string} text - Input text
 * @returns {string} - Language code (en, es, ru, zh, ja, ko, auto)
 */
function detectLanguage(text) {
  if (!text || text.length < 3) {
    return 'en';
  }

  // Count character types
  const cyrillicChars = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06ff]/g) || []).length;
  
  const total = text.length;
  
  // Calculate percentages
  const cyrillicPercent = (cyrillicChars / total) * 100;
  const latinPercent = (latinChars / total) * 100;
  const chinesePercent = (chineseChars / total) * 100;
  const japanesePercent = (japaneseChars / total) * 100;
  const koreanPercent = (koreanChars / total) * 100;
  const arabicPercent = (arabicChars / total) * 100;

  // Threshold for language detection (at least 30% of characters)
  const threshold = 30;

  if (cyrillicPercent >= threshold) return 'ru';
  if (chinesePercent >= threshold) return 'zh';
  if (japanesePercent >= threshold) return 'ja';
  if (koreanPercent >= threshold) return 'ko';
  if (arabicPercent >= threshold) return 'ar';
  
  // Spanish detection (look for common Spanish words)
  const spanishWords = ['el', 'la', 'de', 'que', 'por', 'para', 'con', 'una', 'precio', 'moneda'];
  const lowerText = text.toLowerCase();
  const spanishMatches = spanishWords.filter(word => 
    lowerText.includes(` ${word} `) || 
    lowerText.startsWith(`${word} `) || 
    lowerText.endsWith(` ${word}`)
  );
  if (spanishMatches.length >= 2) return 'es';

  // French detection
  const frenchWords = ['le', 'la', 'de', 'et', 'pour', 'avec', 'une', 'prix', 'monnaie'];
  const frenchMatches = frenchWords.filter(word => 
    lowerText.includes(` ${word} `) || 
    lowerText.startsWith(`${word} `) || 
    lowerText.endsWith(` ${word}`)
  );
  if (frenchMatches.length >= 2) return 'fr';

  // German detection
  const germanWords = ['der', 'die', 'das', 'und', 'mit', 'für', 'ist', 'preis'];
  const germanMatches = germanWords.filter(word => 
    lowerText.includes(` ${word} `) || 
    lowerText.startsWith(`${word} `) || 
    lowerText.endsWith(` ${word}`)
  );
  if (germanMatches.length >= 2) return 'de';

  // Default to English if mostly Latin characters or undetected
  if (latinPercent >= 20) return 'en';

  // Fallback
  return 'auto';
}

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Raw input
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potential SQL injection patterns
  let sanitized = input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/<script>/gi, '') // Remove script tags
    .replace(/<\/script>/gi, '')
    .trim();

  return sanitized;
}

/**
 * Validate if input is safe for processing
 * @param {string} input - Input to validate
 * @returns {boolean} - True if safe, false otherwise
 */
export function isInputSafe(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Check for extremely long input
  if (input.length > 5000) {
    return false;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /eval\(/i,
    /exec\(/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      console.warn('🛑 [InputNormalizer] Suspicious pattern detected:', pattern);
      return false;
    }
  }

  return true;
}

