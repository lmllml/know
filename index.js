'use strict';

let Koa = require('koa');
let koaRouter = require('koa-router');
let config = require('config');
let fs = require('fs');

let app = new Koa();
let router = new koaRouter();

router.all(/^\/api\/.*$/, function (ctx, next) {
    ctx.body = 'Hello Api';
});

router.all(/^\/log\/.*$/, function (ctx, next) {
    ctx.body = 'Hello Log';
});

router.all(/^\/.*$/, function (ctx, next) {
    let htmlContent = fs.readFileSync(`.${ctx.path}`, {encoding: 'utf-8'});
    ctx.body = htmlContent;
});

app.use(router.routes()).listen(config.port);
console.log(`server listen in ${config.port}`);