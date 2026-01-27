function Compiler(document) {

    this._document = document;
    this._zip = new JSZip();

};

Compiler.prototype.compile = async function (zipBuffer, manifest, iconId, bannerId) {
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

    var banner = bannerImage.split(',');
    var icon = iconImage.split(',');

    var iconBuffer = atob(icon[1]);
    var bannerBuffer = atob(banner[1]);

    console.log(iconBuffer);

    package.file(".manifest/manifest.json", JSON.stringify(manifest, null, 4));
    package.file(`.manifest/graphics/icon.${icon[0].split('/')[1].split(';')[0]}`, iconBuffer);
    package.file(`.manifest/graphics/banner.${banner[0].split('/')[1].split(';')[0]}`, bannerBuffer);
    
    var zipBuffer = await package.generateAsync({ type: "blob" });

    return zipBuffer;

}