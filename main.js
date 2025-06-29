'use strict';

const config = require('./config.json');

const electron = require('electron');
const { app } = electron;
const { protocol } = electron;
const { ipcMain } = electron;
const { dialog } = electron;

const BrowserWindow = electron.BrowserWindow;

const mime = require('mime');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const https = require('https');
var JSZip = require("jszip");
var unzipper = require("unzipper");

var mainWindow = null;
const PACKAGES = "packages"
const CACHE = ".cache"

function installPackage(filename) {

    return new Promise(async (accept, reject) => {
        console.log("COPY - File name: " + filename);
        console.log("COPY - Base Name: " + path.basename(filename));

        var destination = path.join(__dirname, PACKAGES, path.basename(filename));

        fs.copyFile(filename, destination, (err) => {
            if (err) {
                reject(err);
            }
            accept(0);
            console.log('File installed correctly');
        });

    });

}

function expand(dir, zip) {

    return new Promise(async (accept, reject) => {

        function createDir(dir) {

            return new Promise(async (accept, reject) => {

                fs.mkdirSync(dir, {
                    recursive: true
                }, (err) => {
                    if (err) {
                        reject(dir);
                        return;
                    } else {
                        accept(dir)
                    }
                });

            })

        }

        const files = zip.folder("/");

        console.log(files);

        accept("complete");

    });

}

function processZip(data) {

    return new Promise(async (accept, reject) => {
        var zip = new JSZip();
        var manifest = {};

        zip.loadAsync(data).then(async function (zip) {

            var files = zip.filter(function (relativePath, file) {
                return relativePath.endsWith(".manifest/manifest.json");
            });

            var content = await files[0].async("string");

            manifest = JSON.parse(content);

        }).then(function () {
            accept(manifest);
        });

    });

}

function readZip(base, filename) {
    return new Promise(async (accept, reject) => {

        fs.readFile(filename, async function (err, data) {

            if (err) {

                reject(err);
            }

            var manifest = await processZip(data);
            var archive = base.replace(".zip", "");

            manifest["filename"] = filename;
            manifest["base"] = archive;
            manifest["url"] = path.join(CACHE, archive, "index.html");
            manifest["manifest"] = path.join(CACHE, archive, ".manifest");
            manifest["path"] = path.join(CACHE, base);

            accept(manifest);

        });

    });

}

function createWindow() {

    mainWindow = new BrowserWindow({
        width: (config.mode == "debug") ? 1500 : 1200,
        height: 880,
        resizable: true,
        frame: true,
        maximizable: true,
        minHeight: 880,
        minWidth: (config.mode == "debug") ? 1500 : 1200,
        fullscreenable: true,
        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false,
            preload: path.join(__dirname, "preload.js")
        }

    });

    if (config.mode == "debug") {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.setMenu(null);
    mainWindow.setTitle('Neil\'s Navigator');
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }))

    mainWindow.on('closed', () => {
        mainWindow = null
    })

}

app.on('ready', () => {

    createWindow();

});

ipcMain.on('install', async function (event) {

    console.log(os.type());

    var result = await dialog.showOpenDialogSync(os.type() != 'Darwin' ? {
        properties: ['createDirectory'],
        filters: [
            { name: 'zip', extensions: ['zip'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    } : {
        properties: ['openFile', 'openDirectory', 'createDirectory'],
        filters: [
            { name: 'zip', extensions: ['zip'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    for(const filename of result) {
        var status = await installPackage(filename);

        var dir = path.join(__dirname, PACKAGES);

        var manifest = await readZip(path.basename(filename), filename)

        console.log("Unzipping: ", path.basename(filename), filename);

        fs.createReadStream(filename)
            .pipe(unzipper.Extract({ path: path.join(__dirname, CACHE, path.basename(filename).replace(".zip", "")) }));

        event.sender.send('install-complete', JSON.stringify(manifest));
    }

});

ipcMain.on('load', async function (event, arg) {
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    fs.rmSync(path.join(__dirname, CACHE), { recursive: true, force: true });

    var dir = path.join(__dirname, PACKAGES);

    const files = await fs.promises.readdir(dir);

    var manifests = [];

    for (const file of files) {

        var filename = path.join(__dirname, PACKAGES, file);

        if (filename.endsWith(".zip")) {
            console.log("Loading: ", filename);

            var manifest = await readZip(file, filename)

            manifests.push(manifest);

            console.log("Unzipping: ", filename);

            fs.createReadStream(filename)
                .pipe(unzipper.Extract({ path: path.join(__dirname, CACHE, file.replace(".zip", "")) }));


        } else {
            console.log("Removing: ", filename);

            fs.rmSync(filename, { recursive: true, force: true });
        }

    }

    await sleep(500);

    console.log("Load Completed...");

    event.sender.send('load-complete', JSON.stringify(manifests));

});