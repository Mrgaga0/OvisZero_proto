const fs = require('fs');
const path = require('path');
const os = require('os');

const extensionId = 'com.ovistra.teamovistra';

// Determine CEP extensions folder
let extensionsPath;
if (os.platform() === 'win32') {
    extensionsPath = path.join(process.env.APPDATA, 'Adobe', 'CEP', 'extensions');
} else if (os.platform() === 'darwin') {
    extensionsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions');
} else {
    console.error('Unsupported platform');
    process.exit(1);
}

// Create extensions directory if it doesn't exist
if (!fs.existsSync(extensionsPath)) {
    fs.mkdirSync(extensionsPath, { recursive: true });
}

const targetPath = path.join(extensionsPath, extensionId);

// Remove existing installation
if (fs.existsSync(targetPath)) {
    console.log('Removing existing installation...');
    fs.rmSync(targetPath, { recursive: true, force: true });
}

// Create symbolic link to development folder
const sourcePath = process.cwd();

console.log(`Installing plugin from: ${sourcePath}`);
console.log(`Installing plugin to: ${targetPath}`);

try {
    if (os.platform() === 'win32') {
        // Windows requires admin privileges for symlinks, so we'll copy instead
        const copyRecursive = (src, dest) => {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            
            if (isDirectory) {
                fs.mkdirSync(dest, { recursive: true });
                fs.readdirSync(src).forEach(childItemName => {
                    copyRecursive(
                        path.join(src, childItemName),
                        path.join(dest, childItemName)
                    );
                });
            } else {
                fs.copyFileSync(src, dest);
            }
        };
        
        copyRecursive(sourcePath, targetPath);
        console.log('Plugin copied successfully (Windows)');
    } else {
        // macOS/Linux can use symlinks
        fs.symlinkSync(sourcePath, targetPath, 'dir');
        console.log('Plugin linked successfully');
    }
    
    console.log('\\nInstallation complete!');
    console.log('Please restart Premiere Pro and look for "Team Ovistra" in Window > Extensions');
} catch (error) {
    console.error('Error installing plugin:', error);
    console.log('\\nTry running with administrator privileges');
}