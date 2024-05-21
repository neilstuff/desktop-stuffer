'use strict';

const config = require('./config.json');

const electron = require('electron');
const { app } = electron;
const { protocol } = electron;
const { ipcMain } = electron;

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

function createWindow() {

    mainWindow = new BrowserWindow({
        width: (config.mode == "debug") ? 1500 : 1200,
        height: 840,
        resizable: true,
        frame: true,
        maximizable: true,
        minHeight: 840,
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


ipcMain.on('install', function (event, arg) {
    var data = [];
    var zipfile = path.basename(new URL(arg).pathname);
    var content = "";

    var request = https.get(url.parse(arg), function (response) {
        response.on('data', (chunk) => {
            data.push(chunk);
        });

        response.on('end', function () {

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

                    zip.forEach(async function (relativePath, zipEntry) {
                        var dest = path.join(dir, zipEntry.name);


                        if (zipEntry.dir) {
                            console.log("Dir:", zipEntry.name);

                            await createDir(dest);
                        } else {
                            var content = await zip.file(zipEntry.name).async("nodebuffer");
                            console.log("Writing:", zipEntry.name);

                            fs.writeFileSync(dest, content);
                        }

                    });

                    accept("complete");

                });

            }

            var buffer = Buffer.concat(data);

            JSZip.loadAsync(buffer).then(async function (zip) {
                var dir = path.join(__dirname, 'packages');

                fs.mkdirSync(dir, {
                    recursive: true
                }, (err) => {
                    if (err) {
                        event.sender.send('install-complete', err);
                        console.log("error occurred in creating new directory", err);
                        return;
                    }
                });

                fs.writeFile(path.join(dir, zipfile), buffer, "binary", function (err) {

                    if (err) {
                        console.log(err);
                    }

                });

                event.sender.send('install-complete', 'ok');

                await expand(dir, zip);

            }).then(function (text) { });

        });

    }).on('error', function (err) {
        console.log(err.message);
        event.sender.send('retrieve-complete', err.message);
    });

});

ipcMain.on('load', async function (event, arg) {
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
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

    var dir = path.join(__dirname, 'packages');

    const files = await fs.promises.readdir(dir);

    var manifests = [];

    for (const file of files) {
        function readZip(filename) {
            return new Promise(async (accept, reject) => {

                fs.readFile(filename, async function (err, data) {

                    if (err) {

                        reject(err);
                    }

                    var manifest = await processZip(data);

                    manifest["filename"] = filename;
                    manifest["base"] = file.replace(".zip", "");
                    manifest["url"] = path.join("packages", file.replace(".zip", ""), "index.html");
                    manifest["manifest"] = path.join("packages", file.replace(".zip", ""), ".manifest");
                    manifest["path"] = path.join("packages", file);

                    accept(manifest);

                });

            });

        }

        var filename = path.join(__dirname, 'packages', file);

        if (filename.endsWith(".zip")) {
            console.log("Loading: ", filename);

            var manifest = await readZip(filename)

            manifests.push(manifest);

            console.log("Unzipping: ", filename);

            fs.createReadStream(filename)
                .pipe(unzipper.Extract({ path: path.join(__dirname, 'packages', file.replace(".zip", "")) }));


        } else {
            console.log("Removing: ", filename);

            fs.rmSync(filename, { recursive: true, force: true });
        }

    }

    await sleep(500);

    console.log("Load Completed...");

    event.sender.send('load-complete', JSON.stringify(manifests));

});