(function (window) {
    const URL = require('url');
    const EventEmitter = require('events');

    function appendButton(buttonsWrapper, navButton) {
        let button = document.createElement('div');
        button.classList.add('button');

        if (navButton.type === 'text') {
            button.innerText = navButton.text;
        } else {
            let img = document.createElement('img');
            img.src = navButton.icon;
            button.appendChild(img);
        }

        if (navButton.handle) {
            button.addEventListener('click', navButton.handle)
        }

        buttonsWrapper.appendChild(button)
    }

    class View extends EventEmitter {
        constructor(options) {
            super();
            this.$options = options;
            this.$src = this._handleProtocol(options.src);

            this._bindEvents();
            this.setTitle(options.title)
            this.setNavButtons(options.navButtons);
        }

        destroy () {
            this.$el.remove();
            this.$el = null;

            // hack的做法
            let parentView = this.$parentView;
            if (parentView) {
                parentView.emit('childClose');
                parentView.$childView = null;
            }
        }

        _handleProtocol (url) {
            if (url.startsWith('imeituan://')) {
                let urlObject = URL.parse(url, true);
                url = window.decodeURIComponent(urlObject.query.url);
            }
            return url;
        }

        _bindEvents () {
            let events = this.$options.events;
            if (events) {
                Object.keys(events).forEach((key) => {
                     this.on(key, events[key]);
                });
            }
        }

        _setWebviewCookie (cookies) {
            let urlObject = new URL.URL(this.$src);

            let url = urlObject.origin;
            let storeId = this.$webview.getCookieStoreId();

            Object.keys(cookies).forEach((name) => {
                let value = cookies[name].toString();
                chrome.cookies.set({
                    url,
                    storeId,
                    name,
                    value
                });
            });

        }

        goBack () {
            let webview = this.$webview;

            if (!webview) {
                return;
            }

            if (webview.canGoBack()) {
                webview.back();
            } else {
                webview.dispatchEvent(new Event('close'))
            }
        }

        formatWebview () {
            let webview = this.$webview;
            if (!webview) {
                return;
            }

            webview.addEventListener('loadstop', () => {
                this._setWebviewCookie({
                    cityid: 1 // 北京
                });

                this.emit('loadstop', this);
            });


            webview.addEventListener('dialog', function (e) {
                window[e.messageType](e.messageText)
            });

            webview.addEventListener('newwindow', (e) => {
                this.$childView = View.render({
                    src: e.targetUrl
                });

                this.$childView.$parentView = this;

                this.emit('newwindow', this.$childView);
            });

            webview.addEventListener('close', () => {
                this.emit('close');
                this.destroy();
            });

            webview.request.onRequest.addRules([{
                conditions: [
                    new chrome.webViewRequest.RequestMatcher({
                        url: {
                            pathContains: '/knb.js'
                        }
                    })
                ],

                actions: [
                    new chrome.webViewRequest.RedirectRequest({
                        redirectUrl: 'http://localhost:9999/nwKNB.js'
                    })
                ]
            }]);

            return webview;
        }

        setTitle (title = '') {
            if (!title || typeof title === 'string') {
                title = {
                    text: title
                }
            }

            this.$title = title;
        }

        setNavButtons(navButtons) {
            if (!this.$navButtons) {
                this.$navButtons = [{
                    position: 'LL',
                    type: 'image',
                    icon: './assets/back.png',
                    handle: () => {
                        this.goBack();
                    }
                }];
            }

            if (!navButtons) {
                return;
            }

            if (!(navButtons instanceof Array)) {
                navButtons = [navButtons];
            }

            navButtons.forEach((navButton) => {
                for (let i = 0; i < this.$navButtons.length; i++) {
                    let $navButton = this.$navButtons[i];
                    if ($navButton.position === navButton.position) {
                        this.$navButtons[i] = navButton;
                        return;
                    }
                }
                this.$navButtons.push(navButton);
            });
        }


        render() {
            let pageDOM = document.createElement('div');
            pageDOM.classList.add('page');

            let topBannerDOM = document.createElement('div');
            topBannerDOM.classList.add('top-banner');

            this.$el = pageDOM

            this.renderTopBar();
            this.renderWebview();

            document.body.appendChild(this.$el);
        }

        renderTopBar () {
            if (!this.$el) {
                throw new Error('this.$el不存在，必须先调用render函数');
            }

            let topBannerDOM = document.createElement('div');
            topBannerDOM.classList.add('top-banner');

            let leftButtonsDOM = document.createElement('div');
            leftButtonsDOM.classList.add('left-buttons', 'buttons');

            let rightButtonsDOM = document.createElement('div');
            rightButtonsDOM.classList.add('right-buttons', 'buttons');

            let titleDOM = document.createElement('div');
            titleDOM.classList.add('title');


            ['LL', 'LR', 'RL', 'RR'].forEach((position) => {
                let navButton = this.$navButtons.find((_navButton) => {
                    // 不设置BUTTON
                    if (_navButton.disable) {
                        return;
                    }

                    return _navButton.position === position;
                });

                if (!navButton) {
                    navButton = {
                        position,
                        type: 'text',
                        text: ''
                    }
                }

                if (navButton.position[0] === 'L') {
                    appendButton(leftButtonsDOM, navButton);
                } else if (navButton.position[0] === 'R') {
                    appendButton(rightButtonsDOM, navButton);
                }
            });


            titleDOM.innerHTML = this.$title.text;
            if (this.$title.handle) {
                titleDOM.addEventListener('click', () => {
                    this.$title.handle();
                });
            }

            topBannerDOM.appendChild(leftButtonsDOM);
            topBannerDOM.appendChild(titleDOM);
            topBannerDOM.appendChild(rightButtonsDOM);

            let oldTopBannerDOM = this.$el.querySelector('.top-banner');
            if (oldTopBannerDOM) {
                this.$el.replaceChild(topBannerDOM, oldTopBannerDOM);
            } else {
                this.$el.appendChild(topBannerDOM);
            }
        }

        renderWebview() {
            if (!this.$el) {
                throw new Error('this.$el不存在，必须先调用render函数');
            }
            let webview = document.createElement('webview');
            webview.src = this.$src;
            webview.classList.add('content');

            let oldWebview = this.$el.querySelector('webview');
            if (oldWebview) {
                this.$el.replaceChild(webview, oldWebview);
            } else {
                this.$el.appendChild(webview);
            }

            this.$webview = webview;
            this.formatWebview();
        }

    }

    View.render = function (options) {
        let view = new View(options);

        view.render();
        return view;
    }

    window.View = View;
})(window);

