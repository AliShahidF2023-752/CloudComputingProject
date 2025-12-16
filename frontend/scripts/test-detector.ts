
import { detectAI } from '../src/lib/detector';

async function main() {
    console.log("Running AI Detection Test...");

    const humanText = "I went to the store yesterday and bought some apples. It was a nice day out, so I decided to walk home instead of taking the bus.";
    const aiText = "Artificial intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction.";

    console.log("\nAnalyzing Human Text:");
    const humanResult = await detectAI(humanText);
    console.log(JSON.stringify(humanResult, null, 2));

    console.log("\nAnalyzing AI Text:");
    const aiResult = await detectAI(aiText);
    console.log(JSON.stringify(aiResult, null, 2));
}

main();
