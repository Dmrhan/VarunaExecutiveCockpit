const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

const resources = [
    { src: 'cronjob-scripts', dest: 'dist/cronjob-scripts' },
    { src: 'cronjob-settings.json', dest: 'dist/cronjob-settings.json' }
];

resources.forEach(res => {
    const srcPath = path.resolve(__dirname, '..', res.src);
    const destPath = path.resolve(__dirname, '..', res.dest);

    if (fs.existsSync(srcPath)) {
        console.log(`Copying ${res.src} to ${res.dest}...`);
        copyRecursiveSync(srcPath, destPath);
    } else {
        console.warn(`Warning: Source path ${srcPath} not found.`);
    }
});
