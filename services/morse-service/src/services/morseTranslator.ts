export interface MorseTranslationRequest {
  text?: string;
  morse?: string;
  direction: 'text-to-morse' | 'morse-to-text';
}

export interface MorseTranslationResponse {
  original: string;
  translated: string;
  direction: 'text-to-morse' | 'morse-to-text';
  timestamp: string;
}

// International Morse Code mapping
const MORSE_CODE_MAP: Record<string, string> = {
  // Letters
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  
  // Numbers
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  
  // Punctuation
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
};

// Reverse mapping for morse to text
const TEXT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_MAP).map(([text, morse]) => [morse, text])
);

export class MorseTranslator {
  /**
   * Convert text to morse code
   */
  static textToMorse(text: string): string {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    return text
      .toUpperCase()
      .split('')
      .map(char => {
        if (char === ' ') return '/';
        const morse = MORSE_CODE_MAP[char];
        if (!morse) {
          throw new Error(`Unsupported character: ${char}`);
        }
        return morse;
      })
      .join(' ');
  }

  /**
   * Convert morse code to text
   */
  static morseToText(morse: string): string {
    if (!morse || typeof morse !== 'string') {
      throw new Error('Invalid morse input');
    }

    // Clean up morse input - normalize spaces
    const cleanMorse = morse.trim().replace(/\s+/g, ' ');
    
    return cleanMorse
      .split(' ')
      .map(morseChar => {
        if (morseChar === '/') return ' ';
        const text = TEXT_MAP[morseChar];
        if (!text) {
          throw new Error(`Invalid morse code: ${morseChar}`);
        }
        return text;
      })
      .join('');
  }

  /**
   * Validate morse code format
   */
  static validateMorseCode(morse: string): boolean {
    if (!morse || typeof morse !== 'string') return false;
    
    // Check if contains only valid morse characters: dots, dashes, spaces, and slashes
    const validMorsePattern = /^[.\-\s\/]+$/;
    return validMorsePattern.test(morse);
  }

  /**
   * Validate text for morse conversion
   */
  static validateText(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    // Check if all characters are supported
    const upperText = text.toUpperCase();
    return upperText.split('').every(char => 
      char === ' ' || MORSE_CODE_MAP.hasOwnProperty(char)
    );
  }

  /**
   * Get supported characters
   */
  static getSupportedCharacters(): string[] {
    return Object.keys(MORSE_CODE_MAP).filter(char => char !== ' ');
  }

  /**
   * Translate based on direction
   */
  static translate(request: MorseTranslationRequest): MorseTranslationResponse {
    const { text, morse, direction } = request;
    
    if (direction === 'text-to-morse') {
      if (!text) {
        throw new Error('Text is required for text-to-morse translation');
      }
      
      if (!this.validateText(text)) {
        throw new Error('Text contains unsupported characters');
      }
      
      const translated = this.textToMorse(text);
      return {
        original: text,
        translated,
        direction,
        timestamp: new Date().toISOString()
      };
    } else {
      if (!morse) {
        throw new Error('Morse code is required for morse-to-text translation');
      }
      
      if (!this.validateMorseCode(morse)) {
        throw new Error('Invalid morse code format');
      }
      
      const translated = this.morseToText(morse);
      return {
        original: morse,
        translated,
        direction,
        timestamp: new Date().toISOString()
      };
    }
  }
}
