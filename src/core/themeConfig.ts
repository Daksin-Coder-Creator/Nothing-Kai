export type ThemeId = 'lavender' | 'ocean' | 'pine' | 'silk' | 'fog' | 'powder_aqua' | 'rose_blush' | 'warm_taupe' | 'butter_mustard' | 'slate_charcoal' | 'calm' | 'bw';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  tagline: string;
  fontClass: string; 
  bgCanvas: string;
  bgCard: string;
  bgInput: string;
  textMain: string;
  textSecondary: string;
  accentPrimary: string;
  accentBorder: string;
  accentText: string;
  accentBadgeBg: string;
  accentGlow: string;
  userBubbleBg: string;
  userBubbleBorder: string;
  gradientHeader: string;
  colorSwatch: string[];
}

export const THEMES: Record<ThemeId, ThemePreset> = {
  lavender: {
    id: 'lavender',
    name: 'Twilight Lavender',
    tagline: 'Restful purples and soft lilac dusk',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#5E5368]',
    bgCard: 'bg-[#4A4154]',
    bgInput: 'bg-[#ECEAEF]/10',
    textMain: 'text-[#FAF9F6]',
    textSecondary: 'text-[#C4BDD0]',
    accentPrimary: 'bg-[#A89FBB]',
    accentBorder: 'border-[#A89FBB]/30',
    accentText: 'text-[#C4BDD0]',
    accentBadgeBg: 'bg-[#A89FBB]/20 text-[#FAF9F6] border-[#A89FBB]/30',
    accentGlow: 'shadow-[0_0_15px_rgba(168,159,187,0.3)]',
    userBubbleBg: 'bg-[#ECEAEF]/20',
    userBubbleBorder: 'border-[#A89FBB]/20',
    gradientHeader: 'from-[#A89FBB] to-[#C4BDD0]',
    colorSwatch: ['#A89FBB', '#C4BDD0', '#5E5368']
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Mist',
    tagline: 'Cool, airy, and reflective coastal calm',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#4A607A]',
    bgCard: 'bg-[#3A4C61]',
    bgInput: 'bg-[#E0E7E3]/10',
    textMain: 'text-[#E0E7E3]',
    textSecondary: 'text-[#A8C3BC]',
    accentPrimary: 'bg-[#91A3B0]',
    accentBorder: 'border-[#91A3B0]/30',
    accentText: 'text-[#A8C3BC]',
    accentBadgeBg: 'bg-[#91A3B0]/20 text-[#E0E7E3] border-[#91A3B0]/30',
    accentGlow: 'shadow-[0_0_15px_rgba(145,163,176,0.3)]',
    userBubbleBg: 'bg-[#E0E7E3]/20',
    userBubbleBorder: 'border-[#91A3B0]/20',
    gradientHeader: 'from-[#91A3B0] to-[#A8C3BC]',
    colorSwatch: ['#91A3B0', '#A8C3BC', '#4A607A']
  },
  pine: {
    id: 'pine',
    name: 'Pine & Hearth',
    tagline: 'Richer, grounded cozy moody calm',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#2D312E]',
    bgCard: 'bg-[#3C4F44]',
    bgInput: 'bg-[#E3D8C8]/10',
    textMain: 'text-[#E3D8C8]',
    textSecondary: 'text-[#8FA382]',
    accentPrimary: 'bg-[#8FA382]',
    accentBorder: 'border-[#8FA382]/30',
    accentText: 'text-[#8FA382]',
    accentBadgeBg: 'bg-[#8FA382]/20 text-[#E3D8C8] border-[#8FA382]/30',
    accentGlow: 'shadow-[0_0_15px_rgba(143,163,130,0.3)]',
    userBubbleBg: 'bg-[#6B6055]/30',
    userBubbleBorder: 'border-[#8FA382]/20',
    gradientHeader: 'from-[#3C4F44] to-[#8FA382]',
    colorSwatch: ['#3C4F44', '#8FA382', '#2D312E']
  },
  silk: {
    id: 'silk',
    name: 'Silk & Cashmere',
    tagline: 'Elegant, delicate ultra-soft neutral luxury',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#5C5248]',
    bgCard: 'bg-[#AEA397]',
    bgInput: 'bg-[#FDFBF7]/10',
    textMain: 'text-[#FDFBF7]',
    textSecondary: 'text-[#DDD3C4]',
    accentPrimary: 'bg-[#DDD3C4]',
    accentBorder: 'border-[#DDD3C4]/30',
    accentText: 'text-[#EBDCD9]',
    accentBadgeBg: 'bg-[#AEA397]/40 text-[#FDFBF7] border-[#DDD3C4]/30',
    accentGlow: 'shadow-[0_0_15px_rgba(221,211,196,0.3)]',
    userBubbleBg: 'bg-[#AEA397]/50',
    userBubbleBorder: 'border-[#DDD3C4]/20',
    gradientHeader: 'from-[#AEA397] to-[#DDD3C4]',
    colorSwatch: ['#AEA397', '#DDD3C4', '#5C5248']
  },
  fog: {
    id: 'fog',
    name: 'Morning Fog',
    tagline: 'Cool, crisp, and quiet monochromatic haze',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#475569]',
    bgCard: 'bg-[#788696]',
    bgInput: 'bg-[#F8FAFC]/10',
    textMain: 'text-[#F8FAFC]',
    textSecondary: 'text-[#C0C8CF]',
    accentPrimary: 'bg-[#C0C8CF]',
    accentBorder: 'border-[#C0C8CF]/30',
    accentText: 'text-[#C0C8CF]',
    accentBadgeBg: 'bg-[#C0C8CF]/20 text-[#F8FAFC] border-[#C0C8CF]/30',
    accentGlow: 'shadow-[0_0_15px_rgba(192,200,207,0.3)]',
    userBubbleBg: 'bg-[#E5ECEF]/20',
    userBubbleBorder: 'border-[#C0C8CF]/20',
    gradientHeader: 'from-[#788696] to-[#C0C8CF]',
    colorSwatch: ['#788696', '#C0C8CF', '#475569']
  },
  powder_aqua: {
    id: 'powder_aqua',
    name: 'Powder & Pale Aqua',
    tagline: 'Powder blue, pale aqua & soft teal tranquility',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#96B3BD]',
    bgCard: 'bg-[#B8CED6]',
    bgInput: 'bg-[#C5E1DC]/10',
    textMain: 'text-[#F4F9F8]',
    textSecondary: 'text-[#C5E1DC]',
    accentPrimary: 'bg-[#8FBAB2]',
    accentBorder: 'border-[#8FBAB2]/40',
    accentText: 'text-[#C5E1DC]',
    accentBadgeBg: 'bg-[#8FBAB2]/25 text-[#F4F9F8] border-[#8FBAB2]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(143,186,178,0.4)]',
    userBubbleBg: 'bg-[#B8CED6]/40',
    userBubbleBorder: 'border-[#8FBAB2]/30',
    gradientHeader: 'from-[#B8CED6] to-[#C5E1DC]',
    colorSwatch: ['#B8CED6', '#C5E1DC', '#8FBAB2']
  },
  rose_blush: {
    id: 'rose_blush',
    name: 'Dusty Rose & Blush',
    tagline: 'Dusty rose, blush pink & ivory warmth',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#B58A89]',
    bgCard: 'bg-[#D9AAA9]',
    bgInput: 'bg-[#FFF9E9]/10',
    textMain: 'text-[#FFF9E9]',
    textSecondary: 'text-[#EBC4C0]',
    accentPrimary: 'bg-[#EBC4C0]',
    accentBorder: 'border-[#EBC4C0]/40',
    accentText: 'text-[#FFF9E9]',
    accentBadgeBg: 'bg-[#EBC4C0]/25 text-[#FFF9E9] border-[#EBC4C0]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(235,196,192,0.4)]',
    userBubbleBg: 'bg-[#D9AAA9]/40',
    userBubbleBorder: 'border-[#EBC4C0]/30',
    gradientHeader: 'from-[#D9AAA9] to-[#EBC4C0]',
    colorSwatch: ['#D9AAA9', '#EBC4C0', '#FFF9E9']
  },
  warm_taupe: {
    id: 'warm_taupe',
    name: 'Warm Beige & Taupe',
    tagline: 'Warm beige, light taupe & soft ivory harmony',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#B8A692]',
    bgCard: 'bg-[#E5D5C3]',
    bgInput: 'bg-[#FFF9E9]/10',
    textMain: 'text-[#3D352E]',
    textSecondary: 'text-[#6E6052]',
    accentPrimary: 'bg-[#C8B9A8]',
    accentBorder: 'border-[#C8B9A8]/40',
    accentText: 'text-[#3D352E]',
    accentBadgeBg: 'bg-[#C8B9A8]/25 text-[#3D352E] border-[#C8B9A8]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(200,185,168,0.4)]',
    userBubbleBg: 'bg-[#E5D5C3]/60',
    userBubbleBorder: 'border-[#C8B9A8]/40',
    gradientHeader: 'from-[#E5D5C3] to-[#C8B9A8]',
    colorSwatch: ['#E5D5C3', '#C8B9A8', '#FFF9E9']
  },
  butter_mustard: {
    id: 'butter_mustard',
    name: 'Butter & Mustard Meadow',
    tagline: 'Butter yellow, muted mustard & cocoa brown',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#A39252]',
    bgCard: 'bg-[#F0E3AE]',
    bgInput: 'bg-[#8B7062]/10',
    textMain: 'text-[#362D24]',
    textSecondary: 'text-[#5E4C41]',
    accentPrimary: 'bg-[#C7B56B]',
    accentBorder: 'border-[#C7B56B]/40',
    accentText: 'text-[#362D24]',
    accentBadgeBg: 'bg-[#C7B56B]/25 text-[#362D24] border-[#C7B56B]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(199,181,107,0.4)]',
    userBubbleBg: 'bg-[#F0E3AE]/50',
    userBubbleBorder: 'border-[#C7B56B]/40',
    gradientHeader: 'from-[#F0E3AE] to-[#C7B56B]',
    colorSwatch: ['#F0E3AE', '#C7B56B', '#8B7062']
  },
  slate_charcoal: {
    id: 'slate_charcoal',
    name: 'Slate & Charcoal Forest',
    tagline: 'Slate blue, charcoal green & soft gray calm',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#2A302B]',
    bgCard: 'bg-[#3F4841]',
    bgInput: 'bg-[#D9DEDC]/10',
    textMain: 'text-[#D9DEDC]',
    textSecondary: 'text-[#879DAA]',
    accentPrimary: 'bg-[#879DAA]',
    accentBorder: 'border-[#879DAA]/40',
    accentText: 'text-[#D9DEDC]',
    accentBadgeBg: 'bg-[#879DAA]/25 text-[#D9DEDC] border-[#879DAA]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(135,157,170,0.4)]',
    userBubbleBg: 'bg-[#3F4841]/70',
    userBubbleBorder: 'border-[#879DAA]/30',
    gradientHeader: 'from-[#3F4841] to-[#879DAA]',
    colorSwatch: ['#3F4841', '#879DAA', '#D9DEDC']
  },
  calm: {
    id: 'calm',
    name: 'Serene Calm',
    tagline: 'Light Ivory neutral (60%), Misty Blue main (30%) & Soft Teal accent (10%)',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#FFF9E9]',
    bgCard: 'bg-[#E5D5C3]',
    bgInput: 'bg-[#C8B9A8]/20',
    textMain: 'text-[#3F4841]',
    textSecondary: 'text-[#8B7062]',
    accentPrimary: 'bg-[#8FBAB2]',
    accentBorder: 'border-[#8FBAB2]/40',
    accentText: 'text-[#3F4841]',
    accentBadgeBg: 'bg-[#8FBAB2]/25 text-[#3F4841] border-[#8FBAB2]/40',
    accentGlow: 'shadow-[0_0_15px_rgba(143,186,178,0.4)]',
    userBubbleBg: 'bg-[#AFC8CD]/30',
    userBubbleBorder: 'border-[#8FBAB2]/40',
    gradientHeader: 'from-[#AFC8CD] to-[#8FBAB2]',
    colorSwatch: ['#FFF9E9', '#AFC8CD', '#8FBAB2']
  },
  bw: {
    id: 'bw',
    name: 'Monochrome Black & White',
    tagline: 'High-contrast stark minimalist black and white',
    fontClass: 'font-sans',
    bgCanvas: 'bg-[#09090B]',
    bgCard: 'bg-[#18181B]',
    bgInput: 'bg-white/10',
    textMain: 'text-[#FFFFFF]',
    textSecondary: 'text-[#A1A1AA]',
    accentPrimary: 'bg-[#FFFFFF]',
    accentBorder: 'border-white/30',
    accentText: 'text-[#FFFFFF]',
    accentBadgeBg: 'bg-white/20 text-[#FFFFFF] border-white/30',
    accentGlow: 'shadow-[0_0_15px_rgba(255,255,255,0.3)]',
    userBubbleBg: 'bg-white/15',
    userBubbleBorder: 'border-white/30',
    gradientHeader: 'from-[#FFFFFF] to-[#A1A1AA]',
    colorSwatch: ['#000000', '#FFFFFF', '#18181B']
  }
};

