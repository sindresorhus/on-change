import {Bench} from 'tinybench';

export async function suite(name, fn, benchOptions) {
	console.log(name);

	const bench = new Bench({
		time: 500,
		...benchOptions,
	});

	fn(bench);

	await bench.warmup(); // Make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
	await bench.run();

	console.table(bench.table());
}
