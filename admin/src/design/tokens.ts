/**
 * iTorgo v2.0 - Design System Tokens
 * $10,000 Agency-Tier Design System for Kyrgyzstan Premium Auction Platform
 * 
 * Obsidian Dark Mode + Cyber-Emerald + Laser Amber Luxury Aesthetic
 * Awwwards / FWA / Stripe / Linear Level Quality Standards
 */

// ============================================================================
// COLOR PALETTE - Precise Hex & HSL Tokens
// ============================================================================

export const colors = {
  // === CORE BACKGROUND LAYERS ===
  background: {
    // Deepest obsidian base - the "void"
    void: '#05060A',           // HSL: 240 50% 3%
    base: '#090A0F',           // HSL: 240 40% 4% - Primary canvas
    elevated: '#0D0E14',       // HSL: 240 30% 6% - Cards, modals
    overlay: '#111218',        // HSL: 240 25% 8% - Dropdowns, popovers
    hover: '#16181F',          // HSL: 240 20% 10% - Hover states
    active: '#1C1E26',         // HSL: 240 18% 12% - Active/pressed
  },

  // === SURFACE LAYERS (Glassmorphism) ===
  surface: {
    glass: {
      subtle: 'rgba(255, 255, 255, 0.02)',      // Barely visible
      light: 'rgba(255, 255, 255, 0.03)',       // Standard glass
      medium: 'rgba(255, 255, 255, 0.05)',      // Elevated glass
      strong: 'rgba(255, 255, 255, 0.08)',      // Strong emphasis
      intense: 'rgba(255, 255, 255, 0.12)',     // Maximum glass
    },
    glassDark: {
      subtle: 'rgba(5, 6, 10, 0.6)',
      light: 'rgba(5, 6, 10, 0.7)',
      medium: 'rgba(5, 6, 10, 0.8)',
      strong: 'rgba(5, 6, 10, 0.9)',
    },
    // Solid surfaces
    solid: {
      level1: '#0E0F15',
      level2: '#12131A',
      level3: '#181A21',
      level4: '#1E2029',
    },
  },

  // === BORDERS & DIVIDERS ===
  border: {
    // Laser-etched subtle borders
    hairline: 'rgba(255, 255, 255, 0.04)',
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.08)',
    emphasized: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.18)',
    // Accent borders
    accent: {
      emerald: 'rgba(16, 185, 129, 0.3)',
      amber: 'rgba(245, 158, 11, 0.3)',
      gold: 'rgba(251, 191, 36, 0.4)',
    },
  },

  // === ACCENT COLORS - The Jewel Tones ===
  accent: {
    // Cyber Emerald - Primary action, success, live states
    emerald: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',      // PRIMARY - Live bidding, success, CTAs
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
      950: '#022C1E',
      // Glow variants
      glow: 'rgba(16, 185, 129, 0.4)',
      glowStrong: 'rgba(16, 185, 129, 0.6)',
      glowSubtle: 'rgba(16, 185, 129, 0.15)',
    },

    // Laser Amber - Secondary, warnings, premium highlights
    amber: {
      50: '#FFFAEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',      // PRIMARY - Premium, warnings, next-bid
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      950: '#451A03',
      // Glow variants
      glow: 'rgba(245, 158, 11, 0.4)',
      glowStrong: 'rgba(245, 158, 11, 0.6)',
      glowSubtle: 'rgba(245, 158, 11, 0.15)',
    },

    // Liquid Gold - Ultra-premium, winning states, VIP
    gold: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',      // PRIMARY - Winning, VIP, highlights
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      // Metallic gradients
      gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
      gradientDark: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #92400E 100%)',
      glow: 'rgba(251, 191, 36, 0.4)',
      glowStrong: 'rgba(251, 191, 36, 0.6)',
    },

    // Cyber Blue - Info, trust, verification
    cyan: {
      500: '#06B6D4',
      600: '#0891B2',
      glow: 'rgba(6, 182, 212, 0.4)',
    },

    // Deep Violet - VIP exclusive, rare items
    violet: {
      500: '#8B5CF6',
      600: '#7C3AED',
      glow: 'rgba(139, 92, 246, 0.4)',
    },

    // Alive Red - Outbid alerts, urgency, final call
    alive: {
      500: '#EF4444',
      600: '#DC2626',
      glow: 'rgba(239, 68, 68, 0.4)',
      pulse: 'rgba(239, 68, 68, 0.6)',
    },
  },

  // === TEXT & CONTENT ===
  text: {
    // Primary text hierarchy
    primary: '#FAFAFA',        // HSL: 0 0% 98% - Headlines, primary content
    secondary: '#D4D5D9',      // HSL: 240 5% 83% - Body text
    tertiary: '#A1A2A7',       // HSL: 240 5% 63% - Captions, metadata
    muted: '#717278',          // HSL: 240 5% 46% - Placeholders, disabled
    inverse: '#090A0F',        // On accent backgrounds
    
    // Accent text
    accent: {
      emerald: '#34D399',
      emeraldDim: '#10B981',
      amber: '#FBBF24',
      amberDim: '#F59E0B',
      gold: '#FDE047',
      cyan: '#22D3EE',
      violet: '#A78BFA',
      alive: '#F87171',
    },

    // Status text
    status: {
      live: '#10B981',
      winning: '#FBBF24',
      outbid: '#EF4444',
      finalCall: '#F97316',
      ended: '#717278',
      upcoming: '#06B6D4',
    },
  },

  // === SEMANTIC STATUS COLORS ===
  status: {
    live: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34D399',
      glow: 'rgba(16, 185, 129, 0.4)',
      pulse: 'rgba(16, 185, 129, 0.6)',
    },
    winning: {
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
      text: '#FDE047',
      glow: 'rgba(251, 191, 36, 0.4)',
    },
    outbid: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#F87171',
      glow: 'rgba(239, 68, 68, 0.4)',
      pulse: 'rgba(239, 68, 68, 0.6)',
    },
    finalCall: {
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.3)',
      text: '#FB923C',
      glow: 'rgba(249, 115, 22, 0.4)',
      pulse: 'rgba(249, 115, 22, 0.6)',
    },
    escrow: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: '#22D3EE',
      glow: 'rgba(6, 182, 212, 0.4)',
    },
    vip: {
      bg: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#C4B5FD',
      glow: 'rgba(139, 92, 246, 0.4)',
    },
  },

  // === BANK BRAND COLORS ===
  bank: {
    mbank: {
      primary: '#0052CC',
      light: '#0066FF',
      bg: 'rgba(0, 82, 204, 0.12)',
      border: 'rgba(0, 82, 204, 0.3)',
      text: '#60A5FA',
      glow: 'rgba(0, 82, 204, 0.4)',
    },
    optima: {
      primary: '#E60012',
      light: '#FF1A1A',
      bg: 'rgba(230, 0, 18, 0.12)',
      border: 'rgba(230, 0, 18, 0.3)',
      text: '#F87171',
      glow: 'rgba(230, 0, 18, 0.4)',
    },
    demirbank: {
      primary: '#00A651',
      light: '#00CC66',
      bg: 'rgba(0, 166, 81, 0.12)',
      border: 'rgba(0, 166, 81, 0.3)',
      text: '#34D399',
      glow: 'rgba(0, 166, 81, 0.4)',
    },
  },

  // === GRADIENTS ===
  gradient: {
    // Hero backgrounds
    heroPrimary: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 6, 10, 0) 50%, rgba(245, 158, 11, 0.06) 100%)',
    heroSecondary: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
    heroGlow: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.08) 0%, transparent 60%)',
    
    // Card gradients
    cardPremium: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    cardVip: 'linear-gradient(145deg, rgba(251, 191, 36, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
    cardLive: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 6, 10, 0) 100%)',
    
    // Text gradients
    textGold: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
    textEmerald: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)',
    textPremium: 'linear-gradient(135deg, #FAFAFA 0%, #D4D5D9 50%, #A1A2A7 100%)',
    
    // Border gradients
    borderGold: 'linear-gradient(135deg, rgba(251,191,36,0.4) 0%, rgba(245,158,11,0.2) 50%, rgba(217,119,6,0.4) 100%)',
    borderEmerald: 'linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.2) 50%, rgba(4,120,87,0.4) 100%)',
  },
};

