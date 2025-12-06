const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const FILES_TO_COPY = [
    'index.html',
    'remote.html',
    'style.css',
    'configuracion.html',
    'configuracion.css',
    'config.js',
    'Optician-Sans.ttf',
    'README.md'
];
const FILES_TO_OBFUSCATE = [
    'main.js',
    'license.js',
    'chart_logic.js',
    'remote.js',
    'configuracion.js'
];

console.log('Starting build process...');

// Ensure dist exists
if (fs.existsSync(DIST_DIR)) {
    console.log('Cleaning dist folder...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);

// Copy static files
console.log('Copying static files...');
FILES_TO_COPY.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(DIST_DIR, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file}`);
    } else {
        console.warn(`Warning: ${file} not found.`);
    }
});

// Obfuscate JS files
console.log('Obfuscating JavaScript files...');
FILES_TO_OBFUSCATE.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(DIST_DIR, file);

    if (fs.existsSync(src)) {
        try {
            console.log(`Processing ${file}...`);
            // Run javascript-obfuscator via npx
            // Using high obfuscation settings
            // --compact true: Minify
            // --control-flow-flattening true: Makes logic spaghetti-like
            // --dead-code-injection true: Adds random useless code
            // --string-array true: Encrypts strings
            const command = `npx javascript-obfuscator "${src}" --output "${dest}" --compact true --control-flow-flattening true --dead-code-injection true --string-array true --string-array-encoding rc4`;
            execSync(command, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Error obfuscating ${file}:`, error);
            console.log(`Fallback: Copying original ${file}...`);
            fs.copyFileSync(src, dest);
        }
    } else {
        console.warn(`Warning: ${file} not found.`);
    }
});

console.log('Build complete! The protected application is in the "dist" folder.');
