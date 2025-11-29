import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { HostInfo } from '../../types/ipc';
import { colorizeCommandInput } from '../utils/colorize';
import { highlightCommandSyntax, toColoredSegment } from '../utils/command-highlight';
import { sanitizeTerminalOutput } from '../utils/sanitize';
import { ColorTokens } from '../theme/tokens';
import { PromptLine1, PromptConnector } from './prompt/PromptRenderer';
import { createHistory, addToHistory, navigateHistoryUp, navigateHistoryDown, type HistoryState } from '../utils/history';
import '../styles/terminal.css';

type PromptVariant = 'full' | 'minimal';

type TerminalEntry = {
	id: string;
	command: string;
	stdout: string;
	stderr: string;
	exitCode: number;
};

const shellStyle: CSSProperties = {
	width: 'min(1400px, 100%)',
	height: '100%',
	maxHeight: '100%',
	borderRadius: '1rem',
	background: 'linear-gradient(135deg, rgba(8, 8, 12, 0.98) 0%, rgba(5, 5, 8, 0.95) 100%)',
	backdropFilter: 'blur(20px) saturate(180%)',
	WebkitBackdropFilter: 'blur(20px) saturate(180%)',
	display: 'flex',
	flexDirection: 'column',
	padding: '2rem',
	boxShadow: `
		0 8px 32px rgba(0, 0, 0, 0.4),
		0 0 0 1px rgba(57, 255, 20, 0.1),
		inset 0 1px 0 rgba(255, 255, 255, 0.05)
	`,
	color: '#f5f5f5',
	margin: '0 auto',
	overflow: 'hidden',
	position: 'relative'
};

	const inputWrapperStyle: CSSProperties = {
	position: 'relative',
	flex: 1,
	display: 'flex',
	alignItems: 'center',
	background: 'rgba(0, 0, 0, 0.3)',
	borderRadius: '0.5rem',
	border: '1px solid rgba(57, 255, 20, 0.15)',
	padding: '0.5rem 0.75rem',
	transition: 'all 0.2s ease',
	backdropFilter: 'blur(10px)',
	WebkitBackdropFilter: 'blur(10px)',
	boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
};

const inputStyle: CSSProperties = {
	width: '100%',
	background: 'transparent',
	border: 'none',
	outline: 'none',
	fontSize: '0.95rem',
	fontFamily: '"JetBrains Mono", "Fira Code", monospace',
	color: 'transparent',
	caretColor: ColorTokens.commandYellow,
	padding: 0,
	lineHeight: '1.5'
};

const overlayStyle: CSSProperties = {
	position: 'absolute',
	inset: 0,
	pointerEvents: 'none',
	display: 'flex',
	alignItems: 'center',
	fontSize: '0.95rem',
	fontFamily: '"JetBrains Mono", "Fira Code", monospace',
	padding: '0 0.75rem',
	whiteSpace: 'pre',
	lineHeight: '1.5'
};

const plusSymbolStyle: CSSProperties = {
	color: ColorTokens.commandYellow,
	fontWeight: 700,
	fontSize: '1.1rem',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '1.5rem',
	height: '1.5rem',
	background: 'rgba(255, 255, 0, 0.1)',
	borderRadius: '0.25rem',
	border: '1px solid rgba(255, 255, 0, 0.2)'
};

const outputPaneStyle: CSSProperties = {
	flex: 1,
	overflowY: 'auto',
	marginTop: '1.5rem',
	paddingRight: '0.5rem',
	paddingLeft: '0.25rem',
	fontFamily: '"JetBrains Mono", "Fira Code", monospace',
	fontSize: '0.9rem',
	lineHeight: '1.6',
	scrollbarWidth: 'thin',
	scrollbarColor: 'rgba(57, 255, 20, 0.3) transparent'
};

