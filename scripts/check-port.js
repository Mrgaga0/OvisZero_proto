const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 포트 사용 여부 확인 함수
 * @param {number} port - 확인할 포트 번호
 * @returns {Promise<boolean>} - 포트가 사용 중이면 true, 아니면 false
 */
async function checkPortInUse(port) {
  try {
    const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
    return stdout.trim().length > 0;
  } catch (error) {
    // netstat 오류는 포트가 사용되지 않음을 의미
    return false;
  }
}

/**
 * 사용 가능한 포트 찾기
 * @param {number} startPort - 시작 포트
 * @param {number} endPort - 끝 포트  
 * @returns {Promise<number|null>} - 사용 가능한 포트 번호 또는 null
 */
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    const inUse = await checkPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  return null;
}

/**
 * 포트 상태 출력
 */
async function displayPortStatus() {
  console.log('🔍 Current Port Status Check:');
  console.log('=' .repeat(50));
  
  const portsToCheck = [
    { name: 'Backend Server', port: 1067 },
    { name: 'Frontend Dev', port: 3006 },
    { name: 'CEP Debug (OLD)', port: 7777 },
    { name: 'CEP Debug (NEW)', port: 3200 },
  ];

  for (const { name, port } of portsToCheck) {
    const inUse = await checkPortInUse(port);
    const status = inUse ? '🔴 IN USE' : '🟢 AVAILABLE';
    console.log(`${name.padEnd(20)} ${port.toString().padEnd(6)} ${status}`);
  }
  
  console.log('=' .repeat(50));
}

// CLI에서 직접 실행된 경우
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    displayPortStatus();
  } else if (args[0] === 'check') {
    const port = parseInt(args[1]);
    if (isNaN(port)) {
      console.error('❌ Invalid port number');
      process.exit(1);
    }
    
    checkPortInUse(port).then(inUse => {
      console.log(`Port ${port}: ${inUse ? '🔴 IN USE' : '🟢 AVAILABLE'}`);
    });
  } else if (args[0] === 'find') {
    const start = parseInt(args[1]) || 3000;
    const end = parseInt(args[2]) || 4000;
    
    findAvailablePort(start, end).then(port => {
      if (port) {
        console.log(`🟢 Available port found: ${port}`);
      } else {
        console.log(`❌ No available ports in range ${start}-${end}`);
      }
    });
  } else {
    console.log(`
Usage:
  node check-port.js                    # Show current port status
  node check-port.js check <port>       # Check specific port
  node check-port.js find <start> <end> # Find available port in range
    `);
  }
}

module.exports = { checkPortInUse, findAvailablePort, displayPortStatus };