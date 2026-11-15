import http from 'node:http'
import { hashSync } from 'bcrypt'

const db = [{user: 'admin', password: hashSync('admin', 10)}]

const server = http.createServer((req, res) => {
    console.log(req.method, req.url)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.end(JSON.stringify({ok: 1}))
})

server.listen(4200, '127.0.0.1', () => {
    console.log('server run')
})