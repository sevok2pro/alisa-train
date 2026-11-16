import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('empty body check', async () => {
    const result = await fetch('http://localhost:4200/login', { method: 'POST' });
    const data = await result.json() as {reason: string};
    assert.equal(result.status, 400);
    console.log(data.reason)
    assert.equal(data.reason, 'invalid json')
})

test('admin/admin login success', async () => {
    const adminAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin', password: 'adminadminadmin'}) });
    const data = await adminAuth.json() as { status: string };
    assert.equal(adminAuth.status, 200)
    assert.equal(data?.status, 'success')
})

test('admin/admin login with wrong password failure', async () => {
    const adminAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin', password: 'adminadminadmin2'}) });
    const data = await adminAuth.json() as { reason: string };
    assert.equal(adminAuth.status, 401)
    assert.equal(data?.reason, 'invalid username or password')
})

test('admin/admin login with wrong name failure', async () => {
    const adminAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'admin2', password: 'adminadminadmin'}) });
    const data = await adminAuth.json() as { reason: string };
    assert.equal(adminAuth.status, 401)
    assert.equal(data?.reason, 'invalid username or password')
})

test('new user can register and then login', async () => {
    const newUserPass = randomUUID();
    const newUser = await fetch('http://localhost:4200/register', { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    const newUserResponse = await newUser.json() as {status: string};
    assert.equal(newUser.status, 201);
    assert.equal(newUserResponse.status, 'success');
    const newUserAuth = await fetch('http://localhost:4200/login', { method: 'POST', body: JSON.stringify({user: 'user1', password: newUserPass}) });
    const newUserLogin = await newUserAuth.json() as {status: 'success'};
    assert.equal(newUserAuth.status, 200);
    assert.equal(newUserLogin.status, 'success');
})