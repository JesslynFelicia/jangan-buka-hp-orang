import assert from 'node:assert/strict';
import {request} from 'node:http';

const base = 'http://127.0.0.1:8081/';
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes('Jangan Buka HP Orang!'));
for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
    assert.equal((await fetch(new URL(asset, base))).status, 200, asset);
}
const credits = await (await fetch(new URL('credits.html', base))).text();
assert.equal((credits.match(/<li>/g) || []).length, 25);
assert.ok(credits.includes('Papermark'));
assert.equal((await fetch(base + 'missing.js')).status, 404);
assert.equal((await fetch(base, {method:'POST'})).status, 405);
const head = await fetch(base, {method:'HEAD'});
assert.equal(head.status, 200);
assert.equal(await head.text(), '');
for (const [path, status] of [['/%zz',400], ['/.git/config',403], ['/%2egit/config',403], ['/%2egit%5cconfig',403], ['/.env',403], ['/..%5c..%5c.env',403]]) {
    const result = await new Promise((resolve,reject) => {
        request(base,{path},response => {response.resume();resolve(response.statusCode);}).on('error',reject).end();
    });
    assert.equal(result,status,path);
}
console.log('PASS: standalone pages/assets/credits, GET/HEAD, missing files, invalid paths, and hidden Git/env files.');
