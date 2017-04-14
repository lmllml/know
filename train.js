'use strict';

// let firstValueDOM = document.querySelector('#firstValue');
let bodyDOM = document.querySelector('body');

let observer = new MutationObserver(function (records) {
    console.log(records);
});

let config = {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
};


observer.observe(bodyDOM, config);