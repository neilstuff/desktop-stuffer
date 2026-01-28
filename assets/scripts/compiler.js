function Compiler(document) {

    this._document = document;
    this._zip = new JSZip();

};

Compiler.prototype.compile = async function (zipBuffer, manifest, iconId, bannerId) {
    async function arrayBufferFromBase64Image(base64DataUrl) {
        try {
            // Fetch the data from the Data URL
            const response = await fetch(base64DataUrl);

            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Get the response body as an ArrayBuffer
            const arrayBuffer = await response.arrayBuffer();

            return arrayBuffer;

        } catch (error) {
            console.error("Could not fetch the image data:", error);
            return null;
        }
    }

    let package = new JSZip();

    const promises = [];

    const zip = await this._zip.loadAsync(zipBuffer);

    zip.forEach(function (relativePath, zipEntry) {

        if (!zipEntry.dir && !zipEntry.name.startsWith(".manifest/")) {

            promises.push(zipEntry.async("arraybuffer").then(content => {
                package.file(zipEntry.name, content);
            }));
        }

    });

    await Promise.all(promises);

    var bannerImage = document.getElementById(bannerId).src;
    var iconImage = document.getElementById(iconId).src;

    var iconBuffer = await arrayBufferFromBase64Image(iconImage);
    var bannerBuffer = await arrayBufferFromBase64Image(bannerImage);

    console.log(iconBuffer);

    package.file(".manifest/manifest.json", JSON.stringify(manifest, null, 4));
    package.file(`.manifest/graphics/icon.${iconImage.split('/')[1].split(';')[0]}`, iconBuffer);
    package.file(`.manifest/graphics/banner.${bannerImage.split('/')[1].split(';')[0]}`, bannerBuffer);

    var zipBuffer = await package.generateAsync({ type: "blob" });

    return zipBuffer;

}