// ============================================================================
// TYPOGRAPHY MATRIX
// ============================================================================

export const typography = {
  // Font families
  fontFamily: {
    // Display - Kinetic headlines, hero text, brand moments
    display: [
      'Geist Display',
      'Space Grotesk',
      'Inter Tight',
      'system-ui',
      'sans-serif',
    ].join(','),
    
    // UI Sans - Body text, UI elements, navigation
    sans: [
      'Geist',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(','),
    
    // Monospace - Financial numbers, bid amounts, timers, code
    mono: [
      'Geist Mono',
      'JetBrains Mono',
      'Fira Code',
      'SF Mono',
      'Monaco',
      'monospace',
    ].join(','),
    
    // Arabic/Cyrillic support for Kyrgyz
    kyrgyz: [
      'Noto Sans Arabic',
      'Noto Sans Cyrillic',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(','),
  },

  // Font sizes - Fluid responsive scale (clamp)
  fontSize: {
    // Display scale - Hero headlines
    'display-4xl': 'clamp(3.5rem, 8vw + 1rem, 7rem)',      // 56px - 112px
    'display-3xl': 'clamp(2.75rem, 6vw + 1rem, 5.5rem)',    // 44px - 88px
    'display-2xl': 'clamp(2.25rem, 5vw + 0.5rem, 4.5rem)',  // 36px - 72px
    'display-xl': 'clamp(1.875rem, 4vw + 0.5rem, 3.5rem)',  // 30px - 56px
    'display-lg': 'clamp(1.5rem, 3vw + 0.5rem, 2.75rem)',   // 24px - 44px
    'display-md': 'clamp(1.25rem, 2.5vw + 0.5rem, 2.25rem)', // 20px - 36px
    'display-sm': 'clamp(1.125rem, 2vw + 0.5rem, 1.75rem)',  // 18px - 28px
    'display-xs': 'clamp(1rem, 1.5vw + 0.5rem, 1.5rem)',     // 16px - 24px

    // Heading scale
    'heading-xl': 'clamp(1.5rem, 2vw + 0.75rem, 2rem)',     // 24px - 32px
    'heading-lg': 'clamp(1.25rem, 1.5vw + 0.75rem, 1.75rem)', // 20px - 28px
    'heading-md': 'clamp(1.125rem, 1vw + 0.75rem, 1.5rem)',  // 18px - 24px
    'heading-sm': 'clamp(1rem, 0.75vw + 0.75rem, 1.25rem)',  // 16px - 20px
    'heading-xs': 'clamp(0.875rem, 0.5vw + 0.75rem, 1.125rem)', // 14px - 18px

    // Body scale
    'body-xl': 'clamp(1.125rem, 0.5vw + 1rem, 1.25rem)',    // 18px - 20px
    'body-lg': 'clamp(1rem, 0.25vw + 0.9rem, 1.125rem)',    // 16px - 18px
    'body-md': 'clamp(0.9375rem, 0.15vw + 0.9rem, 1rem)',   // 15px - 16px
    'body-sm': 'clamp(0.875rem, 0.1vw + 0.85rem, 0.9375rem)', // 14px - 15px
    'body-xs': 'clamp(0.8125rem, 0.05vw + 0.8rem, 0.875rem)', // 13px - 14px

    // Caption & UI
    'caption-lg': '0.8125rem',    // 13px
    'caption-md': '0.75rem',      // 12px
    'caption-sm': '0.6875rem',    // 11px
    'caption-xs': '0.625rem',     // 10px

    // Financial / Tabular numbers
    'finance-xl': 'clamp(2rem, 3vw + 1rem, 3.5rem)',        // 32px - 56px - Hero bid amounts
    'finance-lg': 'clamp(1.5rem, 2vw + 0.75rem, 2.5rem)',   // 24px - 40px - Card bid amounts
    'finance-md': 'clamp(1.125rem, 1vw + 0.75rem, 1.5rem)', // 18px - 24px - List bid amounts
    'finance-sm': 'clamp(1rem, 0.5vw + 0.75rem, 1.25rem)',  // 16px - 20px - Small bid amounts
    'finance-xs': 'clamp(0.875rem, 0.25vw + 0.75rem, 1rem)', // 14px - 16px - Micro amounts
  },

  // Font weights
  fontWeight: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tightest: '-0.05em',
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.04em',
    widest: '0.1em',
    // Tabular numbers
    tabular: '0.02em',
  },
};

// ============================================================================
// SPATIAL SYSTEM & GRID
// ============================================================================

export const spacing = {
  // Base unit: 4px (0.25rem)
  // Scale: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
  
  // Fluid responsive spacing
  fluid: {
    xs: 'clamp(0.5rem, 1vw, 1rem)',
    sm: 'clamp(0.75rem, 1.5vw, 1.5rem)',
    md: 'clamp(1rem, 2vw, 2rem)',
    lg: 'clamp(1.5rem, 3vw, 3rem)',
    xl: 'clamp(2rem, 4vw, 4rem)',
    '2xl': 'clamp(3rem, 6vw, 6rem)',
    '3xl': 'clamp(4rem, 8vw, 8rem)',
  },
};

// ============================================================================
// BORDER RADIUS & SHAPES
// ============================================================================

export const borderRadius = {
  none: '0',
  hairline: '0.125rem',   // 2px
  xs: '0.25rem',          // 4px
  sm: '0.375rem',         // 6px
  md: '0.5rem',           // 8px
  lg: '0.75rem',          // 12px
  xl: '1rem',             // 16px
  '2xl': '1.25rem',       // 20px
  '3xl': '1.5rem',        // 24px
  '4xl': '2rem',          // 32px
  full: '9999px',
  
  // Special shapes
  badge: '0.5rem',        // 8px - Badge pills
  card: '1rem',           // 16px - Standard cards
  cardHover: '1.25rem',   // 20px - Hover expansion
  modal: '1.5rem',        // 24px - Modals, sheets
  fab: '9999px',          // FAB buttons
};

// ============================================================================
// ELEVATION & SHADOWS
// ============================================================================

export const elevation = {
  // === GLASSMORPHISM LAYERS ===
  glass: {
    // Subtle glass depth
    level1: `
      0 1px 2px 0 rgba(0, 0, 0, 0.3),
      0 1px 3px 1px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.03)
    `,
    // Standard glass card
    level2: `
      0 2px 4px -1px rgba(0, 0, 0, 0.4),
      0 4px 6px -1px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.04),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)
    `,
    // Elevated glass
    level3: `
      0 4px 8px -2px rgba(0, 0, 0, 0.5),
      0 8px 16px -2px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.15)
    `,
    // Floating glass (modals, dropdowns)
    level4: `
      0 8px 16px -4px rgba(0, 0, 0, 0.6),
      0 16px 32px -4px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.2)
    `,
    // Maximum glass (toasts, popovers)
    level5: `
      0 12px 24px -6px rgba(0, 0, 0, 0.7),
      0 24px 48px -6px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.08)
    `,
  },

  // === ACCENT GLOW SHADOWS ===
  glow: {
    emerald: {
      sm: '0 0 8px rgba(16, 185, 129, 0.25), 0 0 16px rgba(16, 185, 129, 0.15)',
      md: '0 0 12px rgba(16, 185, 129, 0.35), 0 0 24px rgba(16, 185, 129, 0.2), 0 0 48px rgba(16, 185, 129, 0.1)',
      lg: '0 0 16px rgba(16, 185, 129, 0.4), 0 0 32px rgba(16, 185, 129, 0.25), 0 0 64px rgba(16, 185, 129, 0.15)',
      xl: '0 0 24px rgba(16, 185, 129, 0.5), 0 0 48px rgba(16, 185, 129, 0.3), 0 0 96px rgba(16, 185, 129, 0.2)',
      pulse: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2)',
    },
    amber: {
      sm: '0 0 8px rgba(245, 158, 11, 0.25), 0 0 16px rgba(245, 158, 11, 0.15)',
      md: '0 0 12px rgba(245, 158, 11, 0.35), 0 0 24px rgba(245, 158, 11, 0.2), 0 0 48px rgba(245, 158, 11, 0.1)',
      lg: '0 0 16px rgba(245, 158, 11, 0.4), 0 0 32px rgba(245, 158, 11, 0.25), 0 0 64px rgba(245, 158, 11, 0.15)',
      xl: '0 0 24px rgba(245, 158, 11, 0.5), 0 0 48px rgba(245, 158, 11, 0.3), 0 0 96px rgba(245, 158, 11, 0.2)',
      pulse: '0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.4), 0 0 80px rgba(245, 158, 11, 0.2)',
    },
    gold: {
      sm: '0 0 8px rgba(251, 191, 36, 0.25), 0 0 16px rgba(251, 191, 36, 0.15)',
      md: '0 0 12px rgba(251, 191, 36, 0.35), 0 0 24px rgba(251, 191, 36, 0.2), 0 0 48px rgba(251, 191, 36, 0.1)',
      lg: '0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.25), 0 0 64px rgba(251, 191, 36, 0.15)',
      xl: '0 0 24px rgba(251, 191, 36, 0.5), 0 0 48px rgba(251, 191, 36, 0.3), 0 0 96px rgba(251, 191, 36, 0.2)',
      pulse: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2)',
    },
    alive: {
      pulse: '0 0 16px rgba(239, 68, 68, 0.6), 0 0 32px rgba(239, 68, 68, 0.4), 0 0 64px rgba(239, 68, 68, 0.2)',
    },
  },

  // === LAYERED DEPTH (for z-index stacking) ===
  layer: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    popover: 400,
    toast: 500,
    tooltip: 600,
    loading: 700,
    overlay: 800,
  },
};

