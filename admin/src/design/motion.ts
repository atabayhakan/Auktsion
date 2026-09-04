/**
 * iTorgo v2.0 - Motion & Interaction Specifications
 * $10,000 Agency-Tier Motion Design System
 * 
 * Framer Motion / GSAP / Three.js Implementation Guide
 * Stripe / Linear / Apple / Framer Level Quality Standards
 */

// ============================================================================
// MOTION DESIGN PRINCIPLES
// ============================================================================

/**
 * CORE PHILOSOPHY: "Meaningful Motion"
 * - Every animation serves a purpose: feedback, orientation, hierarchy, delight
 * - Physics-based: spring curves mimic real-world tactility
 * - Performant: 60fps minimum, GPU-accelerated transforms only
 * - Accessible: respects prefers-reduced-motion
 * - Brand-aligned: luxury feel, not playful bounce
 */

export const motionPrinciples = {
  // Timing: Fast enough to feel instant, slow enough to be perceived
  // 100-200ms: Micro-interactions (hover, press)
  // 200-350ms: State transitions (modals, panels, toasts)
  // 350-500ms: Page/section transitions
  // 500ms+: Complex sequences, celebrations
  
  // Easing: Custom cubic-beziers for premium feel
  // NO default 'ease' or 'ease-in-out' - they feel generic
  // Use spring physics for organic feel
  
  // Choreography: Staggered entrances (50-100ms delay per item)
  // Parent before children, meaning before decoration
};

// ============================================================================
// FRAMER MOTION SPRING CONFIGS
// ============================================================================

export const springConfigs = {
  // Gentle - for subtle entrances, fade-ins
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 1,
  } as const,
  
  // Smooth - standard UI transitions (modals, panels, cards)
  smooth: {
    type: 'spring',
    stiffness: 180,
    damping: 16,
    mass: 1,
  } as const,
  
  // Snappy - buttons, toggles, immediate feedback
  snappy: {
    type: 'spring',
    stiffness: 260,
    damping: 20,
    mass: 0.8,
  } as const,
  
  // Bouncy - celebrations, success states, confetti
  bouncy: {
    type: 'spring',
    stiffness: 350,
    damping: 18,
    mass: 0.6,
  } as const,
  
  // Stiff - urgent alerts, outbid notifications, countdown ticks
  stiff: {
    type: 'spring',
    stiffness: 500,
    damping: 25,
    mass: 0.5,
  } as const,
  
  // Magnetic - drag interactions, magnetic buttons
  magnetic: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.7,
  } as const,
  
  // Tilt - 3D card hover effects
  tilt: {
    type: 'spring',
    stiffness: 300,
    damping: 22,
    mass: 0.8,
  } as const,
  
  // Pulse - live indicators, breathing effects
  pulse: {
    type: 'spring',
    stiffness: 100,
    damping: 10,
    mass: 1.2,
  } as const,
};

// ============================================================================
// CUSTOM CUBIC-BEZIER EASINGS (for non-spring animations)
// ============================================================================

export const easings = {
  // Apple-style: slow start, fast middle, slow end
  apple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Stripe-style: sharp, decisive
  stripe: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Luxury: slow reveal, premium feel
  luxury: 'cubic-bezier(0.16, 1, 0.3, 1)',
  
  // Urgent: for bidding, countdown, alerts
  urgent: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Glass morph: smooth, fluid
  glass: 'cubic-bezier(0.23, 1, 0.32, 1)',
  
  // Standard material
  material: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Expressive: for entrances
  expressive: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  
  // Sharp exit
  sharpExit: 'cubic-bezier(0.4, 0, 1, 1)',
};

// ============================================================================
// COMPONENT-SPECIFIC ANIMATION SPECS
// ============================================================================

