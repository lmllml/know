(() => {
    if (location.search.indexOf('playback') < 0) {
        return;
    }

    fetch('/loglist').then((res) => {
        return res.text();
    }).then((res) => {
        let actionList = res.split('\n').filter((item) => item).map(JSON.parse.bind(JSON));
        play(actionList);
    });

    function play (actionList) {
        let index = 0;
        let step = () => {
            let currentFrame = actionList[index];
            playOneFrame(currentFrame, () => {
                let nextIndex = index + 1;
                if (nextIndex > actionList.length -1) {
                    return;
                }

                index = nextIndex;
                setTimeout(step, actionList[nextIndex].timestamp - currentFrame.timestamp);
                return;
            });
        }

        step();
    }

    function playOneFrame (frame, callback) {
        let element = lookElement(frame.target);
        console.log(element);
        switch (frame.type) {
            case 'click':
                element.click();
                break;
            case 'change':
                element.value = frame.extra.value;
                break;
        }
        callback();
    }


    function lookElement (target) {
        let queryString = target.split('|').reverse().reduce((str, item) => {
            let arr = item.split('-');
            let itemStr = arr[0] + ':nth-child(' + (Number(arr[1]) + 1) + ')';
            return str += itemStr + '>';
        }, '');
        queryString = queryString.slice(0, -1);
        return document.querySelector(queryString);
    }

})();