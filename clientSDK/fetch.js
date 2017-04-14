let fetch = function (options) {
    var req = new XMLHttpRequest();
    req.open(options.method, options.url);

    req.send(JSON.stringify(options.data));
    req.onreadystatechange = function () {
        if(req.readyState === XMLHttpRequest.DONE && req.status === 200) {
            console.log(req.responseText);
        }
    }
}