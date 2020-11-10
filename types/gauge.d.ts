declare module 'gauge' {
	class Gauge {
		constructor(stream?: any, options?: any);

		disable(): void;

		enable(): void;

		getWidth(): any;

		hide(cb: any): any;

		isEnabled(): any;

		pulse(subsection: any): void;

		setTemplate(template: any): void;

		setTheme(theme: any): void;

		setThemeset(themes: any): void;

		setWriteTo(writeTo: any, tty: any): void;

		show(section: any, completed: any): void;
	}

	export = Gauge;
}
