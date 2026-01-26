function Compiler(document) {

    this._document = document;
    this._zip = new JSZip();

};

Compiler.prototype.compile = async function (zipBuffer, manifest, iconBuffer, bannerBuffer) {
    let packager = new JSZip();

    const promises = [];

    const zip = await this._zip.loadAsync(zipBuffer);

    zip.forEach(function (relativePath, zipEntry) {

        if (!zipEntry.dir && !zipEntry.name.startsWith(".manifest/")) {

            promises.push(zipEntry.async("arraybuffer").then(content => {
                packager.file(zipEntry.name, content);
            }));
        }

    });

    await Promise.all(promises);

    packager.file(".manifest/manifest.json", JSON.stringify(manifest));
    packager.file(".manifest/graphics/icon.png", iconBuffer);
    packager.file(".manifest/graphics/banner.png", bannerBuffer);

    var data = await packager.generateAsync({ type: "base64" });
    
    return data;

}