# UI Aesthetic Guide: Retro-Futuristic Oscilloscope

This document defines the visual design language for the Physics Art Engine frontend, inspired by vintage oscilloscopes, Fallout's Pip-Boy, and retro-futuristic interfaces.

## Design Philosophy

**Core Aesthetic:** "1950s-60s analog instrumentation reimagined for the digital age"

Think:
- Vintage oscilloscope CRT displays (green phosphor glow)
- Fallout Pip-Boy interfaces (chunky tactile controls, monochrome displays)
- Retrofuturism (analog dials meet digital precision)
- Scientific instruments (minimalist, functional, precise)

## Color Palette

### Primary Colors

```css
/* Phosphor Green (Primary Display) */
--phosphor-green: #0F0;         /* rgb(0, 255, 0) */
--phosphor-green-dim: #0A0;     /* rgb(0, 170, 0) */
--phosphor-green-bright: #4F4;  /* rgb(68, 255, 68) */
--phosphor-glow: #0F0;          /* Used for glow/bloom effects */

/* Background (CRT Black) */
--crt-black: #0a0a0a;           /* Near-black display background */
--crt-dark: #050505;            /* Deeper blacks */

/* Interface (Metal/Bezel) */
--metal-dark: #1a1a1a;          /* Dark metal casing */
--metal-medium: #2a2a2a;        /* Medium metal highlights */
--metal-light: #3a3a3a;         /* Light metal edges */

/* Amber Accents (Secondary Display Color) */
--amber: #ffb000;               /* Warm amber for warnings */
--amber-dim: #cc8800;           /* Dimmed amber */
```

### Fallout Pip-Boy Variant (Alternative Palette)

```css
/* Monochrome Green */
--pipboy-green: #00ff41;        /* Pip-Boy characteristic green */
--pipboy-dark: #001a0f;         /* Dark background */
--pipboy-text: #20c20e;         /* Text green */
--pipboy-highlight: #8fff00;    /* Bright highlights */
```

## Typography

### Fonts

```css
/* Monospace for Data/Numbers */
--font-mono: 'IBM Plex Mono', 'Courier New', monospace;
--font-display: 'Share Tech Mono', monospace;  /* Retro tech font */

/* Use monospace for:**
- Numerical readouts
- Data tables
- Code-like displays
- Frame counters
```

### Type Scale

```css
--text-xs: 10px;    /* Small labels */
--text-sm: 12px;    /* Body text */
--text-base: 14px;  /* Default */
--text-lg: 18px;    /* Section headers */
--text-xl: 24px;    /* Display numbers */
--text-2xl: 36px;   /* Large display */
```

## Component Styling

### Buttons (Tactile Switches)

```css
.button-retro {
  background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
  border: 2px outset #2a2a2a;
  border-radius: 2px;  /* Sharp, not rounded */
  color: var(--phosphor-green);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 16px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.button-retro:active {
  border-style: inset;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  transform: translateY(1px);
}

.button-retro:hover {
  background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
  color: var(--phosphor-green-bright);
  text-shadow: 0 0 8px var(--phosphor-glow);
}
```

### Display Panels (CRT Screen)

```css
.display-panel {
  background: var(--crt-black);
  border: 8px solid var(--metal-dark);
  border-radius: 8px;
  box-shadow:
    inset 0 0 60px rgba(0, 255, 0, 0.05),  /* Inner glow */
    inset 0 0 20px rgba(0, 255, 0, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.8);         /* Deep shadow */
  padding: 24px;
  position: relative;
}

/* Scanlines effect */
.display-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* CRT curve (subtle) */
.display-panel {
  clip-path: inset(0 round 8px);
}
```

### Knobs and Dials

```css
.dial {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%);
  border: 3px solid #0a0a0a;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  cursor: pointer;
}

.dial::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 2px;
  height: 16px;
  background: var(--phosphor-green);
  transform: translateX(-50%) rotate(var(--rotation));
  box-shadow: 0 0 4px var(--phosphor-glow);
}

.dial-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--phosphor-green-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
}
```

