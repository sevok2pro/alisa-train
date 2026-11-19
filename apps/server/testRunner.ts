import { execSync, exec, spawn, ChildProcess, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { cwd, stdout, stderr } from 'node:process';

// cleanup port
function findFreePort(port = 4200) {
    let processOnServerPort
    const cmd = `netstat -ano | findstr ":${port}"`
    try {
        processOnServerPort = execSync(cmd);
        // when errors it is mean port is free
    } catch (e) {
        return port
    }
    const formatProcessTable = processOnServerPort.toString().trim().split('\n')
    if (formatProcessTable.length >= 1) {
        return findFreePort(port + 1)
    }
}
const freePort = findFreePort()

async function whenServerReady(cnt = 0) {
    if (cnt >= 10) {
        return false
    }
    try {
        const response = await fetch(`http://localhost:${freePort}/ping`);
        if (response.status === 200) {
            return true
        }
        return whenServerReady(cnt + 1)
    } catch(e) {
        await new Promise((resolve) => setTimeout(() => resolve(null), 200))
        return await whenServerReady(cnt + 1);
    }
}

let testStatus: number | null;
function runTest(server: ChildProcessWithoutNullStreams) {
    const testProcess = spawn('node', ['apps/server/check.ts'], {env: {'SERVER_PORT': String(freePort)}})  
    testProcess.stdout.pipe(stdout)
    testProcess.stderr.pipe(stderr)  
    // Корректное завершение процесса  
    testProcess.on('close', (code) => {
        
        console.log(`Процесс тестов завершен с кодом: ${code}`) 
    })  
    // Процесс завершен с кодом  
    testProcess.on('exit', async (code) => {  
        testStatus = code;
        console.log('Test process exit', code);
        server.kill('SIGTERM');
    })  
    // Ошибка при запуске  
    testProcess.on('error', (error) => {
        console.log('Test process run failure');
        server.kill('SIGTERM');
        console.error(error)  
    })
}

const serverProcess = spawn('node', ['apps/server/index.ts'], {env: {'SERVER_PORT': String(freePort)}});
serverProcess.stdout.pipe(stdout);
serverProcess.stderr.pipe(stderr);
serverProcess.on('spawn', async () => {
    const isReady = await whenServerReady();
    if (isReady) {
        console.log('ready for test');
        runTest(serverProcess);
    } else {
        serverProcess.kill();
        console.error('failed to startup server')
    }
})
// Корректное завершение процесса  
serverProcess.on('close', (code) => {  
    console.log(`Процесс сервера завершен с кодом: ${code}`)  
})  
// Процесс завершен с ошибкой  
serverProcess.on('exit', (code, signal) => {  
    console.log('Server process shut down');
    if (testStatus === 0) {
        process.exit(0)
    } else {
        process.exit(1)
    }
})  
// Ошибка при запуске  
serverProcess.on('error', (error) => { 
    console.error('failed to startup server') 
    console.error(error)
    process.exit(1)
})
