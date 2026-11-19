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

function runTest(server: ChildProcessWithoutNullStreams) {
    const testProcess = spawn('node', ['apps/server/check.ts'], {env: {'SERVER_PORT': String(freePort)}})  
    testProcess.stdout.pipe(stdout)
    testProcess.stderr.pipe(stderr)  
    // Корректное завершение процесса  
    testProcess.on('close', (code) => {
        console.log(`Процесс тестов завершен с кодом: ${code}`) 
    })  
    // Процесс завершен с кодом  
    testProcess.on('exit', (code, signal) => {  
        server.kill();
        testProcess.kill();
        console.log(`Выход из тестов с кодом: ${code}, сигнал: ${signal}`)  
        process.exit(code)
    })  
    // Ошибка при запуске  
    testProcess.on('error', (error) => {  
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
        console.error('failed to startup server')
        process.exit(1);
    }
})
// Корректное завершение процесса  
serverProcess.on('close', (code) => {  
    console.log(`Процесс сервера завершен с кодом: ${code}`)  
})  
// Процесс завершен с ошибкой  
serverProcess.on('exit', (code, signal) => {  
    console.log(`Выход из сервера с кодом: ${code}, сигнал: ${signal}`)  
    process.exit(1)
})  
// Ошибка при запуске  
serverProcess.on('error', (error) => {  
    console.error(error)  
})