### Meters and Gauges

```css
.meter {
  width: 200px;
  height: 40px;
  background: var(--crt-dark);
  border: 2px solid var(--metal-medium);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg,
    var(--phosphor-green-dim) 0%,
    var(--phosphor-green) 100%);
  box-shadow: 0 0 10px var(--phosphor-glow);
  transition: width 0.2s ease;
}

.meter-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--crt-black);
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
  mix-blend-mode: difference;
}
```

### Input Fields

```css
.input-retro {
  background: var(--crt-dark);
  border: 2px inset var(--metal-medium);
  border-radius: 2px;
  color: var(--phosphor-green);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  padding: 8px 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.input-retro:focus {
  outline: none;
  border-color: var(--phosphor-green);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 8px var(--phosphor-glow);
}

.input-retro::placeholder {
  color: var(--phosphor-green-dim);
  opacity: 0.5;
}
```

### Labels and Text

```css
.label-retro {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--phosphor-green-dim);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 4px;
}

.value-display {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--phosphor-green);
  text-shadow: 0 0 8px var(--phosphor-glow);
  letter-spacing: 2px;
}

/* Blinking cursor for active displays */
.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

## Visual Effects

### Phosphor Glow

```css
.glow {
  filter: 
    drop-shadow(0 0 2px var(--phosphor-green))
    drop-shadow(0 0 4px var(--phosphor-green))
    drop-shadow(0 0 8px var(--phosphor-glow));
}

.glow-strong {
  filter:
    drop-shadow(0 0 4px var(--phosphor-green))
    drop-shadow(0 0 8px var(--phosphor-green))
    drop-shadow(0 0 16px var(--phosphor-glow));
}
```

### CRT Flicker

```css
@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.98; }
}

.crt-flicker {
  animation: flicker 0.15s infinite;
}
```

### Scanlines

```css
.scanlines {
  position: relative;
  overflow: hidden;
}

.scanlines::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  z-index: 10;
}
```

### CRT Bloom

```css
.bloom {
  position: relative;
  filter: blur(0.5px) brightness(1.1);
}

.bloom::after {
  content: '';
  position: absolute;
  top: -5%;
  left: -5%;
  right: -5%;
  bottom: -5%;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 255, 0, 0.2) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

## Three.js Oscilloscope Styling

### Waveform Mode

```typescript
const material = new THREE.LineBasicMaterial({
  color: 0x00ff00,  // Phosphor green
  linewidth: 2,
  transparent: true,
  opacity: 0.8
});

// Add bloom post-processing
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // Strength
  0.4,  // Radius
  0.85  // Threshold
);
```

### Vector Scope Mode (Lissajous)

```typescript
const material = new THREE.PointsMaterial({
  color: 0x00ff00,
  size: 2,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending  // Additive for glow effect
});

// Leave trails (persistence of vision)
renderer.autoClear = false;
renderer.setClearColor(0x0a0a0a, 0.05);  // Slow fade
```

## Layout Patterns

### Control Panel Layout

```
┌─────────────────────────────────────────┐
│  PHYSICS ART ENGINE v1.0                │
├───────────┬─────────────────────────────┤
│           │                             │
│  PARAMS   │     OSCILLOSCOPE DISPLAY    │
│           │                             │
│  ○ STEPS  │     [Waveform Viz]          │
│  ○ SEED   │                             │
│  ○ PARTS  │                             │
│           │                             │
│  [START]  │     [Vector Scope]          │
│  [RESET]  │                             │
│           │                             │
│  STATUS:  │                             │
│  RUNNING  │                             │
│           │                             │
└───────────┴─────────────────────────────┘
```

**Key principles:**
- Left sidebar: Controls and status
- Main area: Oscilloscope display (80% of space)
- Top bar: System info and mode switches
- Bottom: Frame counter, FPS, stats

## Component Library Choice

### Why NOT Ant Design for This Project