export const componentAnimations = {
  // ------------------------------------------------------------
  // HERO LIVE AUCTION CARD
  // ------------------------------------------------------------
  heroLiveAuctionCard: {
    // Page entrance
    entrance: {
      container: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: easings.luxury },
      },
      image: {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.8, ease: easings.glass },
      },
      badges: {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.1 },
      },
      price: {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, delay: 0.3, ease: springConfigs.snappy },
      },
      countdown: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.4 },
      },
      bidderStream: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.5 },
      },
    },
    
    // Price update animation (real-time)
    priceUpdate: {
      trigger: 'priceUpdateTrigger',
      animation: {
        scale: [1, 1.05, 1],
        color: ['white', '#FBBF24', 'white'],
      },
      transition: { duration: 0.3, ease: springConfigs.snappy },
      flashOverlay: {
        initial: { opacity: 0 },
        animate: { opacity: 0.15 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      },
    },
    
    // Winning state
    winning: {
      ring: {
        animate: { boxShadow: ['0 0 0 rgba(251,191,36,0)', '0 0 24px rgba(251,191,36,0.6)', '0 0 0 rgba(251,191,36,0)'] },
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      },
      confetti: {
        // See ConfettiCannon component
      },
      badge: {
        animate: { 
          backgroundColor: ['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.3)', 'rgba(251,191,36,0.15)'],
          borderColor: ['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.6)', 'rgba(251,191,36,0.3)'],
        },
        transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    
    // Outbid state
    outbid: {
      ring: {
        animate: { boxShadow: ['0 0 0 rgba(239,68,68,0)', '0 0 24px rgba(239,68,68,0.6)', '0 0 0 rgba(239,68,68,0)'] },
        transition: { duration: 0.8, repeat: 2, ease: springConfigs.stiff },
      },
      shake: {
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.5, ease: springConfigs.stiff },
      },
      toast: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.3, ease: springConfigs.snappy },
      },
    },
    
    // Countdown tick (every second)
    countdownTick: {
      segments: {
        animate: { 
          opacity: [1, 0.5, 1],
          scale: [1, 1.1, 1],
        },
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
      // Critical (< 5 min): pulse urgency
      criticalPulse: {
        animate: { 
          borderColor: ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.8)', 'rgba(239,68,68,0.4)'],
          boxShadow: ['0 0 0 rgba(239,68,68,0)', '0 0 16px rgba(239,68,68,0.4)', '0 0 0 rgba(239,68,68,0)'],
        },
        transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    
    // Live bidder stream
    bidderStream: {
      newBidder: {
        initial: { opacity: 0, x: 50, scale: 0.9 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -50, scale: 0.9 },
        transition: { duration: 0.4, ease: easings.glass },
      },
      currentUserWinning: {
        avatarRing: {
          animate: { scale: [1, 1.2, 1] },
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        },
        checkmark: {
          animate: { scale: [1, 1.3, 1] },
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        },
      },
    },
    
    // Quick bid buttons
    quickBidButton: {
      hover: {
        scale: 1.02,
        y: -2,
        boxShadow: '0 8px 24px -4px rgba(251,191,36,0.3)',
        transition: { duration: 0.2, ease: easings.glass },
      },
      tap: {
        scale: 0.96,
        transition: { duration: 0.075, ease: 'easeOut' },
      },
      focus: {
        boxShadow: '0 0 0 3px rgba(251,191,36,0.4)',
      },
    },
  },
  
  // ------------------------------------------------------------
  // BENTO LOT GRID CARD
  // ------------------------------------------------------------
  bentoLotCard: {
    // Staggered grid entrance
    entrance: {
      initial: { opacity: 0, y: 30, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { 
        duration: 0.5, 
        delay: (index: number) => Math.min(index * 0.05, 0.3),
        ease: easings.luxury,
      },
    },
    
    // 3D Hover Tilt
    hoverTilt: {
      rotateX: (x: number) => (x - 0.5) * 4, // -2deg to 2deg
      rotateY: (y: number) => (y - 0.5) * -4,
      transition: { duration: 0.3, ease: springConfigs.tilt },
      transformPerspective: 1000,
      transformStyle: 'preserve-3d',
    },
    
    // Image hover zoom
    imageZoom: {
      initial: { scale: 1 },
      hover: { scale: 1.05 },
      transition: { duration: 0.7, ease: easings.glass },
    },
    
    // Price flash on real-time update
    priceFlash: {
      initial: { opacity: 0 },
      animate: { opacity: 0.15 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 },
      background: 'radial-gradient(circle at center, var(--flash-color) 0%, transparent 70%)',
    },
    
    // Badge animations
    badges: {
      livePulse: {
        animate: { 
          scale: [1, 1.3, 1],
          opacity: [1, 0.5, 1],
        },
        transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
      },
      urgentPulse: {
        animate: { 
          opacity: [1, 0.2, 1],
          scale: [1, 1.02, 1],
        },
        transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    
    // Quick actions reveal
    quickActions: {
      initial: { opacity: 0, y: 10, height: 0 },
      animate: { opacity: 1, y: 0, height: 'auto' },
      exit: { opacity: 0, y: -10, height: 0 },
      transition: { duration: 0.3, ease: easings.glass },
    },
    
    // Watch/Share buttons
    actionButton: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.2, delay: 0.05 },
      hover: {
        scale: 1.1,
        rotate: 5,
        transition: { duration: 0.2, ease: springConfigs.bouncy },
      },
      tap: { scale: 0.9 },
    },
    
    // Toast notifications
    toast: {
      outbid: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.3, ease: springConfigs.snappy },
        autoDismiss: 3000,
      },
      winning: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.3, ease: springConfigs.bouncy },
        autoDismiss: 3000,
      },
    },
  },
  
  // ------------------------------------------------------------
  // LANDING PAGE SECTIONS
  // ------------------------------------------------------------
  landingPage: {
    // Section scroll reveal (IntersectionObserver)
    sectionReveal: {
      initial: { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-100px' },
      transition: { duration: 0.5, ease: easings.luxury },
    },
    
    // Staggered children
    staggerChildren: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, delay: (index: number) => index * 0.1 },
    },
    
    // Hero section
    hero: {
      badge: { delay: 0.1 },
      headline: { delay: 0.2 },
      subheadline: { delay: 0.3 },
      ctaPrimary: { delay: 0.4 },
      ctaSecondary: { delay: 0.5 },
      stats: { delay: 0.6 },
    },
    
    // Category stories (horizontal scroll)
    categoryStories: {
      container: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.1 },
      },
      items: {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, delay: (index: number) => 0.1 + index * 0.05 },
      },
      hover: {
        scale: 1.05,
        transition: { duration: 0.3, ease: easings.glass },
      },
    },
    
    // Bento grid
    bentoGrid: {
      container: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.2 },
      },
      cards: {
        // Handled by BentoLotCard entrance
      },
    },
    
    // Category shelves
    categoryShelf: {
      header: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      },
      grid: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.1 },
      },
    },
    
    // How it works steps
    howItWorks: {
      container: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      },
      steps: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: (index: number) => 0.1 * index },
      },
      hover: {
        // Background glow reveal
        glow: {
          initial: { opacity: 0 },
          hover: { opacity: 1 },
          transition: { duration: 0.5 },
        },
      },
    },
    
    // Trust signals
    trustSignals: {
      items: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: (index: number) => 0.1 * index },
      },
      hover: {
        scale: 1.02,
        y: -4,
        borderColor: 'rgba(251,191,36,0.4)',
        boxShadow: '0 12px 32px -8px rgba(251,191,36,0.2)',
        transition: { duration: 0.3, ease: easings.glass },
      },
    },
    
    // Sell/VIP section
    sellSection: {
      container: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: 0.2 },
      },
      backgroundGlow: {
        animate: { 
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        },
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      },
      stats: {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, delay: (index: number) => 0.4 + index * 0.1 },
      },
    },
    
    // Testimonials
    testimonials: {
      header: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      },
      cards: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: (index: number) => 0.1 * index },
      },
      hover: {
        y: -8,
        borderColor: 'rgba(251,191,36,0.4)',
        boxShadow: '0 20px 48px -12px rgba(251,191,36,0.15)',
        transition: { duration: 0.3, ease: easings.glass },
      },
    },
    
    // Bank partners
    bankPartners: {
      header: { delay: 0 },
      cards: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: (index: number) => 0.1 * index },
      },
      hover: {
        y: -4,
        borderColor: 'rgba(251,191,36,0.4)',
        transition: { duration: 0.3, ease: easings.glass },
      },
    },
    
    // Footer ticker
    footerTicker: {
      marquee: {
        animate: { x: ['0%', '-50%'] },
        transition: { duration: 30, repeat: Infinity, ease: 'linear' },
      },
    },
  },
  
  // ------------------------------------------------------------
  // NAVIGATION / HEADER
  // ------------------------------------------------------------
  navigation: {
    // Logo
    logo: {
      hover: {
        scale: 1.05,
        transition: { duration: 0.3, ease: springConfigs.bouncy },
      },
      pulse: {
        animate: { 
          scale: [1, 1.15, 1],
          boxShadow: ['0 0 0 rgba(16,185,129,0.4)', '0 0 16px rgba(16,185,129,0.6)', '0 0 0 rgba(16,185,129,0.4)'],
        },
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    
    // Search input
    search: {
      focus: {
        borderColor: 'rgba(251,191,36,0.6)',
        boxShadow: '0 0 0 3px rgba(251,191,36,0.2)',
        transition: { duration: 0.2, ease: easings.glass },
      },
    },
    
    // Live ticker
    liveTicker: {
      pulse: {
        animate: { scale: [1, 1.2, 1] },
        transition: { duration: 1, repeat: Infinity },
      },
    },
    
    // Buttons
    button: {
      primary: {
        hover: {
          y: -2,
          boxShadow: '0 8px 24px -4px rgba(251,191,36,0.4)',
          transition: { duration: 0.2, ease: easings.glass },
        },
        tap: { scale: 0.98 },
        focus: { boxShadow: '0 0 0 3px rgba(251,191,36,0.4)' },
      },
      secondary: {
        hover: {
          borderColor: 'rgba(251,191,36,0.4)',
          backgroundColor: 'rgba(255,255,255,0.1)',
          transition: { duration: 0.2, ease: easings.glass },
        },
        tap: { scale: 0.98 },
      },
      ghost: {
        hover: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          transition: { duration: 0.2, ease: easings.glass },
        },
        tap: { scale: 0.98 },
      },
    },
  },
  
  // ------------------------------------------------------------
  // MODALS / DRAWERS / TOASTS
  // ------------------------------------------------------------
  overlays: {
    // Modal
    modal: {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: easings.sharpExit },
      },
      content: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.35, ease: springConfigs.smooth },
      },
    },
    
    // Drawer (bottom sheet)
    drawer: {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      },
      content: {
        initial: { opacity: 0, y: '100%' },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
        transition: { duration: 0.4, ease: springConfigs.smooth },
      },
    },
    
    // Toast
    toast: {
      enter: {
        initial: { opacity: 0, x: 100, scale: 0.95 },
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { duration: 0.3, ease: springConfigs.snappy },
      },
      exit: {
        opacity: 0,
        x: 100,
        scale: 0.95,
        transition: { duration: 0.2, ease: easings.sharpExit },
      },
      progress: {
        initial: { width: '100%' },
        animate: { width: '0%' },
        transition: { duration: 5000, ease: 'linear' },
      },
    },
  },
  
  // ------------------------------------------------------------
  // FORM ELEMENTS
  // ------------------------------------------------------------
  forms: {
    input: {
      focus: {
        borderColor: 'rgba(251,191,36,0.6)',
        boxShadow: '0 0 0 3px rgba(251,191,36,0.15)',
        transition: { duration: 0.2, ease: easings.glass },
      },
      error: {
        borderColor: 'rgba(239,68,68,0.6)',
        boxShadow: '0 0 0 3px rgba(239,68,68,0.15)',
        animation: { x: [-4, 4, -4, 4, 0] }, // shake
        transition: { duration: 0.4, ease: springConfigs.stiff },
      },
    },
    
    checkbox: {
      check: {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { duration: 0.2, ease: springConfigs.bouncy },
      },
      uncheck: {
        scale: 0,
        rotate: 180,
        transition: { duration: 0.15, ease: easings.sharpExit },
      },
    },
    
    radio: {
      select: {
        initial: { scale: 0 },
        animate: { scale: 1 },
        transition: { duration: 0.2, ease: springConfigs.bouncy },
      },
    },
    
    select: {
      open: {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2, ease: easings.glass },
      },
    },
  },
  
  // ------------------------------------------------------------
  // DATA VISUALIZATION / CHARTS
  // ------------------------------------------------------------
  charts: {
    // Bid history chart
    bidHistory: {
      line: {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: { duration: 1, ease: easings.luxury },
      },
      points: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.3, delay: (index: number) => index * 0.05, ease: springConfigs.bouncy },
      },
      hover: {
        scale: 2,
        transition: { duration: 0.15, ease: springConfigs.snappy },
      },
    },
    
    // Price progression
    priceProgression: {
      bars: {
        initial: { height: 0 },
        animate: { height: 'var(--bar-height)' },
        transition: { duration: 0.5, delay: (index: number) => index * 0.03, ease: springConfigs.smooth },
      },
    },
  },
};

