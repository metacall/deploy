declare module 'gauge' {
	import type { Writable } from 'stream';
	interface GaugeOptions {
		/** How often gauge updates should be drawn, in milliseconds. */
		updateInterval?: number;
		/** When this is true a timer is created to trigger once every updateInterval ms, when false, updates are printed as soon as they come in but updates more often than updateInterval are ignored. */
		fixedFramerate?: boolean;
		/** A themeset to use when selecting the theme to use. */
		themes?: unknown;
		/** Select a theme for use. If no theme is selected then a default is picked using a combination of our best guesses at your OS, color support and unicode support. */
		theme?: unknown;
		/** Describes what you want your gauge to look like. The default is what npm uses. */
		template?: unknown;
		/** Defaults to true. If true, then the cursor will be hidden while the gauge is displayed. */
		hideCursor?: boolean;
		/** The tty that you're ultimately writing to. Defaults to the same as `stream`. */
		tty?: unknown;
		/** Defaults to true if `tty` is a TTY, false otherwise. If true the gauge starts enabled. */
		enabled?: boolean;
		/** Defaults to true. Ordinarily we register an exit handler to make sure your cursor is turned back on and the progress bar erased when your process exits, even if you Ctrl-C out or otherwise exit unexpectedly. You can disable this and it won't register the exit handler. */
		cleanupOnExit?: boolean;
	}
	class Gauge {
		constructor(stream?: Writable, options?: GaugeOptions);

		disable(): void;

		enable(): void;

		getWidth(): unknown;

		hide(cb: unknown): unknown;

		isEnabled(): unknown;

		pulse(subsection: unknown): void;

		setTemplate(template: unknown): void;

		setTheme(theme: unknown): void;

		setThemeset(themes: unknown): void;

		setWriteTo(writeTo: unknown, tty: unknown): void;

		show(section: unknown, completed: unknown): void;
	}

	export = Gauge;
}
