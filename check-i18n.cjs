const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Load tr.json
const trPath = path.join(__dirname, 'src', 'i18n', 'locales', 'tr.json');
const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));

const extractKeys = (obj, prefix = '') => {
    let keys = new Set();
    for (const key in obj) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedKeys = extractKeys(obj[key], newPrefix);
            nestedKeys.forEach(k => keys.add(k));
        } else {
            keys.add(newPrefix);
        }
    }
    return keys;
};

const existingKeys = extractKeys(trData);

// 2. Find all used keys in code
const filesCommand = `find src -type f -name "*.tsx" -o -name "*.ts"`;
const files = execSync(filesCommand).toString().trim().split('\n');

const usedKeys = new Set();
const defaultValues = new Map();
const hardcodedRegex = />[\s\n]*([A-Za-z]+[^<]*[a-zA-Z]+)[\s\n]*</g;

console.log("----- Missing Keys in tr.json -----");

files.forEach(file => {
    if (file.includes('i18n')) return;
    const content = fs.readFileSync(file, 'utf8');

    // Find t('key') or t("key") or t('key', 'default')
    // Using a robust regex
    const tRegex = /t\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g;
    let match;
    while ((match = tRegex.exec(content)) !== null) {
        const key = match[1];
        const defaultVal = match[2];
        usedKeys.add(key);

        if (!existingKeys.has(key)) {
            console.log(`Missing key: "${key}" in file: ${file}`);
            if (defaultVal) {
                console.log(`  -> Has default value: "${defaultVal}"`);
            }
        }
    }
});

console.log("\n----- Potential Hardcoded Strings (Top 20 matches) -----");
// A simple grep for texts inside JSX elements that are not expressions
// This is very noisy, so we just limit it or use it as a hint.
const grepCmd = `grep -riE ">[A-Za-z0-9 ]+<" src/features/dashboard | head -n 20`;
try {
    console.log(execSync(grepCmd).toString());
} catch (e) { }