// ============================================================================
// SOUND DESIGN SPECIFICATIONS
// ============================================================================

/**
 * AUDIO CUES - Subtle, premium, non-intrusive
 * All sounds should be < 200ms, Web Audio API generated
 * Respect user preferences (mute toggle, system volume)
 */

export const soundDesign = {
  // Format: Web Audio API synthesized (no file dependencies)
  // Frequencies chosen for premium feel (pentatonic, major chords)
  
  // Bid placed (success)
  bidPlaced: {
    type: 'synth',
    oscillator: 'sine',
    frequency: [523.25, 659.25, 783.99], // C5, E5, G5 (C major triad)
    duration: 0.15,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
    gain: 0.15,
    stagger: 0.05,
  },
  
  // Outbid (alert - minor key)
  outbid: {
    type: 'synth',
    oscillator: 'triangle',
    frequency: [466.16, 392.00], // A#4, G4 (descending minor third)
    duration: 0.3,
    envelope: { attack: 0.02, decay: 0.2, sustain: 0, release: 0.1 },
    gain: 0.12,
  },
  
  // Winning (celebration - ascending major)
  winning: {
    type: 'synth',
    oscillator: 'sine',
    frequency: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
    duration: 0.5,
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
    gain: 0.18,
    stagger: 0.08,
  },
  
  // Final call (urgency - repeating)
  finalCall: {
    type: 'synth',
    oscillator: 'square',
    frequency: 880.00, // A5
    duration: 0.1,
    repeat: 3,
    interval: 0.15,
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.02 },
    gain: 0.1,
  },
  
  // Countdown tick (subtle)
  countdownTick: {
    type: 'click',
    frequency: 2000,
    duration: 0.01,
    gain: 0.05,
  },
  
  // Button press (tactile)
  buttonPress: {
    type: 'click',
    frequency: 800,
    duration: 0.02,
    gain: 0.04,
  },
  
  // Button release
  buttonRelease: {
    type: 'click',
    frequency: 1200,
    duration: 0.015,
    gain: 0.03,
  },
  
  // Toast appear
  toastAppear: {
    type: 'synth',
    oscillator: 'sine',
    frequency: 880,
    duration: 0.1,
    envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 },
    gain: 0.08,
  },
  
  // Modal open
  modalOpen: {
    type: 'synth',
    oscillator: 'sine',
    frequency: [440, 554.37], // A4, C#5
    duration: 0.2,
    envelope: { attack: 0.02, decay: 0.15, sustain: 0, release: 0.05 },
    gain: 0.1,
    stagger: 0.05,
  },
  
  // Modal close
  modalClose: {
    type: 'synth',
    oscillator: 'sine',
    frequency: [554.37, 440], // Descending
    duration: 0.15,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
    gain: 0.08,
    stagger: 0.05,
  },
  
  // Success/Verification
  verified: {
    type: 'synth',
    oscillator: 'sine',
    frequency: [659.25, 880, 1046.50], // E5, A5, C6
    duration: 0.4,
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
    gain: 0.15,
    stagger: 0.06,
  },
  
  // Error
  error: {
    type: 'synth',
    oscillator: 'sawtooth',
    frequency: [349.23, 329.63], // F4, E4
    duration: 0.25,
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
    gain: 0.1,
  },
};

