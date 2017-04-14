((window) => {
    let fetch = function (options) {
        var req = new XMLHttpRequest();
        req.open(options.method, options.url);

        if (options.data) {
            req.send(JSON.stringify(options.data));
        }
        req.onreadystatechange = function () {
            if(req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                console.log(req.responseText);
            }
        }
    }

    let pageUrl = window.location.href;
    let pageId = pageUrl + '?' + new Date().getTime();

    function findIndex (target) {
        let parent = target.parentElement;
        if (!parent) {
            return 0;
        }
        return Array.prototype.indexOf.call(parent.children, target);
    }

    function hash (target) {
        let createOneDomHash = (dom) => {
            return dom.tagName + '-' + findIndex(dom);
        };

        let hashStr = createOneDomHash(target);
        let parent = target.parentElement;
        while (parent.tagName !== 'HTML') {
            hashStr += '|' + createOneDomHash(parent);

            parent = parent.parentElement;
        }
        return hashStr;
    }


    function createLog (target, action, detail = '') {
        let timestamp = new Date().getTime();
        let domHashStr = hash(target);

        return {
            timestamp,
            uuid: 12341234,
            pageUrl,
            pageId,
            action,
            domHashStr,
            detail
        }
    }

    function uploadLog (log) {
        fetch({
            url: 'http://localhost:7777/report',
            method: 'post',
            body: log
        });
    }

    document.body.addEventListener('click', function (event) {
        var target = event.target;
        createLog(target, 'click');
    });

    document.body.addEventListener('change', function (event) {
        var target = event.target;
        createLog(target, 'change', {
            value: event.target.value
        });
    });

    window.addEventListener('beforeunload', function(event) {
        window.log('I am the 3rd one.');
    });
})(window);


// if (window.location.search.indexOf('playback') >= 0) {
    //     return;
    // }
// var mouseCount = 0;
// var touchCount = 0;
// var mouseCountDOM = document.getElementById('mousecount');
// var touchCountDOM = document.getElementById('touchcount');
//
// document.body.addEventListener('mousemove', function (event) {
//     mouseCountDOM.innerText = "mousemove: " + (mouseCount++) + " | " + event.clientX
//         + ',' + event.clientY ;
// });
// document.body.addEventListener('touchmove', function (event) {
//     var touches = event.touches;
//     var touch = touches.item(0);
//     touchCountDOM.innerText = "touchmove: " + (touchCount++) + " | " + touch.pageX
//         + ',' + touch.pageY ;
//
//     // alert(JSON.stringify(touch));
//     // positionDOM.innerText = `x, y: ${touch.pageX}, ${touch.pageY}`;
// });
//     let logList = [];
//
//     function uploadLogList () {
//         if (!logList || !logList.length) {
//             return;
//         }
//
//         fetch('/log', {
//             method: 'post',
//             body: logList.map(JSON.stringify).join('\n')
//         }).then(() => {
//             logList = [];
//         });
//     }
//
//     setInterval(() => {
//         uploadLogList();
//     }, 3000);


    //
    // function createOneLog (target, type, extra) {
    //     let hashStr = hash(target);
    //     let log = {
    //         target: hashStr,
    //         type,
    //         timestamp: new Date().getTime(),
    //         extra
    //     };
    //
    //     logList.push(log);
    //     console.log(JSON.stringify(log));
    // }


//
// document.body.addEventListener('keyup', function (event) {
//     var target = event.target;
//     createOneLog(target, 'keyup', {
//         key: event.key
//     });
// });

// document.body.addEventListener('input', function (event) {
//     console.log(event);
//     console.log(event.target.value);
// });


