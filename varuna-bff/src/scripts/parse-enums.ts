import * as fs from 'fs';
import * as path from 'path';

const EXTRACT_DIR = path.join(__dirname, '../../enums_extract');
const OUTPUT_FILE = path.join(__dirname, '../db/seed_enums.sql');

interface EnumValue {
    name: string;
    value: number;
    description: string | null;
}

interface ParsedEnum {
    enumName: string;
    values: EnumValue[];
}

function findCsFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findCsFiles(filePath, fileList);
        } else if (filePath.endsWith('.cs') || filePath.endsWith('.txt')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function parseEnum(fileContent: string): ParsedEnum[] {
    const results: ParsedEnum[] = [];

    // We look for 'public enum EnumName'
    const enumRegex = /public\s+enum\s+([a-zA-Z0-9_]+)\s*{([^}]*)}/gs;
    let match;

    while ((match = enumRegex.exec(fileContent)) !== null) {
        const enumName = match[1].trim();
        const enumBody = match[2];
        const values: EnumValue[] = [];

        const lines = enumBody.split('\n');
        let currentDescription: string | null = null;
        let currentValue = 0;

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) {
                continue;
            }

            // Check for description attribute
            const descMatch = /\[[dD]escription\s*\(\s*"([^"]+)"\s*\)\s*\]/.exec(line);
            if (descMatch) {
                currentDescription = descMatch[1];
                line = line.replace(/\[[dD]escription\s*\(\s*"([^"]+)"\s*\)\s*\]/, '').trim();
            }

            if (!line) continue;

            line = line.replace(/,$/, '').trim();

            if (line.includes('=')) {
                const parts = line.split('=');
                const name = parts[0].trim().split(' ')[0]; // in case of weird spacing
                let valStr = parts[1].split('//')[0].trim(); // remove end of line comments
                valStr = valStr.split(',')[0].trim();

                const value = parseInt(valStr, 10);
                if (!isNaN(value)) {
                    values.push({ name, value, description: currentDescription });
                    currentValue = value + 1;
                    currentDescription = null; // reset
                }
            }
            else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(line.split(' ')[0].replace(/,$/, ''))) {
                const name = line.split(' ')[0].replace(/,$/, '');
                values.push({ name, value: currentValue, description: currentDescription });
                currentValue++;
                currentDescription = null; // reset
            }
        }

        if (values.length > 0) {
            results.push({ enumName, values });
        }
    }

    return results;
}

function processAllFiles() {
    console.log(`Searching for files in ${EXTRACT_DIR}...`);
    const files = findCsFiles(EXTRACT_DIR);
    console.log(`Found ${files.length} files to process.`);

    const allEnums: ParsedEnum[] = [];

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const enums = parseEnum(content);
            allEnums.push(...enums);
        } catch (e) {
            console.error(`Error reading file ${file}:`, e);
        }
    }

    console.log(`Extracted ${allEnums.length} enums.`);

    let totalRows = 0;

    const sqlLines: string[] = [
        '-- Auto-generated Enum Seed Data',
        'CREATE TABLE IF NOT EXISTS SystemEnums (',
        '    Id TEXT PRIMARY KEY,',
        '    EnumType TEXT NOT NULL,',
        '    EnumValue INTEGER NOT NULL,',
        '    EnumName TEXT NOT NULL,',
        '    DisplayName TEXT',
        ');',
        '',
        'CREATE INDEX IF NOT EXISTS idx_enum_type ON SystemEnums(EnumType);',
        'DELETE FROM SystemEnums;',
        ''
    ];

    for (const enm of allEnums) {
        for (const val of enm.values) {
            const id = `${enm.enumName}_${val.value}`;
            const display = val.description ? `'${val.description.replace(/'/g, "''")}'` : 'NULL';
            sqlLines.push(`INSERT OR REPLACE INTO SystemEnums (Id, EnumType, EnumValue, EnumName, DisplayName) VALUES ('${id}', '${enm.enumName}', ${val.value}, '${val.name}', ${display});`);
            totalRows++;
        }
    }

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, sqlLines.join('\n'));
    console.log(`Generated SQL script at ${OUTPUT_FILE} with ${totalRows} INSERT statements.`);
}

processAllFiles();
