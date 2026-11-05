import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const types = {'.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.jpg':'image/jpeg', '.png':'image/png', '.gif':'image/gif', '.svg':'image/svg+xml'};

const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, {Allow:'GET, HEAD'}).end();
        return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
    catch { response.writeHead(400).end('Bad request'); return; }
    if (pathname.split(/[\\/]/).some(segment => segment.startsWith('.'))) { response.writeHead(403).end('Forbidden'); return; }
    const path = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!path.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
    try {
        const body = await readFile(path);
        response.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream', 'Content-Length':body.length, 'Cache-Control':'no-cache'});
        response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
        response.writeHead(['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 500).end('File unavailable');
    }
});

server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? 'Port 8081 sedang dipakai. Tutup server story sebelumnya, lalu coba lagi.' : error.message);
    process.exitCode = 1;
});
server.listen(8081, '127.0.0.1', () => {
    console.log('Jangan Buka HP Orang!\nBuka http://127.0.0.1:8081/\nCtrl+C untuk berhenti.');
});
