const os = require('os');
const { exec } = require('child_process');

console.log('Enabling CEP Debug Mode...');

if (os.platform() === 'win32') {
    // Windows
    const command = 'reg add "HKEY_CURRENT_USER\\SOFTWARE\\Adobe\\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error enabling debug mode:', error);
            return;
        }
        console.log('Debug mode enabled for Windows');
        console.log('Please restart Premiere Pro');
    });
} else if (os.platform() === 'darwin') {
    // macOS
    const command = 'defaults write com.adobe.CSXS.10 PlayerDebugMode 1';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error enabling debug mode:', error);
            return;
        }
        console.log('Debug mode enabled for macOS');
        console.log('Please restart Premiere Pro');
    });
} else {
    console.log('Unsupported platform');
}