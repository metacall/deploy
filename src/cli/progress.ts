import Gauge from 'gauge';

// interface Progress {
// progress(text: string, bytes: number): void;
// pulse(name: string): void;
// }

const gauge = new Gauge();
export const progress = (text: string, bytes: number): void =>
	gauge.show(text, bytes);
export const pulse = (name: string): void => gauge.pulse(name);
// export default (): Progress => {
// 	const gauge = new Gauge();
// 	return {
// 		progress: (text, bytes) => gauge.show(text, bytes),
// 		pulse: name => gauge.pulse(name)
// 	};
// };
