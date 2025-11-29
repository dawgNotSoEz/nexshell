import type { CSSProperties } from 'react';

// PHASE 4 STUB — Settings placeholder for future theme toggles.
const containerStyle: CSSProperties = {
	width: 'min(600px, 90vw)',
	height: 'min(400px, 60vh)',
	borderRadius: '1rem',
	border: '1px dashed rgba(255, 255, 255, 0.3)',
	padding: '1.5rem',
	color: '#f5f5f5',
	background: 'rgba(10, 10, 10, 0.85)',
	display: 'flex',
	flexDirection: 'column',
	gap: '0.75rem'
};

const placeholderStyle: CSSProperties = {
	fontFamily: '"JetBrains Mono", "Fira Code", monospace',
	fontSize: '0.95rem',
	lineHeight: 1.5,
	color: 'rgba(255, 255, 255, 0.75)'
};

export const Settings = () => (
	<section style={containerStyle}>
		<h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-nexshell-blue)' }}>Settings</h2>
		<p style={placeholderStyle}>
			Future theme toggles and personalization controls mount here once Phase 5 begins. Layout matches the
			TerminalView shell to simplify swapping in real controls.
		</p>
		<div style={{ marginTop: 'auto', fontSize: '0.85rem', opacity: 0.7 }}>
			Future controls: neon/solarized palette toggle, font size slider, connector preference defaults.
		</div>
	</section>
);

export default Settings;
