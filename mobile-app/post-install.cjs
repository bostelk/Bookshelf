const fs = require("fs");
const path = require("path");

// copy onnxruntime-web WebAssembly files to {workspace}/public/ folder
const srcFolder = path.join(__dirname, 'node_modules', 'onnxruntime-web', 'dist');
const destFolder = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
}
fs.copyFileSync(path.join(srcFolder, 'ort-wasm-simd-threaded.jsep.mjs'), path.join(destFolder, 'ort-wasm-simd-threaded.jsep.mjs'));
fs.copyFileSync(path.join(srcFolder, 'ort-wasm-simd-threaded.jsep.wasm'), path.join(destFolder, 'ort-wasm-simd-threaded.jsep.wasm'));
