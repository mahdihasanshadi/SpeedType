// Common short English words — the default pool for word-mode and time-mode passage generation.
export const COMMON_WORDS = [
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "as", "with", "his", "they", "at",
  "be", "this", "have", "from", "or", "one", "had", "by", "word", "but",
  "not", "what", "all", "were", "we", "when", "your", "can", "said", "there",
  "use", "each", "which", "she", "how", "their", "if", "will", "up", "other",
  "about", "out", "many", "then", "them", "these", "so", "some", "her", "would",
  "make", "like", "him", "into", "time", "has", "look", "two", "more", "write",
  "go", "see", "number", "no", "way", "could", "people", "than", "first", "water",
  "been", "call", "who", "its", "now", "find", "long", "down", "day", "did",
  "get", "come", "made", "may", "part", "over", "new", "sound", "take", "only",
  "little", "work", "know", "place", "year", "live", "me", "back", "give", "most",
  "very", "after", "thing", "our", "just", "name", "good", "sentence", "man", "think",
  "say", "great", "where", "help", "through", "much", "before", "line", "right", "too",
  "mean", "old", "any", "same", "tell", "boy", "follow", "came", "want", "show",
  "also", "around", "form", "three", "small", "set", "put", "end", "does", "another",
  "well", "large", "must", "big", "even", "such", "because", "turn", "here", "why",
  "ask", "went", "men", "read", "need", "land", "different", "home", "us", "move",
  "try", "kind", "hand", "picture", "again", "change", "off", "play", "spell", "air",
  "away", "animal", "house", "point", "page", "letter", "mother", "answer", "found", "study",
  "still", "learn", "should", "world", "keyboard", "speed", "type", "test", "focus", "flow",
] as const;

export function randomWord(pool: readonly string[] = COMMON_WORDS): string {
  return pool[Math.floor(Math.random() * pool.length)];
}
