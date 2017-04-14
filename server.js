const http = require('http');
const config = require('config');
const url = require('url');
const stream = require('stream');
const fs = require('fs');
const path = require('path');

const logFile = fs.createWriteStream('./log.txt', {
    flags: 'r+',
});

const actionLogFile = fs.createWriteStream('./action.txt', {
    flags: 'r+'
});

actionLogFile.on('error', (err) => {
    console.log(`actionLogFile出现错误: ${JSON.stringify(err)}`)
});

let server = http.createServer(function (req, res) {
    let urlObject = url.parse(req.url);

    if (/\.html|\.js$/.test(urlObject.path)) {
        let file = fs.readFileSync(path.resolve(process.cwd(), urlObject.pathname.substring(1)));
        return res.end(file);
    }

    if (/^\/log$/.test(urlObject.pathname)) {
        actionLogFile.write('\n', 'utf-8');
        req.pipe(actionLogFile, {
            end: false
        });
        return res.end('log ok');
    }

    if (/^\/loglist$/.test(urlObject.pathname)) {
        return res.end(fs.readFileSync('./action.txt', 'utf-8'));
    }

    let requestBody = '';
    const recordStream = new stream.Transform({
        transform (chunk, encoding, callback) {
            requestBody += chunk.toString();
            callback(null, chunk);
        }
    });


    let request = http.request({
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: '3002',
        method: req.method,
        path: urlObject.path,
        headers: req.headers,
        timeout: 10000
    }, function (response) {
        response.on('data', (chunk) => {
            console.log(`Response from server2 ${chunk}`);
        });
        response.on('end', () => {
            let data = req.method + ' ' + req.url + ' '+ req.httpVersion + '\r\n' + JSON.stringify(req.headers) + '\r\n' + requestBody + '\r\n';
            logFile.write(data);
            res.end('from server1');
        })
    });

    request.on('error', (e) => {
        console.log(`请求遇到问题: ${JSON.stringify(e)}`);
    });

    req.pipe(recordStream).pipe(request);
});

server.listen(config.port, () => {
    console.log(`Server listen in ${config.port}`);
});


let server2 = http.createServer(function (req, res) {
    console.log(`s2 req-url: ${req.url}`);
    console.log(`s2 req-method: ${JSON.stringify(req.method)}`);
    console.log(`s2 req-httpversion: ${req.httpVersion}`)
    console.log(`s2 req-header: ${JSON.stringify(req.headers)}`);

    req.on('data', (data) => {
        console.log('server2: ' + data);
    });

    req.on('end', () => {
        res.end('ok');
    });
});

server2.listen(3002, () => {
    console.log(`Server2 listen in 3002`);
});