// Sound context manager (singleton)
export const soundContext = {
  context: null as AudioContext | null,
  masterGain: null as GainNode | null,
  enabled: true,
  volume: 0.5,
  
  init() {
    if (typeof window !== 'undefined' && !this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
      this.masterGain.gain.value = this.volume
    }
  },
  
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  },
  
  toggle() {
    this.enabled = !this.enabled
  },
  
  play(sound: keyof typeof soundDesign) {
    if (!this.enabled || !this.context) return
    
    const config = soundDesign[sound]
    if (!config) return
    
    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
    
    // Implementation would use Web Audio API
    // This is a specification - actual implementation in composable
  },
};

// ============================================================================
// HAPTIC FEEDBACK SPECIFICATIONS
// ============================================================================

/**
 * VIBRATION PATTERNS - For mobile devices with Vibration API
 * Subtle, meaningful, not annoying
 */

export const haptics = {
  // Light tap - button press
  light: [10],
  
  // Medium tap - successful action
  medium: [20],
  
  // Heavy tap - important action (bid placed)
  heavy: [30, 20, 30],
  
  // Success pattern - winning bid
  success: [20, 30, 20, 30, 40],
  
  // Warning pattern - outbid
  warning: [50, 50, 50],
  
  // Error pattern
  error: [100, 50, 100],
  
  // Countdown urgency (final 30 seconds)
  urgency: [30, 30, 30, 30, 30],
  
  // Selection change (tabs, filters)
  selection: [8],
  
  // Modal open
  modalOpen: [15, 10, 15],
  
  // Pull to refresh
  pullRefresh: [20, 40, 20],
};

