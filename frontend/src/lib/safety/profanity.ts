"use client";

import profanity from "leo-profanity";

let dictionaryLoaded = false;

function ensureDictionary() {
  if (dictionaryLoaded) {
    return;
  }
  // Load default English dictionary and keep any previously added entries.
  profanity.loadDictionary();
  dictionaryLoaded = true;
}

export function containsProhibitedLanguage(text: string | null | undefined): boolean {
  ensureDictionary();
  if (!text) {
    return false;
  }
  return profanity.check(text);
}

export function sanitizeProhibitedLanguage(text: string): string {
  ensureDictionary();
  return profanity.clean(text);
}
