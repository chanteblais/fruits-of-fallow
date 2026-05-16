export interface JournalEntry {
  id: string
  date: string
  cardId: string
  cardName: string
  suit: string
  orientation: 'upright' | 'reversed'
  primaryThemes: string
  traditionalMeaning: string
  personalReflection: string
  howAppeared: string
  quotesInsights: string
  emergingSymbols: string[]
  visualDirection: string
  psychologicalThemes: string[]
  guidebookNotes: string
  createdAt: string
  updatedAt: string
}

export interface TimestampedNote {
  text: string
  date: string
}

export interface CardData {
  id: string
  personalMeanings: TimestampedNote[]
  symbolism: TimestampedNote[]
  archetypeNotes: TimestampedNote[]
  visualNotes: string
  associatedSymbols: string[]
  guidebookDrafts: TimestampedNote[]
  lastUpdated: string | null
}

export interface CardMeta {
  id: string
  suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'
  num: number
  name: string
  traditional: string
  element: string
  astro: string
}

export interface Symbol {
  id: string
  name: string
  meaning: string
  poeticEssence?: string
  voice?: string
  elementalQuality?: string
  season?: string
  recurringContexts?: string
  emotionalAssociations: string[]
  connectedCards: string[]
  appearances: string[]
  evolution: TimestampedNote[]
  fieldNotes?: TimestampedNote[]
  relatedSymbols: string[]
  journalBacklinks: string[]
}

export interface Theme {
  id: string
  name: string
  description: string
  relatedCards: string[]
  occurrences: { entryId: string; date: string }[]
  emotionalPatterns: string[]
  evolvedMeanings: string[]
}

export interface ImageRecord {
  id: string
  filename: string
  url: string
  refType: string
  refId: string
  caption: string
  iteration: string
  date: string
}

export type CardImage = ImageRecord

export interface AnalysisItem {
  text: string
  type: string
  reason: string
}

export interface EntryAnalysis {
  id: string
  entryId: string
  cardId: string
  livingArcana: {
    card_meaning_additions?: AnalysisItem[]
    visual_notes?: AnalysisItem[]
    symbol_connections?: AnalysisItem[]
    guidebook_phrases?: AnalysisItem[]
    questions_to_revisit?: AnalysisItem[]
  }
  theWeaving: {
    emerging_themes?: AnalysisItem[]
    recurring_symbols?: AnalysisItem[]
    poignant_moments?: AnalysisItem[]
    weaving_threads?: AnalysisItem[]
    connections_to_previous?: AnalysisItem[]
    essay_seeds?: AnalysisItem[]
  }
  crossLinks: {
    linked_cards?: string[]
    linked_symbols?: string[]
    linked_themes?: string[]
    linked_entry_dates?: string[]
  }
  notArchived: { text: string; reason: string }[]
  createdAt: string
}

export interface WeavingThread {
  id: string
  title: string
  focus: string
  body: string
  threads: { label: string; observation: string }[]
  entryIds: string[]
  cardsObserved: string[]
  symbolsObserved: string[]
  entryCount: number
  createdAt: string
}
