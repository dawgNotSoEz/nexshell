import { useState } from 'react';
import type { CSSProperties, FC } from 'react';
import type { CommandGridVariant, ShellCommand } from '../../types/commands';
import { ColorTokens } from '../theme/tokens';

const BASE_COMMANDS: ShellCommand[] = [
  { name: 'ls', description: 'List directory entries within the active path.', category: 'core' },
  { name: 'pwd', description: 'Print the working directory that NexShell tracks.', category: 'core' },
  { name: 'cd <path>', description: 'Jump to the provided path and refresh the prompt.', category: 'core' },
  { name: 'jobs', description: 'Show background jobs spawned by NexShell.', category: 'core' },
  { name: 'killjobs <id>', description: 'Terminate a tracked background job.', category: 'core' },
  { name: 'fetch <url|path>', description: 'Fetch remote headers or read local files (<=50KB).', category: 'core' },
  { name: 'grep <pattern> <file>', description: 'Scan a file and emit matching lines.', category: 'core' },
  { name: 'unique <file>', description: 'Display de-duplicated lines from the file.', category: 'core' },
  { name: 'sort <file>', description: 'Output sorted lines (ascending) from the file.', category: 'core' }
];

const EXTENDED_COMMANDS: ShellCommand[] = [
  { name: 'monitor', description: 'Preview CPU & memory summaries (simulated).', category: 'core' },
  { name: 'tail <file>', description: 'Stream the last lines of a log file.', category: 'core' },
  { name: 'nexus apt update', description: 'Simulated admin refresh, never touches real packages.', category: 'admin' }
];

// Modern minimal grid
const containerStyle = (variant: CommandGridVariant): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: variant === '4x3' ? 'repeat(4, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
  gap: '1rem',
  width: '100%'
});

// Ultra minimal cards - modern and clean
const cardBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '1.25rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(57, 255, 20, 0.1)',
  background: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'left',
  color: '#f5f5f5',
  width: '100%',
  position: 'relative',
  overflow: 'hidden'
};

// Subtle hover
const cardHoverStyle: CSSProperties = {
  borderColor: 'rgba(57, 255, 20, 0.25)',
  background: 'rgba(0, 0, 0, 0.3)',
  transform: 'translateY(-2px)'
};

// Minimal dot indicator
const dotStyle = (category: ShellCommand['category']): CSSProperties => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: category === 'admin' ? ColorTokens.nexusRed : ColorTokens.connectorNeon,
  flexShrink: 0,
  marginTop: '0.25rem'
});

const contentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
  minWidth: 0,
  flex: 1
};

// Clean typography
const titleStyle: CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: ColorTokens.connectorNeon,
  margin: 0,
  letterSpacing: '0.01em',
  fontFamily: 'inherit',
  lineHeight: 1.4
};

const descriptionStyle: CSSProperties = {
  fontSize: '0.8rem',
  opacity: 0.7,
  margin: 0,
  color: '#d5d5d5',
  lineHeight: 1.5,
  fontWeight: 400
};

const CommandCard: FC<{ command: ShellCommand }> = ({ command }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const dynamicStyle: CSSProperties = {
    ...cardBaseStyle,
    ...(isHovered ? cardHoverStyle : {})
  };

  return (
    <button
      type="button"
      style={dynamicStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={dotStyle(command.category)} aria-hidden="true" />
        <div style={contentStyle}>
          <p style={titleStyle}>{command.name}</p>
          <p style={descriptionStyle}>{command.description}</p>
        </div>
      </div>
    </button>
  );
};

interface CommandGridProps {
  variant?: CommandGridVariant;
}

export const CommandGrid: FC<CommandGridProps> = ({ variant = '3x3' }) => {
  const commands = variant === '4x3' ? [...BASE_COMMANDS, ...EXTENDED_COMMANDS] : BASE_COMMANDS;
  return (
    <div style={containerStyle(variant)}>
      {commands.map((command) => (
        <CommandCard key={command.name} command={command} />
      ))}
    </div>
  );
};

export default CommandGrid;
