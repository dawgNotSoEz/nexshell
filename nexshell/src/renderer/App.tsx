import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import IntroScreen from './components/IntroScreen';
import TerminalView from './components/TerminalView';
import WindowChrome from './components/WindowChrome';

const rootStyle: CSSProperties = {
  minHeight: '100vh',
  minWidth: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#000000',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  overflow: 'hidden',
  position: 'relative'
};

const buildContentStyle = (entered: boolean): CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: entered ? 'flex-start' : 'center',
  padding: entered ? '1rem 1rem 2rem' : '1rem',
  minHeight: 0,
  width: '100%',
  overflow: 'hidden'
});

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const contentStyle = useMemo(() => buildContentStyle(hasEntered), [hasEntered]);
  const handleEnter = useCallback(() => {
    setHasEntered(true);
  }, []);

  useEffect(() => {
    if (hasEntered) {
      return;
    }

    const handleKeyDown = () => {
      handleEnter();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, hasEntered]);

  return (
    <div style={rootStyle}>
      <WindowChrome />
      <div style={contentStyle}>
        {hasEntered ? <TerminalView /> : <IntroScreen onRequestEnter={handleEnter} />}
      </div>
    </div>
  );
}

export default App;
