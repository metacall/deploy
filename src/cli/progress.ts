import Gauge from 'gauge';

interface Progress {
	progress: (text: string, bytes: number) => void;
	pulse: (name: string) => void;
}

export default (): Progress => {
	const gauge = new Gauge();
	return {
		progress: (text, bytes) => gauge.show(text, bytes),
		pulse: name => gauge.pulse(name)
	};
};
