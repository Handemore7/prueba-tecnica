"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const customFunction_1 = require("./customFunction");
function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Por favor, introduce dos números como argumentos.');
        process.exit(1);
    }
    const a = Number(args[0]);
    const b = Number(args[1]);
    if (isNaN(a) || isNaN(b)) {
        console.error('Ambos argumentos deben ser números.');
        process.exit(1);
    }
    const resultado = (0, customFunction_1.customFunction)(a, b);
    console.log(`El resultado de la suma es: ${resultado}`);
}
main();
//# sourceMappingURL=index.js.map