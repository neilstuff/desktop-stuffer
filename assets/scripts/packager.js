var packageTemplate = {
    "image": "_('graphics/icon.png')",
    "label": "$('package-name')",
    "category": "$('package-category')",
    "language": "_('node.js')",
    "description": "$('package-description')",
    "notes": "$('package-notes').split('\\n')",
    "display": {
        "image": "_('graphics/banner.png')",
        "width": "p('banner-width')",
        "height": "p('banner-height')",
        "margin": "_('20px')",
        "border": "_('box-shadow: 5px 5px 15px 5px grey')"
    },
    "play": {
        "index": "_('1')",
        "size": {
            "width": "$('package-display-width')",
            "height": "$('package-display-height')"
        },
        "scale": "$('package-display-scale')"
    }
};

function Packager(document) {

    async function getImage(url) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const imageBlob = await response.blob();
            const imageObjectURL = URL.createObjectURL(imageBlob);

            return imageObjectURL;

        } catch (error) {

            console.error('Fetch error:', error);
        }
    }

    this._document = document;

}

Packager.prototype.compile = async function (icon, banner) {

    var template = new Template(this._document);
    var package = template.substitute("package-field", packageTemplate);
    var compiler = new Compiler(this._document);

    return await compiler.compile(atob(window.archive), package, "icon-image", "banner-image");

}