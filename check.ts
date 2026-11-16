import { randomUUID } from 'node:crypto'

async function test() {
    const adminAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin', password: 'admin'}) });
    console.log('adminAuth', await adminAuth.json())

    const adminAuthUserNotFound = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin2', password: 'admin'}) });
    console.log('adminAuthUserNotFound', await adminAuthUserNotFound.json())

    const adminAuthPassWrong = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin', password: 'admin2'}) });
    console.log('adminAuthPassWrong', await adminAuthPassWrong.json())

    const newUserPass = randomUUID();
    const newUser = await fetch('http://localhost:4200/register', { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    console.log('newUser', await newUser.json())
    const newUserAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    console.log('newUserAuth', await newUserAuth.json())

    const userSameNameError = await fetch('http://localhost:4200/register', { method: 'POST', body: JSON.stringify({user: 'user1', password: 'user1'}) });
    console.log('userSameNameError', await userSameNameError.json())
}

test();