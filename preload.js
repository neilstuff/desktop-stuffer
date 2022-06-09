const {
    contextBridge,
    ipcRenderer
} = require("electron");

const fs = require('fs');
const os = require('os');

contextBridge.exposeInMainWorld(
    "api", {
        load: () => {
            return ipcRenderer.send('load');
        },
        install: (url) => {
            return ipcRenderer.send('install', url);
        },
        on: (channel, callback) => {
            ipcRenderer.on(channel, (event, args) => {
                callback(event, args);
            });
        },
        log: (message) => {
            console.log(message);
        }

    }

);