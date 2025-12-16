
import { humanizeText } from '../src/lib/humanize';

console.log("Running Humanizer Test...");

const input = "I utilized the method to demonstrate the results. Moreover, it was effective.";
console.log("\nInput:", input);

// Run multiple times to see variation
for (let i = 0; i < 3; i++) {
    const output = humanizeText(input, 1.0, 0.5); // High intensity
    console.log(`\nOutput ${i + 1}:`, output);
}
