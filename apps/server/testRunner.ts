import { execSync, exec } from 'node:child_process';

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

const serverProcess = exec('node apps/server/index.ts', {env: {'SERVER_PORT': String(freePort)}})  
// Данные из stdout  
serverProcess.stdout?.on('data', (data) => {  
    console.log('server output', data.toString())  
})  
// Данные из stderr  
serverProcess.stderr?.on('data', (data) => {  
    console.error(data.toString())  
});  
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

await new Promise(resolve => setTimeout(() => resolve(null), 2000)) 

const testProcess = exec('node apps/server/check.ts', {env: {'SERVER_PORT': String(freePort)}})  
// Данные из stdout  
testProcess.stdout?.on('data', (data) => {  
    console.log('test output', data.toString())  
})  
// Данные из stderr  
testProcess.stderr?.on('data', (data) => {  
    console.error(data.toString())  
});  
// Корректное завершение процесса  
testProcess.on('close', (code) => {
    console.log(`Процесс тестов завершен с кодом: ${code}`) 
    
})  
// Процесс завершен с кодом  
testProcess.on('exit', (code, signal) => {  
    serverProcess.kill();
    testProcess.kill();
    console.log(`Выход из тестов с кодом: ${code}, сигнал: ${signal}`)  
    process.exit(code)
})  
// Ошибка при запуске  
testProcess.on('error', (error) => {  
    console.error(error)  
})

