import type { CardMeta } from '../types'

export const TRAD: Record<string, string> = {
  M00: 'New beginnings, innocence, spontaneity, free spirit, leap of faith',
  M01: 'Willpower, desire, creation, manifestation, skill',
  M02: 'Intuition, sacred knowledge, divine feminine, the subconscious',
  M03: 'Femininity, beauty, nature, nurturing, abundance',
  M04: 'Authority, establishment, structure, father figure',
  M05: 'Spiritual wisdom, tradition, institutions, conformity',
  M06: 'Love, harmony, relationships, values, choices',
  M07: 'Control, willpower, success, determination, self-discipline',
  M08: 'Strength, courage, persuasion, influence, compassion',
  M09: 'Soul-searching, introspection, solitude, inner guidance',
  M10: 'Good luck, karma, life cycles, destiny, turning point',
  M11: 'Justice, fairness, truth, cause and effect, law',
  M12: 'Pause, surrender, letting go, new perspectives, sacrifice',
  M13: 'Endings, change, transformation, transition, letting go',
  M14: 'Balance, moderation, patience, purpose, meaning',
  M15: 'Shadow self, attachment, addiction, restriction, sexuality',
  M16: 'Sudden upheaval, broken pride, disaster, revelation, chaos',
  M17: 'Hope, faith, purpose, renewal, spirituality',
  M18: 'Illusion, fear, the unconscious, confusion, complexity',
  M19: 'Positivity, fun, warmth, success, vitality',
  M20: 'Judgement, rebirth, inner calling, absolution',
  M21: 'Completion, integration, accomplishment, wholeness',
}

const ELEM: Record<string, string> = {
  major: 'Spirit', wands: 'Fire', cups: 'Water', swords: 'Air', pentacles: 'Earth',
}

const ASTRO: Record<string, string> = {
  M00:'Uranus', M01:'Mercury', M02:'Moon', M03:'Venus', M04:'Aries', M05:'Taurus',
  M06:'Gemini', M07:'Cancer', M08:'Leo', M09:'Virgo', M10:'Jupiter', M11:'Libra',
  M12:'Neptune', M13:'Scorpio', M14:'Sagittarius', M15:'Capricorn', M16:'Mars',
  M17:'Aquarius', M18:'Pisces', M19:'Sun', M20:'Pluto', M21:'Saturn',
  wands:'Fire Signs', cups:'Water Signs', swords:'Air Signs', pentacles:'Earth Signs',
}

type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'

function makeMinors(prefix: string, suit: Suit): CardMeta[] {
  const names: Record<string, string[]> = {
    wands: ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'],
    cups:  ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'],
    swords:['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'],
    pentacles:['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'],
  }
  const suitName = suit.charAt(0).toUpperCase() + suit.slice(1)
  const nums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14]
  const ids = [
    `${prefix}01`,`${prefix}02`,`${prefix}03`,`${prefix}04`,`${prefix}05`,
    `${prefix}06`,`${prefix}07`,`${prefix}08`,`${prefix}09`,`${prefix}10`,
    `${prefix}Pa`,`${prefix}Kn`,`${prefix}Qu`,`${prefix}Ki`,
  ]
  return names[suit].map((n, i) => {
    const label = nums[i] <= 10 ? `${n} of ${suitName}` : `${n} of ${suitName}`
    return {
      id: ids[i], suit, num: nums[i], name: label,
      traditional: '',
      element: ELEM[suit],
      astro: ASTRO[suit] || '',
    }
  })
}

export const CARDS_78: CardMeta[] = [
  { id:'M00', suit:'major', num:0,  name:'The Fool',          traditional:TRAD.M00, element:ELEM.major, astro:ASTRO.M00 },
  { id:'M01', suit:'major', num:1,  name:'The Magician',      traditional:TRAD.M01, element:ELEM.major, astro:ASTRO.M01 },
  { id:'M02', suit:'major', num:2,  name:'The High Priestess',traditional:TRAD.M02, element:ELEM.major, astro:ASTRO.M02 },
  { id:'M03', suit:'major', num:3,  name:'The Empress',       traditional:TRAD.M03, element:ELEM.major, astro:ASTRO.M03 },
  { id:'M04', suit:'major', num:4,  name:'The Emperor',       traditional:TRAD.M04, element:ELEM.major, astro:ASTRO.M04 },
  { id:'M05', suit:'major', num:5,  name:'The Hierophant',    traditional:TRAD.M05, element:ELEM.major, astro:ASTRO.M05 },
  { id:'M06', suit:'major', num:6,  name:'The Lovers',        traditional:TRAD.M06, element:ELEM.major, astro:ASTRO.M06 },
  { id:'M07', suit:'major', num:7,  name:'The Chariot',       traditional:TRAD.M07, element:ELEM.major, astro:ASTRO.M07 },
  { id:'M08', suit:'major', num:8,  name:'Strength',          traditional:TRAD.M08, element:ELEM.major, astro:ASTRO.M08 },
  { id:'M09', suit:'major', num:9,  name:'The Hermit',        traditional:TRAD.M09, element:ELEM.major, astro:ASTRO.M09 },
  { id:'M10', suit:'major', num:10, name:'Wheel of Fortune',  traditional:TRAD.M10, element:ELEM.major, astro:ASTRO.M10 },
  { id:'M11', suit:'major', num:11, name:'Justice',           traditional:TRAD.M11, element:ELEM.major, astro:ASTRO.M11 },
  { id:'M12', suit:'major', num:12, name:'The Hanged Man',    traditional:TRAD.M12, element:ELEM.major, astro:ASTRO.M12 },
  { id:'M13', suit:'major', num:13, name:'Death',             traditional:TRAD.M13, element:ELEM.major, astro:ASTRO.M13 },
  { id:'M14', suit:'major', num:14, name:'Temperance',        traditional:TRAD.M14, element:ELEM.major, astro:ASTRO.M14 },
  { id:'M15', suit:'major', num:15, name:'The Devil',         traditional:TRAD.M15, element:ELEM.major, astro:ASTRO.M15 },
  { id:'M16', suit:'major', num:16, name:'The Tower',         traditional:TRAD.M16, element:ELEM.major, astro:ASTRO.M16 },
  { id:'M17', suit:'major', num:17, name:'The Star',          traditional:TRAD.M17, element:ELEM.major, astro:ASTRO.M17 },
  { id:'M18', suit:'major', num:18, name:'The Moon',          traditional:TRAD.M18, element:ELEM.major, astro:ASTRO.M18 },
  { id:'M19', suit:'major', num:19, name:'The Sun',           traditional:TRAD.M19, element:ELEM.major, astro:ASTRO.M19 },
  { id:'M20', suit:'major', num:20, name:'Judgement',         traditional:TRAD.M20, element:ELEM.major, astro:ASTRO.M20 },
  { id:'M21', suit:'major', num:21, name:'The World',         traditional:TRAD.M21, element:ELEM.major, astro:ASTRO.M21 },
  ...makeMinors('W', 'wands'),
  ...makeMinors('C', 'cups'),
  ...makeMinors('S', 'swords'),
  ...makeMinors('P', 'pentacles'),
]

export const CARD_MAP = Object.fromEntries(CARDS_78.map(c => [c.id, c]))

export const SUIT_COLOR: Record<string, string> = {
  major: 'var(--suits-major)',
  wands: 'var(--suits-wands)',
  cups: 'var(--suits-cups)',
  swords: 'var(--suits-swords)',
  pentacles: 'var(--suits-pentacles)',
}
