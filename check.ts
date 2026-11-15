import http from 'node:http'

const agent = new http.Agent({keepAlive: true})

async function test() {
    // http.request('http://localhost:4200', {agent, method: 'POST'}, (response) => {
    //     response.resume();
    //     response.on('data', (data) => {
    //         console.log('data: ', data.toString())
    //     })
    //     response.on('end', () => {
    //         console.log('complete: ', response.complete)
    //     })
    // })

    http.get('http://localhost:4200/auth', {agent, method: 'POST'}, (response) => {
        response.resume();
        response.on('data', (data) => {
            console.log('data: ', data.toString())
        })
        response.on('end', () => {
            console.log('complete: ', response.complete)
        })
    })
}

test();