Ant Design is excellent for enterprise dashboards, but **not ideal** for a retro aesthetic:
- ❌ Modern, polished look (opposite of retro)
- ❌ Rounded corners, shadows designed for modern UIs
- ❌ Hard to customize to look vintage
- ❌ Might fight against our custom styling

### Better Options

#### Option 1: Custom Components (Recommended)

Build from scratch with:
- Raw HTML + CSS
- Styled-components or CSS modules
- Full control over retro aesthetic

**Pros:**
- ✅ Complete design freedom
- ✅ Learn React component patterns
- ✅ Exactly matches vision
- ✅ Lightweight (no unnecessary code)

**Cons:**
- ❌ More work upfront
- ❌ Need to implement accessibility
- ❌ No pre-built complex components

#### Option 2: Minimal UI Library + Heavy Customization

Use a minimal library as foundation:
- [Headless UI](https://headlessui.com/) - Unstyled, accessible components
- [Radix UI](https://www.radix-ui.com/) - Unstyled primitives
- [React Aria](https://react-spectrum.adobe.com/react-aria/) - Hooks for accessibility

Then style completely custom to match retro aesthetic.

**Pros:**
- ✅ Accessibility handled
- ✅ Complex interactions (modals, dropdowns) solved
- ✅ Style complete freedom

**Cons:**
- ❌ Still need to write all visual styles

### Recommendation: Custom Components

For this project, **build custom** because:
1. Learning goal - understand component patterns
2. Unique aesthetic - libraries will fight us
3. Not many components needed - just controls and display
4. Performance - no bloat from unused components

## Example: Complete Button Component

```typescript
// RetroButton.tsx
import styled from 'styled-components';

const StyledButton = styled.button`
  background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
  border: 2px outset #2a2a2a;
  border-radius: 2px;
  color: #0F0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.1s;
  
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.5);
  
  &:hover {
    background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
    color: #4F4;
    text-shadow: 0 0 8px #0F0;
  }
  
  &:active {
    border-style: inset;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    transform: translateY(1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface RetroButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  onClick,
  disabled
}) => {
  return (
    <StyledButton onClick={onClick} disabled={disabled}>
      {children}
    </StyledButton>
  );
};
```

## Animation Principles

**Keep it mechanical and analog:**
- ✅ Instant state changes (switches flip, not fade)
- ✅ Easing should feel physical (spring, bounce)
- ✅ Persistence of vision (trails fade slowly)
- ❌ No smooth modern fades
- ❌ No elastic/bouncy animations
- ❌ No CSS transitions for instant things (clicks)

```css
/* Good: Instant switch */
.switch:active {
  transform: translateY(2px);
  transition: none;  /* Instant */
}

/* Good: Physical dial rotation */
.dial {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Bad: Smooth modern fade */
.button {
  transition: opacity 0.3s ease;  /* Too smooth, too modern */
}
```

## Sound Design (Future)

To complete the retro aesthetic:
- ✅ Click/clack sounds for buttons
- ✅ Whir/hum for processing
- ✅ Beep for completion
- ✅ Static/interference for errors
- ❌ No smooth electronic sounds
- ❌ No modern UI "swoosh" sounds

## Accessibility

**Don't sacrifice accessibility for aesthetics:**
- ✅ Sufficient contrast (green on black passes WCAG AA)
- ✅ Keyboard navigation
- ✅ Screen reader labels
- ✅ Focus indicators (maybe a bright green outline)
- ✅ Alternative text for data visualizations

## Summary

**Design Language:**
- Vintage oscilloscope CRT displays
- Fallout Pip-Boy chunky controls
- Monochrome phosphor green on black
- Sharp edges, tactile buttons
- Scientific precision

**Component Library:**
- Build custom (full control, learning)
- Or use Headless UI + custom styles
- Avoid Ant Design (too modern)

**Key Visual Elements:**
- Scanlines and CRT effects
- Phosphor glow on text and lines
- Physical button presses
- Analog dials and meters
- Monospace fonts

This aesthetic should feel like you're operating a piece of 1960s lab equipment that's been preserved in a post-apocalyptic bunker.
