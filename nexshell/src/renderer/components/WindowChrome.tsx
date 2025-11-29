import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WindowStatePayload } from '../../types/ipc';
import { ColorTokens } from '../theme/tokens';

type DragRegionStyle = CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' };

// Modern minimal chrome
const chromeStyle: DragRegionStyle = {
  height: '40px',
  padding: '0 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(3, 3, 5, 0.95)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: '1px solid rgba(57, 255, 20, 0.1)',
  color: '#f0f0f0',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  WebkitAppRegion: 'drag',
  position: 'relative',
  zIndex: 1000
};

// Minimal brand section
const brandStyle: DragRegionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  WebkitAppRegion: 'drag'
};

const brandTextStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: ColorTokens.connectorNeon,
  letterSpacing: '0.1em',
  margin: 0
};

// Modern minimal controls
const controlsStyle: DragRegionStyle = {
  display: 'flex',
  gap: '0.5rem',
  WebkitAppRegion: 'no-drag'
};

const controlButtonStyle = (color: string): CSSProperties => ({
  width: '32px',
  height: '24px',
  borderRadius: '0.375rem',
  border: `1px solid ${color}`,
  background: 'rgba(0, 0, 0, 0.3)',
  color: color,
  fontSize: '0.7rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit'
});

const controlButtonHover = (color: string): CSSProperties => ({
  background: `${color}15`,
  borderColor: color,
  transform: 'scale(1.05)'
});

const iconForState = (isMaximized: boolean): string => (isMaximized ? '□' : '■');

export const WindowChrome = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const bridge = window.nexshellAPI;

  useEffect(() => {
    let dispose: (() => void) | undefined;
    const syncState = async () => {
      if (!bridge?.windowControls) {
        return;
      }
      const current = await bridge.windowControls.getState();
      setIsMaximized(current.isMaximized);
      dispose = bridge.windowControls.onStateChange((payload: WindowStatePayload) => {
        setIsMaximized(payload.isMaximized);
      });
    };

    syncState().catch((error) => {
      console.error('Failed to sync window state', error);
    });

    return () => {
      dispose?.();
    };
  }, [bridge]);

  const handleMinimize = () => {
    bridge?.windowControls?.minimize()?.catch(console.error);
  };

  const handleToggleMaximize = () => {
    bridge?.windowControls?.toggleMaximize()?.catch(console.error);
  };

  const handleClose = () => {
    bridge?.windowControls?.close()?.catch(console.error);
  };

  return (
    <div style={chromeStyle} aria-label="NexShell window controls">
      <div style={brandStyle}>
        <p style={brandTextStyle}>NexShell</p>
      </div>
      <div style={controlsStyle}>
        <button
          type="button"
          onClick={handleMinimize}
          style={{
            ...controlButtonStyle(ColorTokens.cwdGreen),
            ...(hoveredControl === 'min' ? controlButtonHover(ColorTokens.cwdGreen) : {})
          }}
          onMouseEnter={() => setHoveredControl('min')}
          onMouseLeave={() => setHoveredControl(null)}
          aria-label="Minimize window"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleToggleMaximize}
          style={{
            ...controlButtonStyle(ColorTokens.pipe),
            ...(hoveredControl === 'max' ? controlButtonHover(ColorTokens.pipe) : {})
          }}
          onMouseEnter={() => setHoveredControl('max')}
          onMouseLeave={() => setHoveredControl(null)}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        >
          {iconForState(isMaximized)}
        </button>
        <button
          type="button"
          onClick={handleClose}
          style={{
            ...controlButtonStyle(ColorTokens.nexusRed),
            ...(hoveredControl === 'close' ? controlButtonHover(ColorTokens.nexusRed) : {})
          }}
          onMouseEnter={() => setHoveredControl('close')}
          onMouseLeave={() => setHoveredControl(null)}
          aria-label="Close window"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default WindowChrome;
