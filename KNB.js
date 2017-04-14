const URL = require('url').URL;

class KNB {
    constructor (options) {
        this.$view = options.view;
        this.$webview = this.$view.$webview;
        this.$webviewWindow = this.$webview.contentWindow
        this.$webviewURL = new URL(this.$webview.src);
        this._subscribeMap = {};
        window.addEventListener("message", this._receiveMessage.bind(this));
        this._link();
        this._bindViewEvents();
    }

    _bindViewEvents () {
        this.$view.on('newwindow', () => {
            this.publish('disapper');
        });

        this.$view.on('childClose', () => {
            this.publish('appear');
        });
    }

    _link () {
        // 简单处理，targetOrigin为'*'
        this._postMessage({
            type: 'knbLink'
        });
    }

    _formatMessage (message) {
        return JSON.parse(JSON.stringify(message));
    }

    _receiveMessage (event) {
        // event的origin校验
        if (event.source !== this.$webviewWindow ||
            event.origin !== this.$webviewURL.origin) {
            return;
        }

        let data = event.data;
        // 不是knb调用则忽视
        if (!data ||
            data.type !== 'knbCall') {
            return;
        }

        if (this.isApiSupported(data.method)) {
            this[data.method](data.id, data.options);
        }
    }

    _triggerHandle (handleId, ...args) {
        if (!handleId) {
            return;
        }
        this._postMessage({
            type: 'knbTriggerHandle',
            handleId: handleId,
            args: args
        })
    }

    _resolve (id, ...args) {
        this._postMessage({
            type: 'knbCallback',
            id,
            success: args
        });
    }

    _reject (id, ...args) {
        this._postMessage({
            type: 'knbCallback',
            id,
            fail: args
        });
    }

    _postMessage (data) {
        data = this._formatMessage(data);

        this.$webviewWindow.postMessage(data, this.$webviewURL.origin);

    }

    isApiSupported (apiName) {
        return apiName in this;
    }

    publish (action, ...args) {
        let handleIdList = this._subscribeMap[action];
        if (!handleIdList) {
            return;
        }

        handleIdList.forEach((handleId) => {
            this._triggerHandle(handleId, ...args);
        });

    }

    setTitle (id, options) {
        this.$view.setTitle({
            text: options.title,
            handle: () => {
                this._triggerHandle(options._handleId);
            }
        });

        this.$view.renderTopBar();
        this._resolve(id);
    }

    setNavButtons (id, options) {
        let processOptions = (options)  => {
            options.handle = () => {
                this._triggerHandle(options._handleId);
            };
        }

        if (options instanceof Array) {
            options.forEach(processOptions);
        } else {
            processOptions(options);
        }


        this.$view.setNavButtons(options);
        this.$view.renderTopBar();

        this._resolve(id);
    }

    subscribe (id, options) {
        let handleId = options._handleId;
        if (!handleId) {
            this._reject(id);
            return;
        }

        if (!this._subscribeMap[options.action]) {
            this._subscribeMap[options.action] = [];
        }

        this._subscribeMap[options.action].push(handleId);

        this._resolve(id, {
            subId: handleId
        });
    }

    unsubscribe (id, options) {
        let subId = options.subId;
        let action = options.action;

        if (!subId) {
            if (!action) {
                return;
            }
            this._subscribeMap[action] = [];
            return;
        }

        let subscribeMap = this._subscribeMap;
        Object.keys(subscribeMap).forEach((action) => {
            if (subscribeMap[action]) {
                return;
            }
            this._subscribeMap[action] = subscribeMap[action].filter((handleId) => {
                return handleId !== subId;
            });
        });

        this._resolve(id);
    }

    closeWebview (id, options) {
        this.$view.goBack();
        this._resolve(id);
    }
}

module.exports = KNB;