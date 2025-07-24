const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 버전 타입: major, minor, patch
function incrementVersion(currentVersion, type = 'patch') {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch(type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
        default:
            return `${major}.${minor}.${patch + 1}`;
    }
}

// package.json 버전 업데이트
function updatePackageVersion(newVersion) {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageData.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
}

// CLAUDE.md 버전 업데이트
function updateClaudeVersion(newVersion) {
    const claudePath = path.join(__dirname, '..', 'CLAUDE.md');
    let claudeContent = fs.readFileSync(claudePath, 'utf8');
    
    const date = new Date().toISOString().split('T')[0];
    const versionSection = `### 현재 버전: v${newVersion} (${date})`;
    
    // 버전 섹션 업데이트
    claudeContent = claudeContent.replace(
        /### 현재 버전: v[\d.]+\s*\(\d{4}-\d{2}-\d{2}\)/,
        versionSection
    );
    
    fs.writeFileSync(claudePath, claudeContent);
}

// Git 커밋 및 태그 생성
function createGitRelease(version, message) {
    try {
        // 변경사항 추가
        execSync('git add -A');
        
        // 커밋 생성
        execSync(`git commit -m "Release v${version}: ${message}"`);
        
        // 태그 생성
        execSync(`git tag -a v${version} -m "Version ${version}: ${message}"`);
        
        console.log(`✅ Created release v${version}`);
        console.log(`📌 Don't forget to push: git push origin main --tags`);
        
    } catch (error) {
        console.error('Error creating git release:', error.message);
    }
}

// 메인 함수
function main() {
    const args = process.argv.slice(2);
    const type = args[0] || 'patch';
    const message = args.slice(1).join(' ') || 'Update';
    
    // 현재 버전 가져오기
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageData.version;
    
    // 새 버전 계산
    const newVersion = incrementVersion(currentVersion, type);
    
    console.log(`📦 Updating version from ${currentVersion} to ${newVersion}`);
    
    // 버전 업데이트
    updatePackageVersion(newVersion);
    updateClaudeVersion(newVersion);
    
    // Git 릴리즈 생성
    createGitRelease(newVersion, message);
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { incrementVersion, updatePackageVersion, updateClaudeVersion };