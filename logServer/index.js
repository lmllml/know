const Koa = require('koa');
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');

const app = new Koa();
const router = new Router();


const port = 7777;

const logFile = fs.createWriteStream(path.resolve(process.cwd(), './logServer/log.txt'), {
    flags: 'a',
    defaultEncoding: 'utf8'
});

const apiLogFile = fs.createWriteStream(path.resolve(process.cwd(), './logServer/apiLog.txt'), {
    flags: 'a',
    defaultEncoding: 'utf8'
});

app.use(async function (ctx, next) {
    ctx.set('Access-Control-Allow-Origin', '*');
    await next();
});

router.post('/report', async function (ctx, next) {
    ctx.body = "ok";
    ctx.req.pipe(logFile, {
        end: false
    });
    ctx.req.on('end', () => {
        logFile.write('\n')
    });
    await next();
});

router.post('/apiReport', async function (ctx, next) {
    ctx.body = "ok";
    ctx.req.pipe(apiLogFile, {
        end: false
    });
    ctx.req.on('end', () => {
        apiLogFile.write('\n')
    });
    await next();
});

app.use(router.routes()).use(router.allowedMethods()).listen(port, () => {
    console.log(`logServer listen in ${port}`);
});

