const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "api", {
        load: () => {
            return ipcRenderer.send('load');
        },
        upload: () => {
            return ipcRenderer.send('upload');
        },
        compile: () => {
            return ipcRenderer.send('compile');
        },
        install: () => {
            return ipcRenderer.send('install');
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