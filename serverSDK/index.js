'use strict';
const http = require('http');

module.exports = async function (ctx, next) {
    let req = ctx.req;

    let requestBody = '';

    const recordStream = new stream.Transform({
        transform (chunk, encoding, callback) {
            requestBody += chunk.toString();
            callback(null, chunk);
        }
    });


    let request = http.request({
        protocol: 'http:',
        hostname: 'localhost',
        port: '7777',
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
}