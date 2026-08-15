import { COMMON_WORDS, randomWord } from "./words";

export type TestMode = "time" | "words";

export type PassageOptions = {
  punctuation?: boolean;
  numbers?: boolean;
};

/**
 * A fast typist ceiling used to make sure a time-mode passage never runs out before the timer
 * does — the Test UI (step 10) doesn't need to handle "ran off the end of the passage".
 */
const FAST_TYPIST_WPM_CEILING = 150;

export function estimateWordCountForDuration(seconds: number): number {
  const words = Math.ceil((FAST_TYPIST_WPM_CEILING / 60) * seconds);
  return words + 10; // buffer
}

function randomNumberToken(): string {
  return String(Math.floor(Math.random() * 1000));
}

/** Adds sentence-style punctuation to a word list: capitalized sentence starts, commas, periods. */
function applyPunctuation(words: string[]): string[] {
  const result: string[] = [];
  let sinceComma = 0;
  let sinceSentenceStart = 0;

  words.forEach((word, i) => {
    let token = word;
    const isSentenceStart = i === 0 || sinceSentenceStart === 0;

    if (isSentenceStart) {
      token = token.charAt(0).toUpperCase() + token.slice(1);
    }

    const isLast = i === words.length - 1;
    const sentenceLength = 8 + Math.floor(Math.random() * 5); // 8-12 words per sentence

    if (!isLast && sinceComma >= 4 && Math.random() < 0.15) {
      token += ",";
      sinceComma = 0;
    } else {
      sinceComma += 1;
    }

    sinceSentenceStart += 1;

    if (isLast) {
      token += ".";
    } else if (sinceSentenceStart >= sentenceLength) {
      token += ".";
      sinceSentenceStart = 0;
      sinceComma = 0;
    }

    result.push(token);
  });

  return result;
}

export function generateWordPassage(wordCount: number, options: PassageOptions = {}): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const useNumber = options.numbers && Math.random() < 0.1;
    words.push(useNumber ? randomNumberToken() : randomWord(COMMON_WORDS));
  }

  const finalWords = options.punctuation ? applyPunctuation(words) : words;
  return finalWords.join(" ");
}

export function generatePassage(
  mode: TestMode,
  target: number,
  options: PassageOptions = {},
): string {
  const wordCount = mode === "words" ? target : estimateWordCountForDuration(target);
  return generateWordPassage(wordCount, options);
}
