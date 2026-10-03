export interface ColorDef {
  name: string;
  hex: string;
  description?: string;
}

export interface ColorGroup {
  category: string;
  colors: Record<string, ColorDef>;
}

export const CALM_COLOR_CATEGORIES = {
  neutrals: {
    category: 'Neutrals & Light Tones',
    colors: {
      ivory: { name: 'Ivory', hex: '#FFF9E9', description: 'Light neutral background (60%)' },
      warmBeige: { name: 'Warm beige', hex: '#E5D5C3', description: 'Soft muted surface container' },
      lightTaupe: { name: 'Light taupe', hex: '#C8B9A8', description: 'Earthy subtle divider and border' },
      softGray: { name: 'Soft gray', hex: '#D9DEDC', description: 'Clean minimal background and text' },
    }
  },
  pastelBlues: {
    category: 'Pastel Blues & Aquas',
    colors: {
      powderBlue: { name: 'Powder blue', hex: '#B8CED6', description: 'Cool airy surface color' },
      mistyBlue: { name: 'Misty blue', hex: '#AFC8CD', description: 'Muted calm primary tone (30%)' },
      softTeal: { name: 'Soft teal', hex: '#8FBAB2', description: 'Restful balanced accent (10%)' },
      paleAqua: { name: 'Pale aqua', hex: '#C5E1DC', description: 'Light refreshing highlight' },
      slateBlue: { name: 'Slate blue', hex: '#879DAA', description: 'Deep grounding slate tone' },
    }
  },
  warmPinks: {
    category: 'Warm Pinks & Roses',
    colors: {
      dustyRose: { name: 'Dusty rose', hex: '#D9AAA9', description: 'Soft muted rosy tone' },
      blushPink: { name: 'Blush pink', hex: '#EBC4C0', description: 'Delicate warm blush highlight' },
    }
  },
  mutedEarth: {
    category: 'Muted Earth & Warm Tones',
    colors: {
      butterYellow: { name: 'Butter yellow', hex: '#F0E3AE', description: 'Warm comforting yellow' },
      mutedMustard: { name: 'Muted mustard', hex: '#C7B56B', description: 'Grounded golden accent' },
      cocoaBrown: { name: 'Cocoa brown', hex: '#8B7062', description: 'Rich natural earth anchor' },
      charcoalGreen: { name: 'Charcoal green', hex: '#3F4841', description: 'Dark deep forest neutral' },
    }
  },
  existingCore: {
    category: 'Existing Core Palette Tones',
    colors: {
      mutedPeach: { name: 'Muted peach', hex: '#F2C6A0', description: '3D Atom nucleus & core accent' },
      twilightLavender: { name: 'Twilight lavender', hex: '#A89FBB', description: 'Dusk purple theme tone' },
      oceanMist: { name: 'Ocean mist', hex: '#91A3B0', description: 'Reflective coastal teal' },
      pineGreen: { name: 'Pine green', hex: '#8FA382', description: 'Grounded forest green' },
      silkCashmere: { name: 'Silk cashmere', hex: '#DDD3C4', description: 'Ultra-soft neutral luxury' },
      morningFog: { name: 'Morning fog', hex: '#C0C8CF', description: 'Crisp monochromatic haze' },
    }
  }
} as const;

export const CALM_COLORS = {
  // Individual hex constants
  POWDER_BLUE: '#B8CED6',
  MISTY_BLUE: '#AFC8CD',
  SOFT_TEAL: '#8FBAB2',
  PALE_AQUA: '#C5E1DC',
  DUSTY_ROSE: '#D9AAA9',
  BLUSH_PINK: '#EBC4C0',
  WARM_BEIGE: '#E5D5C3',
  IVORY: '#FFF9E9',
  LIGHT_TAUPE: '#C8B9A8',
  SOFT_GRAY: '#D9DEDC',
  BUTTER_YELLOW: '#F0E3AE',
  MUTED_MUSTARD: '#C7B56B',
  COCOA_BROWN: '#8B7062',
  SLATE_BLUE: '#879DAA',
  CHARCOAL_GREEN: '#3F4841',
  MUTED_PEACH: '#F2C6A0',
} as const;
