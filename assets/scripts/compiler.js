function Compiler(document) {

    this._document = document;
    this._zip = new JSZip();

};

Compiler.prototype.compile = async function (zipBuffer, manifest) {

    let packager = new JSZip();

    const promises = [];

    const zip = await this._zip.loadAsync(zipBuffer);

    console.log("ZIP file loaded");

    zip.forEach(function (relativePath, zipEntry) {

        if (!zipEntry.dir && !zipEntry.name.startsWith(".manifest/")) {

            promises.push(zipEntry.async("arraybuffer").then(content => {
                console.log(`Processing file:  "${zipEntry.name}`);

                packager.file(zipEntry.name, content);

            }));
        }

    });

    await Promise.all(promises);

    var data = await packager.generateAsync({ type: "base64" });

    console.log(data);

    return data;

}