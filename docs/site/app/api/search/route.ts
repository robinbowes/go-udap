import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // Keep English stemming and stop-words. Fumadocs 16.14 defaults to
  // ZBSearch's 'multilingual' tokenizer, which segments on Unicode word
  // boundaries but does not stem — worse relevance for English-only docs.
  language: 'english',
});
