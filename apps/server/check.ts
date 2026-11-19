import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { env } from 'node:process';


const host = `http://localhost:${env['SERVER_PORT'] || 4200}`

test('empty body check', async () => {
    const result = await fetch(`${host}/login`, { method: 'POST' });
    const data = await result.json() as {reason: string};
    assert.equal(result.status, 400);
    assert.equal(data.reason, 'invalid json')
})

test('admin/admin login success', async () => {
    const adminAuth = await fetch(`${host}/login`, { method: 'POST', body: JSON.stringify({user: 'admin', password: 'adminadminadmin'}) });
    const data = await adminAuth.json() as { status: string };
    assert.equal(adminAuth.status, 200)
    assert.equal(data?.status, 'success')
})

test('admin/admin login with wrong password failure', async () => {
    const adminAuth = await fetch(`${host}/login`, { method: 'POST', body: JSON.stringify({user: 'admin', password: 'adminadminadmin2'}) });
    const data = await adminAuth.json() as { reason: string };
    assert.equal(adminAuth.status, 401)
    assert.equal(data?.reason, 'invalid username or password')
})

test('admin/admin login with wrong name failure', async () => {
    const adminAuth = await fetch(`${host}/login`, { method: 'POST', body: JSON.stringify({user: 'admin2', password: 'adminadminadmin'}) });
    const data = await adminAuth.json() as { reason: string };
    assert.equal(adminAuth.status, 401)
    assert.equal(data?.reason, 'invalid username or password')
})

test('new user can register and then login', async () => {
    const newUserPass = randomUUID();
    const newUser = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    const newUserResponse = await newUser.json() as {status: string};
    assert.equal(newUser.status, 201);
    assert.equal(newUserResponse.status, 'success');
    const newUserAuth = await fetch(`${host}/login`, { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    const newUserLogin = await newUserAuth.json() as {status: 'success'};
    assert.equal(newUserAuth.status, 200);
    assert.equal(newUserLogin.status, 'success');
})

test('short password reject', async () => {
    const newUserPass = randomUUID();
    const newUser = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user2', password: newUserPass.slice(0, 4)}) });
    const newUserResponse = await newUser.json() as {status: string, reason: string};
    assert.equal(newUser.status, 400);
    assert.equal(newUserResponse.status, 'failure');
    assert.equal(newUserResponse.reason, 'password should have length more than 8 symbol');
})

test('without password reject', async () => {
    const newUser = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user3'}) });
    const newUserResponse = await newUser.json() as {status: string, reason: string};
    assert.equal(newUser.status, 400);
    assert.equal(newUserResponse.status, 'failure');
    assert.equal(newUserResponse.reason, 'missing password field');
})

test('with password is object reject', async () => {
    const newUser = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user5', password: {kek: 'kek'}}) });
    const newUserResponse = await newUser.json() as {status: string, reason: string};
    assert.equal(newUser.status, 400);
    assert.equal(newUserResponse.status, 'failure');
    assert.equal(newUserResponse.reason, 'password must be a string');
})

test('second register with same name will reject', async () => {
    const newUserPass = randomUUID();
    const newUser = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    const newUserAuth = await fetch(`${host}/register`, { method: 'POST', body: JSON.stringify({user: 'user1', password: randomUUID()}) });
    const newUserLogin = await newUserAuth.json() as {status: string, reason: string};
    assert.equal(newUserAuth.status, 409);
    assert.equal(newUserLogin.status, 'failure');
    assert.equal(newUserLogin.reason, 'user already exist');
})