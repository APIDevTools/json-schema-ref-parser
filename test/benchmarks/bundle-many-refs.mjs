// Run pnpm build, then node test/benchmarks/bundle-many-refs.mjs.
import $RefParser from "../../dist/lib/index.js";

for (const count of [8000, 16000, 32000]) {
  const keys = Array.from({ length: count }, (_, i) => "d" + i);
  const definitions = Object.fromEntries(keys.map((key) => [key, { type: "string" }]));
  const schema = { definitions, items: keys.map((key) => ({ $ref: "#/definitions/" + key })) };

  await $RefParser.bundle(schema);
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await $RefParser.bundle(schema);
    samples.push(performance.now() - start);
  }
  const median = samples.sort((a, b) => a - b)[1];
  console.log(`${count} internal references: ${median.toFixed(1)} ms (median of 3 runs)`);
}
