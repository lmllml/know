((window) => {
    let fetch = function (options) {
        var req = new XMLHttpRequest();
        console.log(options);
        req.open(options.method, options.url);

        if (options.body) {
            req.send(JSON.stringify(options.body));
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
        if (typeof target === 'string') {
            return target;
        }
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


    function createLog (target = '', action = '', detail = '') {
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

    function sendLoadLog () {
        let log = createLog('window', 'load');
        uploadLog(log);
    }

    document.body.addEventListener('click', function (event) {
        let log = createLog(event.target, 'click');
        uploadLog(log);
    });

    document.body.addEventListener('change', function (event) {
        let log = createLog(event.target, 'change', {
            value: event.target.value
        });
        uploadLog(log);
    });

    sendLoadLog();
})(window);

(function(window, document, exportName, undefined) {
    "use strict";

    var isMultiTouch = false;
    var multiTouchStartPos;
    var eventTarget;
    var touchElements = {};

    // polyfills
    if(!document.createTouch) {
        document.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY, clientX, clientY) {
            // auto set
            if(clientX == undefined || clientY == undefined) {
                clientX = pageX - window.pageXOffset;
                clientY = pageY - window.pageYOffset;
            }

            return new Touch(target, identifier, {
                pageX: pageX,
                pageY: pageY,
                screenX: screenX,
                screenY: screenY,
                clientX: clientX,
                clientY: clientY
            });
        };
    }

    if(!document.createTouchList) {
        document.createTouchList = function() {
            var touchList = new TouchList();
            for (var i = 0; i < arguments.length; i++) {
                touchList[i] = arguments[i];
            }
            touchList.length = arguments.length;
            return touchList;
        };
    }

    /**
     * create an touch point
     * @constructor
     * @param target
     * @param identifier
     * @param pos
     * @param deltaX
     * @param deltaY
     * @returns {Object} touchPoint
     */
    function Touch(target, identifier, pos, deltaX, deltaY) {
        deltaX = deltaX || 0;
        deltaY = deltaY || 0;

        this.identifier = identifier;
        this.target = target;
        this.clientX = pos.clientX + deltaX;
        this.clientY = pos.clientY + deltaY;
        this.screenX = pos.screenX + deltaX;
        this.screenY = pos.screenY + deltaY;
        this.pageX = pos.pageX + deltaX;
        this.pageY = pos.pageY + deltaY;
    }

    /**
     * create empty touchlist with the methods
     * @constructor
     * @returns touchList
     */
    function TouchList() {
        var touchList = [];

        touchList.item = function(index) {
            return this[index] || null;
        };

        // specified by Mozilla
        touchList.identifiedTouch = function(id) {
            return this[id + 1] || null;
        };

        return touchList;
    }


    /**
     * Simple trick to fake touch event support
     * this is enough for most libraries like Modernizr and Hammer
     */
    function fakeTouchSupport() {
        var objs = [window, document.documentElement];
        var props = ['ontouchstart', 'ontouchmove', 'ontouchcancel', 'ontouchend'];

        for(var o=0; o<objs.length; o++) {
            for(var p=0; p<props.length; p++) {
                if(objs[o] && objs[o][props[p]] == undefined) {
                    objs[o][props[p]] = null;
                }
            }
        }
    }

    /**
     * we don't have to emulate on a touch device
     * @returns {boolean}
     */
    function hasTouchSupport() {
        return ("ontouchstart" in window) || // touch events
            (window.Modernizr && window.Modernizr.touch) || // modernizr
            (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2; // pointer events
    }

    /**
     * disable mouseevents on the page
     * @param ev
     */
    function preventMouseEvents(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    /**
     * only trigger touches when the left mousebutton has been pressed
     * @param touchType
     * @returns {Function}
     */
    function onMouse(touchType) {
        return function(ev) {
            // prevent mouse events
            preventMouseEvents(ev);

            if (ev.which !== 1) {
                return;
            }

            // The EventTarget on which the touch point started when it was first placed on the surface,
            // even if the touch point has since moved outside the interactive area of that element.
            // also, when the target doesnt exist anymore, we update it
            if (ev.type == 'mousedown' || !eventTarget || (eventTarget && !eventTarget.dispatchEvent)) {
                eventTarget = ev.target;
            }

            // shiftKey has been lost, so trigger a touchend
            if (isMultiTouch && !ev.shiftKey) {
                triggerTouch('touchend', ev);
                isMultiTouch = false;
            }

            triggerTouch(touchType, ev);

            // we're entering the multi-touch mode!
            if (!isMultiTouch && ev.shiftKey) {
                isMultiTouch = true;
                multiTouchStartPos = {
                    pageX: ev.pageX,
                    pageY: ev.pageY,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    screenX: ev.screenX,
                    screenY: ev.screenY
                };
                triggerTouch('touchstart', ev);
            }

            // reset
            if (ev.type == 'mouseup') {
                multiTouchStartPos = null;
                isMultiTouch = false;
                eventTarget = null;
            }
        }
    }

    /**
     * trigger a touch event
     * @param eventName
     * @param mouseEv
     */
    function triggerTouch(eventName, mouseEv) {
        var touchEvent = document.createEvent('Event');
        touchEvent.initEvent(eventName, true, true);

        touchEvent.altKey = mouseEv.altKey;
        touchEvent.ctrlKey = mouseEv.ctrlKey;
        touchEvent.metaKey = mouseEv.metaKey;
        touchEvent.shiftKey = mouseEv.shiftKey;

        touchEvent.touches = getActiveTouches(mouseEv, eventName);
        touchEvent.targetTouches = getActiveTouches(mouseEv, eventName);
        touchEvent.changedTouches = getChangedTouches(mouseEv, eventName);

        eventTarget.dispatchEvent(touchEvent);
    }

    /**
     * create a touchList based on the mouse event
     * @param mouseEv
     * @returns {TouchList}
     */
    function createTouchList(mouseEv) {
        var touchList = new TouchList();

        if (isMultiTouch) {
            var f = TouchEmulator.multiTouchOffset;
            var deltaX = multiTouchStartPos.pageX - mouseEv.pageX;
            var deltaY = multiTouchStartPos.pageY - mouseEv.pageY;

            touchList.push(new Touch(eventTarget, 1, multiTouchStartPos, (deltaX*-1) - f, (deltaY*-1) + f));
            touchList.push(new Touch(eventTarget, 2, multiTouchStartPos, deltaX+f, deltaY-f));
        } else {
            touchList.push(new Touch(eventTarget, 1, mouseEv, 0, 0));
        }

        return touchList;
    }

    /**
     * receive all active touches
     * @param mouseEv
     * @returns {TouchList}
     */
    function getActiveTouches(mouseEv, eventName) {
        // empty list
        if (mouseEv.type == 'mouseup') {
            return new TouchList();
        }

        var touchList = createTouchList(mouseEv);
        if(isMultiTouch && mouseEv.type != 'mouseup' && eventName == 'touchend') {
            touchList.splice(1, 1);
        }
        return touchList;
    }

    /**
     * receive a filtered set of touches with only the changed pointers
     * @param mouseEv
     * @param eventName
     * @returns {TouchList}
     */
    function getChangedTouches(mouseEv, eventName) {
        var touchList = createTouchList(mouseEv);

        // we only want to return the added/removed item on multitouch
        // which is the second pointer, so remove the first pointer from the touchList
        //
        // but when the mouseEv.type is mouseup, we want to send all touches because then
        // no new input will be possible
        if(isMultiTouch && mouseEv.type != 'mouseup' &&
            (eventName == 'touchstart' || eventName == 'touchend')) {
            touchList.splice(0, 1);
        }

        return touchList;
    }

    /**
     * show the touchpoints on the screen
     */
    function showTouches(ev) {
        var touch, i, el, styles;

        // first all visible touches
        for(i = 0; i < ev.touches.length; i++) {
            touch = ev.touches[i];
            el = touchElements[touch.identifier];
            if(!el) {
                el = touchElements[touch.identifier] = document.createElement("div");
                document.body.appendChild(el);
            }

            styles = TouchEmulator.template(touch);
            for(var prop in styles) {
                el.style[prop] = styles[prop];
            }
        }

        // remove all ended touches
        if(ev.type == 'touchend' || ev.type == 'touchcancel') {
            for(i = 0; i < ev.changedTouches.length; i++) {
                touch = ev.changedTouches[i];
                el = touchElements[touch.identifier];
                if(el) {
                    el.parentNode.removeChild(el);
                    delete touchElements[touch.identifier];
                }
            }
        }
    }

    /**
     * TouchEmulator initializer
     */
    function TouchEmulator() {
        if (hasTouchSupport()) {
            return;
        }

        fakeTouchSupport();

        window.addEventListener("mousedown", onMouse('touchstart'), true);
        window.addEventListener("mousemove", onMouse('touchmove'), true);
        window.addEventListener("mouseup", onMouse('touchend'), true);

        window.addEventListener("mouseenter", preventMouseEvents, true);
        window.addEventListener("mouseleave", preventMouseEvents, true);
        window.addEventListener("mouseout", preventMouseEvents, true);
        window.addEventListener("mouseover", preventMouseEvents, true);

        // it uses itself!
        window.addEventListener("touchstart", showTouches, false);
        window.addEventListener("touchmove", showTouches, false);
        window.addEventListener("touchend", showTouches, false);
        window.addEventListener("touchcancel", showTouches, false);
    }

    // start distance when entering the multitouch mode
    TouchEmulator.multiTouchOffset = 75;

    /**
     * css template for the touch rendering
     * @param touch
     * @returns object
     */
    TouchEmulator.template = function(touch) {
        var size = 30;
        var transform = 'translate('+ (touch.clientX-(size/2)) +'px, '+ (touch.clientY-(size/2)) +'px)';
        return {
            position: 'fixed',
            left: 0,
            top: 0,
            background: '#fff',
            border: 'solid 1px #999',
            opacity: .6,
            borderRadius: '100%',
            height: size + 'px',
            width: size + 'px',
            padding: 0,
            margin: 0,
            display: 'block',
            overflow: 'hidden',
            pointerEvents: 'none',
            webkitUserSelect: 'none',
            mozUserSelect: 'none',
            userSelect: 'none',
            webkitTransform: transform,
            mozTransform: transform,
            transform: transform
        }
    };

    // export
    if (typeof define == "function" && define.amd) {
        define(function() {
            return TouchEmulator;
        });
    } else if (typeof module != "undefined" && module.exports) {
        module.exports = TouchEmulator;
    } else {
        window[exportName] = TouchEmulator;
    }
})(window, document, "TouchEmulator");

(function (window) {
    window.TouchEmulator();
    function parseStorageKey (key) {
        let bizname = "";
        if (key.indexOf(':') < 0 && config.bizname) {
            bizname = config.bizname + ":";
        }
        return '__nw__:' + bizname + key;
    }

    let config = {
        bizname: ''
    };

    function resolve (options, ...args) {
        if (typeof options.success === 'function') {
            window.setTimeout(() => {
                options.success(...args);
            }, 0);
        }
    }

    function reject (options, ...args) {
        if (typeof options.fail === 'function') {
            window.setTimeout(() => {
                options.fail(...args);
            }, 0);
        }
    }

    let RemoteCall = {
        _callList: [],
        _handleMap: {},
        _containerWindow: null,
        _containerOrigin: '',
        _uniqueKey: 1,
        _formatMessage (message) {
            return JSON.parse(JSON.stringify(message));
        },

        _getUniqueKey () {
            return this._uniqueKey++;
        },
        _postMessage (message) {
            if (!this._containerWindow ||
                !this._containerOrigin) {
                return;
            }

            let noFunctionMessage = this._formatMessage(message);

            this._containerWindow.postMessage(noFunctionMessage, this._containerOrigin);
        },

        _createLink (containerWindow, origin) {
            let needCallRemote = !this._containerWindow;

            this._containerOrigin = origin;
            this._containerWindow = containerWindow;

            if (needCallRemote) {
                this._callList.forEach((_callItem) => {
                    this.callRemote(_callItem.method, _callItem.options);
                });
            }
        },

        receiveMessage (event) {
            let data = event.data;

            if (!data) {
                return;
            }

            if (this._containerOrigin && event.origin !== this._containerOrigin) {
                return;
            }

            if (data.type === 'knbCallback') {
                this.callLocal(data);
            } else if (data.type === 'knbLink') {
                this._createLink(event.source, event.origin);
            } else if (data.type === 'knbTriggerHandle') {
                this.callHandle(data.handleId, ...data.args);
            }
        },

        callHandle (handleId, ...args) {
            let handle = this._handleMap[handleId];

            if (typeof handle === 'function') {
                handle(...args);
            }
        },

        callLocal (options) {
            let callItem = null;

            this._callList = this._callList.filter(function (_callItem) {
                if (_callItem.id === options.id) {
                    callItem = _callItem;
                    return false;
                }
                return true;
            });

            if (!callItem) {
                return;
            }

            if (options.success &&
                callItem.options.success) {
                callItem.options.success.apply(null, options.success);
            } else if (options.fail &&
                callItem.options.fail) {
                callItem.options.fail.apply(null, options.fail);
            }
        },

        callRemote (method, options) {
            let processOptions = (options)  => {
                if (options.handle) {
                    let handleId = this._getUniqueKey();
                    this._handleMap[handleId] = options.handle;
                    options._handleId = handleId;
                }
            }

            if (options instanceof Array) {
                options.forEach(processOptions);
            } else {
                processOptions(options);
            }

            let callItem = {
                id: this._getUniqueKey(),
                method,
                options
            };

            this._postMessage(Object.assign({}, callItem, {
                type: 'knbCall'
            }));

            this._callList.push(callItem);
        }
    };

    window.addEventListener('message', RemoteCall.receiveMessage.bind(RemoteCall));

    window.KNB = {
        env: {
            isDPApp: false,   // 点评容器
            isHBNB: false,    // 酒旅容器
            isMTNB: false,    // MTNB容器
            isTitans: true,  // titans容器
            isWX: false       // 微信容器
        },

        ready (callback) {
            window.setTimeout(() => {
                callback();
            }, 0);
        },

        config (options) {
            config = Object.assign({}, config, options || {});
        },

        retrieve (options) {
            let value = window.localStorage.getItem(parseStorageKey(options.key));
            resolve(options, {
                value
            });
        },

        store (options) {
            window.localStorage.setItem(parseStorageKey(options.key), options.value)
            resolve(options);
        },

        subscribe (options) {
            RemoteCall.callRemote('subscribe', options);
        },

        unsubscribe (options) {
            RemoteCall.callRemote('unsubscribe', options);
        },


        checkAuthorization (options) {
            resolve(options, {
                auth: true
            });
        },

        getLocation (options) {
            resolve(options, {
                lng: 116.48615812018191,
                lat: 40.0074563304108
            });
        },

        getCity (options) {
            resolve(options, {
                cityId: 1, // 北京
                type: 'mt'
            })
        },

        isApiSupported (options) {
            let isSupport = false;
            if (options.apiName in window.KNB) {
                isSupport = true;
            }
            resolve(options, isSupport)
        },

        getFingerprint (options) {
            resolve(options, {
                fingerprint: 'ABCD'
            })
        },

        setNavButtons (options) {
            RemoteCall.callRemote('setNavButtons', options);
        },

        setTitle (options) {
            RemoteCall.callRemote('setTitle', options);
        },

        getUA (options) {
            resolve(options, {
                appName: 'meituan',
                appVersion: '8.0.0',
                osName: 'ios',
                osVersion: '10.0.2'
            });
        },

        openWebview (options) {
            window.open(options.url);
            resolve(options);
        },

        closeWebview (options = {}) {
            RemoteCall.callRemote('closeWebview', options);
        },

        getPromiseInstance () {
            return new Proxy({}, {
                get: function (target, property) {
                    let value = KNB[property];

                    if (typeof value === 'function') {
                        return (options = {}) => {
                            return new Promise((resolve, reject) => {
                                if (!options.success) {
                                    options.success = resolve;
                                }
                                if (!options.fail) {
                                    options.fail = reject;
                                }

                                value.call(KNB, options);
                            });
                        }
                    }
                    return value;
                }
            });
        }
    };
})(window);


