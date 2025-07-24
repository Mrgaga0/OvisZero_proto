const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');

const extensionId = 'com.ovistra.teamovistra';
const version = require('../package.json').version;
const outputFileName = `TeamOvistra_v${version}.zxp`;

console.log('Packaging Team Ovistra CEP Plugin...');

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Files and directories to include in the package
const filesToInclude = [
    'CSXS',
    'host',
    'js',
    'lib',
    'components',
    'styles',
    'types',
    'stores',
    'index.html',
    'App.tsx',
    'package.json',
    '.debug'
];

// Create a ZXP file (which is just a ZIP file with a different extension)
const output = fs.createWriteStream(path.join(outputDir, outputFileName));
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
    console.log(`\\nPackage created successfully: ${outputFileName}`);
    console.log(`Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\\nLocation: ${path.join(outputDir, outputFileName)}`);
    console.log('\\nTo install:');
    console.log('1. Use Adobe Extension Manager or');
    console.log('2. Use ExManCmd tool or');
    console.log('3. Use ZXPInstaller');
});

archive.on('error', (err) => {
    console.error('Error creating package:', err);
    process.exit(1);
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to archive
filesToInclude.forEach(item => {
    const itemPath = path.join(process.cwd(), item);
    
    if (fs.existsSync(itemPath)) {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            archive.directory(itemPath, item);
        } else {
            archive.file(itemPath, { name: item });
        }
    } else {
        console.warn(`Warning: ${item} not found, skipping...`);
    }
});

// Add node_modules if it exists (for production dependencies only)
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('Note: node_modules not included. Build the project first if needed.');
}

// Finalize the archive
archive.finalize();

// Note about signing
console.log('\\nNote: This creates an unsigned ZXP package.');
console.log('For distribution, you should sign it with a certificate using:');
console.log('ZXPSignCmd -sign [input] [output] [certificate] [password]');