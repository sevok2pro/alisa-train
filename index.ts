import http from 'node:http'
import { hashSync, compareSync, hash, compare } from 'bcrypt'

const db: User[] = [{user: 'admin', password: hashSync('adminadminadmin', 10)}]

interface User {
    user: string;
    password: string;
}

function readJSON(body: any[]): {status: 'failure' | 'success', result?: Partial<User>} {
    try {
        return {status: 'success', result: JSON.parse(Buffer.concat(body).toString())}
    } catch(e) {
        return {status: 'failure'}
    }
}

function validateUserDto(user?: Partial<User>): {success: true} | {success: false, reason: string}{
    if (!user) {
        return {success: false, reason: 'missing username and password fields'}
    }
    if (!user.user) {
        return {success: false, reason: 'missing username field'}
    }
    if (typeof user.user !== 'string') {
        return {success: false, reason: 'user must be a string'}
    }
    if (user.user.length === 0) {
        return {success: false, reason: 'user must be a not empty string'}
    }
    if (!user.password){
        return {success: false, reason: 'missing passsword field'}
    }
    if (typeof user.password !== 'string') {
        return {success: false, reason: 'password must be a string'}
    }
    if (user.password.length < 8) {
        return {success: false, reason: 'password should have length more than 8 symbol'}
    }
    return {success: true}
}

function readUserBody(body: any[]): {status: 'failure', reason: string } | {status: 'success', result: User} {
    const json = readJSON(body);
    if(json.status === 'failure') {
        return {status: 'failure', reason: 'invalid json'}
    }
    const validation = validateUserDto(json.result);
    if (!validation.success) {
        return {status: 'failure', reason: validation.reason}
    }
    return { status: 'success', result: json.result as User }
}

type OperationResult = {status: 'success'} | {status: 'failure', reason: string, statusCode: number}

async function authenticateUser(user: User): Promise<OperationResult> {
    const bdUser = db.find(next => next.user === user.user);
    const passCompare = bdUser ? await compare(user.password, bdUser.password): false;

    if (!user || !passCompare) {
        return { status: 'failure', reason: 'invalid username or password', statusCode: 401 }
    }
    return {status: 'success'}
}

async function registerUser(user: User): Promise<OperationResult> {
    const hashedPass = await hash(user.password, 10);
    const bdUser = db.find(next => next.user === user.user);
    if (bdUser) {
        return { status: 'failure', reason: 'user already exist', statusCode: 409 };
    }
    db.push({user: user.user, password: hashedPass})
    return {status: 'success'}
}

const server = http.createServer((req, res) => {
    const { method, url } = req;
    if (url === '/login' && method === 'POST') {
        const body:any[] = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            const bodyResult = readUserBody(body);
            if (bodyResult.status === 'failure') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: bodyResult.status, reason: bodyResult.reason }))
                return;
            }

            const authResult = await authenticateUser(bodyResult.result);

            if (authResult.status === 'failure') {
                res.statusCode = authResult.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'failure', reason: authResult.reason}))
                return;
            }
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status: 'success'}))
            return;
        })
    } else 
    if (url === '/register' && method === 'POST') {
        const body: any[] = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            const bodyResult = readUserBody(body);
            if (bodyResult.status === 'failure') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: bodyResult.status, reason: bodyResult.reason }))
                return;
            }
            const registerResult = await registerUser(bodyResult.result);
            if (registerResult.status === 'failure') {
                res.statusCode = registerResult.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'failure', reason: registerResult.reason}))
                return;
            }
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status: 'success'}))
        return;
        })
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Content not found')
    }
    
    
})

server.listen(4200, '127.0.0.1', () => {
    console.log('server run')
})