// Haptic manager
export const hapticManager = {
  enabled: true,
  
  vibrate(pattern: number[]) {
    if (!this.enabled) return
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  },
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  },
  
  // Convenience methods
  light() { this.vibrate(haptics.light) },
  medium() { this.vibrate(haptics.medium) },
  heavy() { this.vibrate(haptics.heavy) },
  success() { this.vibrate(haptics.success) },
  warning() { this.vibrate(haptics.warning) },
  error() { this.vibrate(haptics.error) },
  urgency() { this.vibrate(haptics.urgency) },
  selection() { this.vibrate(haptics.selection) },
  modalOpen() { this.vibrate(haptics.modalOpen) },
  pullRefresh() { this.vibrate(haptics.pullRefresh) },
};



// ============================================================================
// REDUCED MOTION HANDLING
// ============================================================================

export const reducedMotion = {
  // Check user preference
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Get appropriate config
  getConfig<T>(normal: T, reduced: T): T {
    return this.prefersReducedMotion() ? reduced : normal
  },
  
  // Reduced motion variants
  variants: {
    spring: { duration: 0.01, ease: 'linear' } as const,
    transition: { duration: 0.01, ease: 'linear' } as const,
    keyframes: { duration: 0.01, ease: 'linear' } as const,
  },
  
  // Disable these entirely in reduced motion
  disableInReducedMotion: [
    'parallax',
    'complexSequences',
    'autoPlayingAnimations',
    'infiniteLoops',
    'particleSystems',
    'confetti',
    'marquee',
    'backgroundGlowPulse',
  ],
  
  // Keep these (essential for UX)
  keepInReducedMotion: [
    'stateTransitions',
    'focusIndicators',
    'loadingStates',
    'errorShake',
    'toastEnterExit',
    'modalEnterExit',
  ],
};

