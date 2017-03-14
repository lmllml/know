console.log('log');
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
let logList = [];
function findIndex (target) {
    let parent = target.parentElement;
    if (!parent) {
        return 0;
    }
    return Array.prototype.indexOf.call(parent.childNodes, target);
}

function hash (target) {
    let createOneDomHash = (dom) => {
        return dom.tagName + '-' + findIndex(dom);
    };

    let hashStr = createOneDomHash(target);
    let parent = target.parentElement;
    while (parent) {
        hashStr += '|' + createOneDomHash(parent);

        parent = parent.parentElement;
    }
    return hashStr;
}

function uploadLogList () {
    fetch('/log', {
        method: 'post',
        body: {
            data: logList.join(',')
        }
    }).then(() => {
        logList = [];
    });
}

setInterval(() => {
    uploadLogList();
}, 3000);

function createOneLog (target, type, extra) {
    let hashStr = hash(target);
    let log = {
        target: hashStr,
        type,
        timestamp: new Date().getTime(),
        extra
    };
    logList.push(log);
    console.log(JSON.stringify(log));
}

document.body.addEventListener('click', function (event) {
    var target = event.target;
    createOneLog(target, 'click');
});
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

document.body.addEventListener('change', function (event) {
    var target = event.target;
    createOneLog(target, 'change', {
        value: event.target.value
    });
});