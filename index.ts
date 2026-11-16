import http from 'node:http'
import { hashSync, compareSync, hash, compare } from 'bcrypt'

const db: User[] = [{user: 'admin', password: hashSync('admin', 10)}]

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
    if (!user.password){
        return {success: false, reason: 'missing passsword field'}
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
            
            const user = db.find(next => next.user === bodyResult.result.user);
            const passCompare = user ? await compare(bodyResult.result.password, user.password): false;

            if (!user || !passCompare) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'failure', reason: 'invalid username or password'}))
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
            const user = db.find(next => next.user === bodyResult.result.user);
            if (user) {
                res.statusCode = 409;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'failure', reason: 'user already exist'}))
                return;
            }
            const hashedPass = await hash(bodyResult.result.password, 10);
            db.push({user: bodyResult.result.user, password: hashedPass})
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