var KNB = require('./KNB.js');
var win = nw.Window.get();
win.width = 375;
win.height = 667;


window.onload = function () {
    function bindEvents (view, events) {
        Object.keys(events).forEach((key) => {
            view.on(key, events[key]);
        });
    }

    let homeView = View.render({
        src: 'http://localhost:8080/c/fe/home',
    });


    let events = {
        loadstop: (view) => {
            new KNB({
                view
            });
        },
        newwindow: (childView) => {
            bindEvents(childView, events);
        }
    }

    bindEvents(homeView, events);
}