// ============================================================================
// MOTION & ANIMATION TOKENS
// ============================================================================

export const motion = {
  // Duration scale (ms)
  duration: {
    instant: 0,
    fastest: 75,
    faster: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
    slowest: 500,
    modal: 350,
    page: 400,
  },

  // Easing curves
  easing: {
    // Standard
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Spring physics (for Framer Motion)
    spring: {
      gentle: { stiffness: 120, damping: 14 },
      smooth: { stiffness: 180, damping: 16 },
      snappy: { stiffness: 260, damping: 20 },
      bouncy: { stiffness: 350, damping: 18 },
      stiff: { stiffness: 500, damping: 25 },
    },
    
    // Custom cubic-beziers for premium feel
    premium: {
      // Apple-style ease-out
      apple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      // Stripe-style sharp
      stripe: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Luxury slow reveal
      luxury: 'cubic-bezier(0.16, 1, 0.3, 1)',
      // Urgent/bid
      urgent: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      // Glass morph
      glass: 'cubic-bezier(0.23, 1, 0.32, 1)',
    },
  },

  // Motion presets
  preset: {
    // Micro-interactions
    buttonPress: { duration: 75, easing: 'easeOut' },
    buttonRelease: { duration: 100, easing: 'spring.gentle' },
    hoverLift: { duration: 150, easing: 'easeOut' },
    hoverGlow: { duration: 200, easing: 'easeOut' },
    
    // State transitions
    bidPulse: { duration: 300, easing: 'premium.urgent' },
    outbidShake: { duration: 400, easing: 'premium.urgent' },
    winningGlow: { duration: 500, easing: 'spring.smooth' },
    countdownTick: { duration: 100, easing: 'easeOut' },
    
    // Panel animations
    slideUp: { duration: 300, easing: 'premium.glass' },
    slideDown: { duration: 250, easing: 'premium.glass' },
    fadeIn: { duration: 200, easing: 'easeOut' },
    fadeOut: { duration: 150, easing: 'easeIn' },
    scaleIn: { duration: 200, easing: 'spring.snappy' },
    scaleOut: { duration: 150, easing: 'spring.stiff' },
    
    // Page transitions
    pageEnter: { duration: 400, easing: 'premium.luxury' },
    pageExit: { duration: 200, easing: 'easeIn' },
  },

  // Reduced motion
  reducedMotion: {
    duration: 0.01,
    easing: 'linear',
  },
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
  loading: 900,
  max: 9999,
};