const exitCodeStyle = (code: number): CSSProperties => ({
	fontSize: '0.8rem',
	opacity: 0.7,
	color: code === 0 ? ColorTokens.cwdGreen : ColorTokens.deviceRed,
	marginTop: '0.5rem',
	padding: '0.25rem 0.5rem',
	background: code === 0 
		? 'rgba(0, 255, 127, 0.1)' 
		: 'rgba(255, 0, 0, 0.1)',
	borderRadius: '0.25rem',
	display: 'inline-block',
	border: `1px solid ${code === 0 ? 'rgba(0, 255, 127, 0.2)' : 'rgba(255, 0, 0, 0.2)'}`
});

export const TerminalView = () => {
	const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
	const [promptVariant] = useState<PromptVariant>('minimal');
	const [inputValue, setInputValue] = useState('');
	const [history, setHistory] = useState<HistoryState>(createHistory());
	const [entries, setEntries] = useState<TerminalEntry[]>([]);
	const [isExecuting, setIsExecuting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const logEndRef = useRef<HTMLDivElement>(null);

	const bridge = window.nexshellAPI;

	const fetchHostInfo = useCallback(async () => {
		if (!bridge) {
			return;
		}
		const info = await bridge.getHostInfo();
		setHostInfo(info);
	}, [bridge]);

	useEffect(() => {
		fetchHostInfo();
	}, [fetchHostInfo]);

	useEffect(() => {
		inputRef.current?.focus();
	}, [hostInfo]);

	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [entries]);

	// Use syntax highlighting for better visual feedback (pipes, redirections, etc.)
	const promptSegments = useMemo(() => {
		const highlighted = highlightCommandSyntax(inputValue);
		return highlighted.map(toColoredSegment);
	}, [inputValue]);

	const updateInputFromHistory = useCallback((direction: 'up' | 'down') => {
		if (direction === 'up') {
			const result = navigateHistoryUp(history);
			setHistory(result.history);
			setInputValue(result.value);
		} else {
			const result = navigateHistoryDown(history);
			setHistory(result.history);
			setInputValue(result.value);
		}
	}, [history]);

	const handleExecute = useCallback(async () => {
		if (!bridge || !inputValue.trim() || isExecuting) {
			return;
		}

		setIsExecuting(true);
		const command = inputValue;
		setInputValue('');
		setHistory((prev) => addToHistory(prev, command));

		try {
			const result = await bridge.executeCommand(command);
			setEntries((prev) => [
				...prev,
				{
					id: `${Date.now()}-${prev.length}`,
					command,
					stdout: result.stdout,
					stderr: result.stderr,
					exitCode: result.exitCode
				}
			]);
		} catch (error) {
			setEntries((prev) => [
				...prev,
				{
					id: `${Date.now()}-${prev.length}`,
					command,
					stdout: '',
					stderr: `executeCommand: ${String(error)}`,
					exitCode: 1
				}
			]);
		} finally {
			setIsExecuting(false);
			fetchHostInfo();
			inputRef.current?.focus();
		}
	}, [bridge, fetchHostInfo, inputValue, isExecuting, history]);

	const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleExecute();
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			updateInputFromHistory('up');
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			updateInputFromHistory('down');
		}
	}, [handleExecute, updateInputFromHistory]);

	const host = hostInfo ?? {
		hostname: '...',
		cwd: 'loading...',
		permissionLevel: 'standard' as const
	};

	return (
		<section style={shellStyle}>
			{/* Modern terminal header accent */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				height: '2px',
				background: `linear-gradient(90deg, transparent, ${ColorTokens.connectorNeon}, transparent)`,
				opacity: 0.6
			}} />
			
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
				<PromptLine1 hostInfo={host} variant={promptVariant} />

				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
					<PromptConnector variant={promptVariant} />
					<span style={plusSymbolStyle}>+</span>
					<div style={inputWrapperStyle} className="terminal-input-wrapper">
						<div style={overlayStyle} aria-hidden="true">
							{promptSegments.length > 0 ? (
								promptSegments.map((segment, index) => (
									<span key={`${segment.text}-${index}`} style={{ color: segment.colorVar }}>
										{segment.displayText}
									</span>
								))
							) : (
								<span className="placeholder-hint" style={{ fontStyle: 'italic' }}>
									type a command...
								</span>
							)}
						</div>
						<input
							ref={inputRef}
							style={inputStyle}
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={handleKeyDown}
							spellCheck={false}
							autoCapitalize="off"
							autoComplete="off"
							autoCorrect="off"
							aria-label="NexShell command input"
						/>
					</div>
				</div>
			</div>

			<div style={outputPaneStyle} className="terminal-output">
				{entries.length === 0 && (
					<div style={{
						padding: '2rem',
						textAlign: 'center',
						opacity: 0.8,
						background: 'rgba(57, 255, 20, 0.05)',
						borderRadius: '0.5rem',
						border: '1px dashed rgba(57, 255, 20, 0.2)'
					}}>
						<p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
							NexShell terminal ready. Type <span style={{ color: ColorTokens.commandYellow, fontWeight: 600 }}>help</span> to view available commands or begin with <span style={{ color: ColorTokens.commandYellow, fontWeight: 600 }}>pwd</span>.
						</p>
					</div>
				)}

				{entries.map((entry, index) => (
					<div 
						key={entry.id}
						className="terminal-entry"
						style={{ 
							marginBottom: '1.5rem',
							padding: '1rem',
							background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
							borderRadius: '0.5rem',
							borderLeft: `3px solid ${entry.exitCode === 0 ? ColorTokens.cwdGreen : ColorTokens.deviceRed}`,
							transition: 'all 0.2s ease'
						}}
					>
						<div style={{ 
							color: ColorTokens.commandYellow, 
							fontWeight: 600,
							marginBottom: '0.5rem',
							fontSize: '0.9rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem'
						}}>
							<span style={{
								display: 'inline-block',
								width: '6px',
								height: '6px',
								borderRadius: '50%',
								background: ColorTokens.commandYellow,
								opacity: 0.8
							}} />
							{entry.command}
						</div>
						{entry.stdout && (
							<pre style={{ 
								whiteSpace: 'pre-wrap', 
								margin: '0.5rem 0', 
								color: '#e8e8e8',
								fontSize: '0.875rem',
								lineHeight: '1.6',
								fontFamily: '"JetBrains Mono", "Fira Code", monospace',
								background: 'rgba(0, 0, 0, 0.2)',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								border: '1px solid rgba(255, 255, 255, 0.05)'
							}}>
								{sanitizeTerminalOutput(entry.stdout)}
							</pre>
						)}
						{entry.stderr && (
							<pre style={{ 
								whiteSpace: 'pre-wrap', 
								margin: '0.5rem 0', 
								color: ColorTokens.deviceRed,
								fontSize: '0.875rem',
								lineHeight: '1.6',
								fontFamily: '"JetBrains Mono", "Fira Code", monospace',
								background: 'rgba(255, 0, 0, 0.1)',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								border: '1px solid rgba(255, 0, 0, 0.2)'
							}}>
								{sanitizeTerminalOutput(entry.stderr)}
							</pre>
						)}
						<div style={exitCodeStyle(entry.exitCode)}>
							<span style={{ fontWeight: 600 }}>exit:</span> {entry.exitCode}
						</div>
					</div>
				))}
				<div ref={logEndRef} />
			</div>

			<div style={{ 
				fontSize: '0.75rem', 
				opacity: 0.6, 
				marginTop: '1rem',
				padding: '0.75rem',
				background: 'rgba(0, 0, 0, 0.2)',
				borderRadius: '0.5rem',
				border: '1px solid rgba(255, 255, 255, 0.05)',
				display: 'flex',
				alignItems: 'center',
				gap: '1rem',
				flexWrap: 'wrap'
			}}>
				<span>Typing color legend:</span>
				<span style={{ color: ColorTokens.commandYellow }}>normal commands: yellow</span>
				<span style={{ color: ColorTokens.nexusRed }}>nexus prefix: neon red</span>
			</div>
		</section>
	);
};

export default TerminalView;
