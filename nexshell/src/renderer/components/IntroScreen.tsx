import { useState } from 'react';
import type { CSSProperties, FC } from 'react';
import { CommandGrid } from './CommandGrid';
import type { CommandGridVariant } from '../../types/commands';
import { ColorTokens } from '../theme/tokens';
import logoBmp from '../../nexshell-logo.bmp';
import '../styles/intro-animations.css';

interface IntroScreenProps {
  variant?: CommandGridVariant;
  onRequestEnter?: () => void;
}

// Modern minimal container with panning gradient
const containerStyle: CSSProperties = {
  width: 'min(800px, 90vw)',
  maxHeight: '85vh',
  padding: '3rem 2.5rem',
  background: 'rgba(3, 3, 5, 0.85)',
  backdropFilter: 'blur(30px) saturate(180%)',
  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
  borderRadius: '1rem',
  border: '1px solid rgba(57, 255, 20, 0.1)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2.5rem',
  overflow: 'auto',
  color: '#ffffff',
  position: 'relative',
  isolation: 'isolate'
};

// Animated gradient background
const gradientOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: '1rem',
  background: 'linear-gradient(135deg, rgba(30, 144, 255, 0.08) 0%, rgba(57, 255, 20, 0.05) 50%, rgba(30, 144, 255, 0.08) 100%)',
  backgroundSize: '200% 200%',
  animation: 'gradientPan 8s ease infinite',
  pointerEvents: 'none',
  zIndex: 0,
  opacity: 0.6
};

// Logo - minimal, clean
const logoStyle: CSSProperties = {
  display: 'block',
  maxWidth: 'min(80vw, 240px)',
  height: 'auto',
  margin: '0 auto',
  borderRadius: '0.5rem',
  filter: 'drop-shadow(0 0 30px rgba(57, 255, 20, 0.2))',
  position: 'relative',
  zIndex: 1
};

// Title section - ultra minimal
const titleContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1
};

const titleStyle: CSSProperties = {
  fontSize: '2.5rem',
  margin: 0,
  fontWeight: 600,
  color: '#ffffff',
  letterSpacing: '-0.02em',
  background: `linear-gradient(135deg, ${ColorTokens.nexshellBlue} 0%, ${ColorTokens.connectorNeon} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  opacity: 0.6,
  fontWeight: 400,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#ffffff'
};

// Description - minimal text
const descriptionStyle: CSSProperties = {
  maxWidth: '600px',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  opacity: 0.8,
  fontWeight: 300,
  margin: '0 auto',
  textAlign: 'center',
  color: '#e5e5e5',
  padding: 0,
  position: 'relative',
  zIndex: 1
};

// Grid container
const gridContainerStyle: CSSProperties = {
  width: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem 0',
  minHeight: 0,
  position: 'relative',
  zIndex: 1
};

// Modern minimal CTA
const ctaBaseStyle: CSSProperties = {
  border: '1px solid rgba(57, 255, 20, 0.2)',
  borderRadius: '0.5rem',
  padding: '0.875rem 2rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.1em',
  background: 'rgba(57, 255, 20, 0.05)',
  color: ColorTokens.connectorNeon,
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  fontFamily: 'inherit',
  margin: '0 auto',
  textTransform: 'uppercase',
  position: 'relative',
  zIndex: 1
};

const ctaHoverStyle: CSSProperties = {
  borderColor: 'rgba(57, 255, 20, 0.4)',
  background: 'rgba(57, 255, 20, 0.1)',
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 20px rgba(57, 255, 20, 0.15)'
};

export const IntroScreen: FC<IntroScreenProps> = ({ variant = '3x3', onRequestEnter }: IntroScreenProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section style={containerStyle}>
      <div style={gradientOverlay} />
      
      <img src={logoBmp} alt="NexShell" style={logoStyle} />
      
      <div style={titleContainerStyle}>
        <h1 style={titleStyle}>NexShell</h1>
        <p style={subtitleStyle}>Built by Savitender Singh</p>
      </div>
      
      <p style={descriptionStyle}>
        A local-first terminal shell designed for precision, real device awareness, and bold neon cues that
        honor the NexShell spec. Launch commands, inspect files, and stay in control.
      </p>

      <div style={gridContainerStyle}>
        <CommandGrid variant={variant} />
      </div>

      <button
        type="button"
        style={isHovered ? { ...ctaBaseStyle, ...ctaHoverStyle } : ctaBaseStyle}
        onClick={onRequestEnter}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Enter Terminal
      </button>
    </section>
  );
};

export default IntroScreen;