// ============================================================================
// PERFORMANCE BUDGETS
// ============================================================================

export const performanceBudgets = {
  // Target metrics
  targets: {
    // Animation frame budget
    frameBudget: 16.67, // ms (60fps)
    
    // JS execution per frame
    jsBudget: 8, // ms
    
    // Style recalculation
    styleBudget: 2, // ms
    
    // Layout
    layoutBudget: 2, // ms
    
    // Paint
    paintBudget: 4, // ms
    
    // Composite
    compositeBudget: 1, // ms
  },
  
  // Optimization rules
  rules: {
    // Only animate transform and opacity
    animatedProperties: ['transform', 'opacity', 'filter'],
    
    // Use will-change sparingly
    willChange: 'auto', // Set via JS before animation, remove after
    
    // Layer promotion criteria
    promoteToLayer: [
      'elements animating transform/opacity frequently',
      'fixed/sticky positioned elements',
      'elements with complex filters',
    ],
    
    // Avoid layout thrashing
    avoid: [
      'animating width/height/top/left/margin/padding',
      'forcing layout in animation loops',
      'reading layout in animation frames',
    ],
  },
  
  // Monitoring
  monitoring: {
    // Use PerformanceObserver for real-time metrics
    entryTypes: ['frame', 'longtask', 'layout-shift'],
    
    // Warning thresholds
    warningThresholds: {
      fps: 55, // Warn if average FPS drops below 55
      longTask: 50, // ms
      cls: 0.1, // Cumulative Layout Shift
    },
  },
};

