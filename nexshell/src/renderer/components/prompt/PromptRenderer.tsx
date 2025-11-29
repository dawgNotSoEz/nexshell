/**
 * Modular Prompt Renderer
 * 
 * Renders the NexShell two-line prompt format:
 * Line 1: [hostname]@NexShell->[cwd]|[permissionLevel]
 * Line 2: |--> + [command input]
 */

import type { CSSProperties } from 'react';
import type { HostInfo } from '../../../types/ipc';
import { ColorTokens } from '../../theme/tokens';

export interface PromptProps {
  hostInfo: HostInfo;
  variant?: 'full' | 'minimal';
}

const promptLineStyle: CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
  padding: '0.75rem 1rem',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '0.5rem',
  border: '1px solid rgba(57, 255, 20, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)'
};

const connectorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: ColorTokens.connectorNeon,
  minWidth: '100px',
  fontSize: '0.9rem',
  fontWeight: 500,
  padding: '0.5rem 0.75rem',
  background: 'rgba(57, 255, 20, 0.08)',
  borderRadius: '0.375rem',
  border: '1px solid rgba(57, 255, 20, 0.15)'
};

/**
 * Renders the first line of the prompt: [hostname]@NexShell->[cwd]|[permissionLevel]
 */
export function PromptLine1({ hostInfo }: PromptProps): JSX.Element {
  return (
    <div style={promptLineStyle}>
      <span style={{ 
        color: ColorTokens.deviceRed, 
        fontWeight: 600,
        padding: '0.125rem 0.5rem',
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '0.25rem',
        border: '1px solid rgba(255, 0, 0, 0.2)'
      }}>
        [{hostInfo.hostname}]
      </span>
      <span style={{ color: ColorTokens.atPurple, opacity: 0.9 }}>@</span>
      <span style={{ 
        color: ColorTokens.nexshellBlue, 
        fontWeight: 700,
        padding: '0.125rem 0.5rem',
        background: 'rgba(30, 144, 255, 0.1)',
        borderRadius: '0.25rem',
        border: '1px solid rgba(30, 144, 255, 0.2)'
      }}>
        NexShell
      </span>
      <span style={{ color: ColorTokens.arrow, opacity: 0.8 }}>-&gt;</span>
      <span style={{ 
        color: ColorTokens.cwdGreen,
        padding: '0.125rem 0.5rem',
        background: 'rgba(0, 255, 127, 0.1)',
        borderRadius: '0.25rem',
        border: '1px solid rgba(0, 255, 127, 0.2)',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        {hostInfo.cwd}
      </span>
      <span style={{ color: ColorTokens.pipe, opacity: 0.7 }}>|</span>
      <span style={{ 
        color: ColorTokens.permViolet, 
        textTransform: 'uppercase',
        fontSize: '0.85rem',
        fontWeight: 600,
        padding: '0.125rem 0.5rem',
        background: 'rgba(148, 0, 211, 0.1)',
        borderRadius: '0.25rem',
        border: '1px solid rgba(148, 0, 211, 0.2)'
      }}>
        {hostInfo.permissionLevel}
      </span>
    </div>
  );
}

/**
 * Renders the connector for the second line: |-->
 */
export function PromptConnector({ variant = 'minimal' }: { variant?: 'full' | 'minimal' }): JSX.Element {
  return (
    <div style={connectorStyle}>
      <span>{variant === 'full' ? '\\' : '|'}</span>
      <span>--&gt;</span>
    </div>
  );
}