export interface ThemeHexColors {
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  borderHex: string;
  cardHex: string;
  canvasHex: string;
}

export const THEME_HEX_MAP: Record<ThemeId, ThemeHexColors> = {
  lavender: {
    primaryHex: '#A89FBB',
    secondaryHex: '#C4BDD0',
    accentHex: '#FAF9F6',
    borderHex: '#A89FBB44',
    cardHex: '#4A4154',
    canvasHex: '#5E5368'
  },
  ocean: {
    primaryHex: '#91A3B0',
    secondaryHex: '#A8C3BC',
    accentHex: '#E0E7E3',
    borderHex: '#91A3B044',
    cardHex: '#3A4C61',
    canvasHex: '#4A607A'
  },
  pine: {
    primaryHex: '#8FA382',
    secondaryHex: '#A2B895',
    accentHex: '#E3D8C8',
    borderHex: '#8FA38244',
    cardHex: '#3C4F44',
    canvasHex: '#2D312E'
  },
  silk: {
    primaryHex: '#DDD3C4',
    secondaryHex: '#EBDCD9',
    accentHex: '#FDFBF7',
    borderHex: '#DDD3C444',
    cardHex: '#AEA397',
    canvasHex: '#5C5248'
  },
  fog: {
    primaryHex: '#C0C8CF',
    secondaryHex: '#D8DEE4',
    accentHex: '#F8FAFC',
    borderHex: '#C0C8CF44',
    cardHex: '#788696',
    canvasHex: '#475569'
  },
  powder_aqua: {
    primaryHex: '#8FBAB2',
    secondaryHex: '#C5E1DC',
    accentHex: '#B8CED6',
    borderHex: '#8FBAB244',
    cardHex: '#B8CED6',
    canvasHex: '#96B3BD'
  },
  rose_blush: {
    primaryHex: '#EBC4C0',
    secondaryHex: '#D9AAA9',
    accentHex: '#FFF9E9',
    borderHex: '#EBC4C044',
    cardHex: '#D9AAA9',
    canvasHex: '#B58A89'
  },
  warm_taupe: {
    primaryHex: '#C8B9A8',
    secondaryHex: '#E5D5C3',
    accentHex: '#FFF9E9',
    borderHex: '#C8B9A844',
    cardHex: '#E5D5C3',
    canvasHex: '#B8A692'
  },
  butter_mustard: {
    primaryHex: '#C7B56B',
    secondaryHex: '#F0E3AE',
    accentHex: '#8B7062',
    borderHex: '#C7B56B44',
    cardHex: '#F0E3AE',
    canvasHex: '#A39252'
  },
  slate_charcoal: {
    primaryHex: '#879DAA',
    secondaryHex: '#3F4841',
    accentHex: '#D9DEDC',
    borderHex: '#879DAA44',
    cardHex: '#3F4841',
    canvasHex: '#2A302B'
  },
  calm: {
    primaryHex: '#8FBAB2',
    secondaryHex: '#AFC8CD',
    accentHex: '#FFF9E9',
    borderHex: '#8FBAB244',
    cardHex: '#E5D5C3',
    canvasHex: '#FFF9E9'
  },
  bw: {
    primaryHex: '#FFFFFF',
    secondaryHex: '#A1A1AA',
    accentHex: '#FFFFFF',
    borderHex: '#FFFFFF44',
    cardHex: '#18181B',
    canvasHex: '#09090B'
  }
};

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const getThemeColors = (themeId: ThemeId | string): ThemeColors => {
  const hex = THEME_HEX_MAP[themeId as ThemeId] || THEME_HEX_MAP['silk'];
  return {
    primary: hex.primaryHex,
    secondary: hex.secondaryHex,
    accent: hex.accentHex
  };
};

export const getThemeHexColors = (themeId: ThemeId): ThemeHexColors => {
  return THEME_HEX_MAP[themeId] || THEME_HEX_MAP['silk'];
};

export const getStoredTheme = (): ThemeId => {
  const saved = localStorage.getItem('nothing-ai_active_theme');
  if (saved && saved in THEMES) return saved as ThemeId;
  return 'silk';
};

export const saveStoredTheme = (themeId: ThemeId) => {
  localStorage.setItem('nothing-ai_active_theme', themeId);
};