// ============================================================================
// COMPONENT VARIANTS (Recipe patterns)
// ============================================================================

export const variants = {
  // Button variants
  button: {
    // Primary - Main CTAs, bid buttons
    primary: {
      base: 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
      default: 'bg-gradient-to-r from-gold-500 to-gold-400 text-dark-950 hover:from-gold-400 hover:to-gold-300 shadow-[0_0_12px_rgba(251,191,36,0.4)] hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-[0.98]',
      disabled: 'opacity-50 cursor-not-allowed hover:shadow-none',
    },
    
    // Secondary - Outline, less prominent
    secondary: {
      base: 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
      default: 'bg-white/10 dark:bg-dark-900/80 border border-white/10 dark:border-white/20 text-white hover:bg-white/15 dark:hover:bg-white/10 hover:border-gold-500/30 active:scale-[0.98]',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    
    // Ghost - Minimal, text-only
    ghost: {
      base: 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
      default: 'text-gray-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/5 active:scale-[0.98]',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    
    // Danger - Outbid, delete, cancel
    danger: {
      base: 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
      default: 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:border-red-500/50 hover:text-red-300 active:scale-[0.98]',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    
    // Success - Escrow, verified
    success: {
      base: 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
      default: 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 active:scale-[0.98]',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    
    // Sizes
    size: {
      xs: 'px-2.5 py-1.5 text-caption-md gap-1',
      sm: 'px-3 py-2 text-body-xs gap-1.5',
      md: 'px-4 py-2.5 text-body-sm gap-2',
      lg: 'px-6 py-3 text-body-md gap-2',
      xl: 'px-8 py-4 text-body-lg gap-2.5',
      '2xl': 'px-10 py-5 text-heading-sm gap-3',
    },
  },

  // Card variants
  card: {
    // Standard glass card
    glass: 'bg-white/5 dark:bg-dark-900/60 backdrop-blur-2xl border border-white/10 dark:border-white/10 shadow-glass-level2',
    
    // Premium with subtle gradient
    premium: 'bg-gradient-to-br from-white/5 via-white/3 to-transparent dark:from-dark-900/80 dark:via-dark-900/60 dark:to-dark-950/80 backdrop-blur-2xl border border-white/10 dark:border-white/10 shadow-glass-level2',
    
    // Live auction - emerald accent
    live: 'bg-gradient-to-br from-emerald-500/5 via-white/3 to-transparent dark:from-emerald-500/5 dark:via-dark-900/60 dark:to-dark-950/80 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 shadow-glass-level2 shadow-glow-emerald-sm',
    
    // VIP - gold accent
    vip: 'bg-gradient-to-br from-gold-500/5 via-white/3 to-violet-500/3 dark:from-gold-500/5 dark:via-dark-900/60 dark:to-violet-500/3 dark:to-dark-950/80 backdrop-blur-2xl border border-gold-500/20 dark:border-gold-500/20 shadow-glass-level2 shadow-glow-gold-sm',
    
    // Interactive hover states
    interactive: 'transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:shadow-glass-level3 hover:-translate-y-1',
    interactivePremium: 'transition-all duration-300 hover:border-gold-500/40 dark:hover:border-gold-500/40 hover:shadow-glass-level3 hover:shadow-glow-gold-md hover:-translate-y-1.5',
  },

  // Badge variants
  badge: {
    base: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption-sm font-semibold transition-all duration-200',
    default: 'bg-white/10 dark:bg-dark-900/80 border border-white/10 dark:border-white/10 text-gray-300',
    live: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 animate-pulse-subtle',
    winning: 'bg-gold-500/15 border-gold-500/30 text-gold-400',
    outbid: 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse-urgent',
    finalCall: 'bg-orange-500/15 border-orange-500/30 text-orange-400 animate-pulse-urgent',
    escrow: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    vip: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
    verified: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    new: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
};

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
  motion,
  breakpoints,
  zIndex,
  variants,
};

export default designTokens;