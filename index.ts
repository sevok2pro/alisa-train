import http from 'node:http'
import { hashSync, compareSync } from 'bcrypt'

const db = [{user: 'admin', password: hashSync('admin', 10)}]

function readJSON(body: any[]) {
    try {
        return {status: 'success', result: JSON.parse(Buffer.concat(body).toString())}
    } catch(e) {
        return {status: 'failure'}
    }
}

const server = http.createServer((req, res) => {
    const { method, url } = req;
    if (url === '/login' && method === 'POST') {
        const body:any[] = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const { result: bodyData, status } = readJSON(body);
            if (status === 'failure') {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/json');
                res.end(JSON.stringify({status: 'failure', reason: 'invalid json request body'}))
                return;
            }
            const user = db.find(next => next.user === bodyData.user);
            if (!user) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/json');
                res.end(JSON.stringify({status: 'failure', reason: 'user not found'}))
                return;
            }
            const passCompare = compareSync(bodyData.password, user.password);
            if (!passCompare) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/json');
                res.end(JSON.stringify({status: 'failure', reason: 'password is wrong'}))
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/json');
            res.end(JSON.stringify({status: 'success'}))
            return;
        })
    } else 
    if (url === '/register' && method === 'POST') {
        const body: any[] = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const { result: bodyData, status } = readJSON(body);
            if (status === 'failure') {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/json');
                res.end(JSON.stringify({status: 'failure', reason: 'invalid json request body'}))
                return;
            }
            const user = db.find(next => next.user === bodyData.user);
            if (user) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/json');
                res.end(JSON.stringify({status: 'failure', reason: 'user already exist'}))
                return;
            }
            db.push({user: bodyData.user, password: hashSync(bodyData.password, 10)})
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/json');
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