// ============================================================================
// IMPLEMENTATION UTILITIES
// ============================================================================

// Framer Motion variants factory
export function createVariants(config: {
  entrance?: any
  hover?: any
  tap?: any
  focus?: any
  exit?: any
}) {
  return {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    whileHover: 'hover',
    whileTap: 'tap',
    whileFocus: 'focus',
    variants: {
      initial: config.entrance?.initial || { opacity: 0, y: 20 },
      animate: config.entrance?.animate || { opacity: 1, y: 0 },
      exit: config.exit || { opacity: 0, y: -20 },
      hover: config.hover || { scale: 1.02 },
      tap: config.tap || { scale: 0.98 },
      focus: config.focus || { boxShadow: '0 0 0 3px rgba(251,191,36,0.4)' },
    },
  }
}

// Stagger children helper
export function staggerChildren(delay: number = 0.1, startDelay: number = 0) {
  return {
    animate: {
      transition: {
        staggerChildren: delay,
        delayChildren: startDelay,
      },
    },
  }
}

// Intersection Observer hook config
export const scrollRevealConfig = {
  rootMargin: '-10% 0px -10% 0px',
  threshold: 0.1,
  triggerOnce: true,
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const motionSystem = {
  principles: motionPrinciples,
  springs: springConfigs,
  easings,
  components: componentAnimations,
  sounds: soundDesign,
  soundContext,
  haptics,
  hapticManager,
  reducedMotion,
  performanceBudgets,
  utils: {
    createVariants,
    staggerChildren,
    scrollRevealConfig,
  },
}

export default motionSystem