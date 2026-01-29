var manifests = [];
var stringUtil = new StringUtil();

function install(package) {

    window.api.install(package);

}

function compile() {

    document.getElementById("compile-dialog").showModal();

}

/**
 * Display the about panel
 */
function about() {
    document.getElementById('about-dialog').style.display = "inline-block";
}

/**
 * Close all modal panels
 */
function close_modal_panel() {
    var dialogs = document.getElementsByClassName('modal')

    for (var dialog in dialogs) {
        if (dialogs[dialog].style) {
            dialogs[dialog].style.display = "none";
        }

    }

    document.getElementById("compile-dialog").close();

    document.getElementById('viewer').innerHTML = "<html></html>";

}

/**
 * Play the selected package
 * @param {*} name  the package name
 * @param {*} url the package URL
 * @param {*} height the package height
 * @param {*} width the package width
 * @param {*} scale the package scale
 */
function play(name, url, height, width, scale) {
    var element = document.getElementById("player");

    var template = element.text;
    var adjustment = parseFloat(scale);

    var adjustedWidth = parseInt(width);
    var adjustedHeight = parseInt(height);

    var viewportWidth = parseInt(width);
    var viewportHeight = parseInt(height);

    adjustedWidth = adjustedWidth * adjustment + 30;
    adjustedHeight = adjustedHeight * adjustment + 70;

    var html = template.replace('<%=url%>', url).
        replace('<%=title%>', name).
        replace('<%=width%>', adjustedWidth).
        replace('<%=height%>', adjustedHeight).
        replace('<%=viewport-width%>', viewportWidth).
        replace('<%=viewport-height%>', viewportHeight).
        replace('<%=scale%>', parseFloat(scale));


    document.getElementById('viewer').innerHTML = html;

    var top = (window.innerHeight / 2) - (adjustedHeight / 2) - 40;
    document.getElementById('player-dialog').style.top = `${top < 40 ? 0 : top}px`
    document.getElementById('player-dialog').style.left = `${(window.innerWidth / 2) - (adjustedWidth / 2)}px`;

    document.getElementById('player-viewer').focus();

}

/**
 * Display a package manifest
 * @param {*} manifest  the package manifest
 * @param {*} id the package id
 * @param {*} callback the callback function
 */
function display(manifest, id, callback) {
    var category = manifest.category;
    let template = document.getElementById("template").text;

    if (!(category in window.appViews)) {
        let catView = stringUtil.substitute(document.getElementById("app-views-template").text, { "view": category });
        let catTab = null;

        if (window.activeView == null) {
            window.activeView = `app-${category}-cards`;
            catTab = stringUtil.substitute(document.getElementById("app-tab-template").text, { "view": category, "class": "rotate-active" });
        } else {
            catTab = stringUtil.substitute(document.getElementById("app-tab-template").text, { "view": category, "class": "rotate-inactive" });
        }

        window.appViews[category] = { "tab": catTab, "view": catView, "id": `${category}-cardbox` };

        document.getElementById("app-tabs").appendChild(catTab);
        document.getElementById("app-views").appendChild(catView);
    }

    let cardValue = stringUtil.substitute(template, {
        "callback": callback,
        "id": id,
        "label": manifest.label,
        "image": manifest.manifest + "/" + manifest.image,
        "view": manifest.category
    });

    document.getElementById(window.appViews[category]["id"]).appendChild(cardValue);

}

/**
 * View package details
 * @param {*} id the package id
 * @param {*} view the package view
 */
function viewDetails(id, view) {
    var element = document.getElementById("view");
    var template = element.text;

    var entry = manifests.find((manifest) => {
        return manifest.id == id;
    });

    var description = "";

    for (var line in entry.description) {
        description += entry.description[line];
    }

    var html = template.replace(/<%=name%>/g, entry.label).
        replace(/<%=description%>/g, description);

    if ('display' in entry) {
        html = html.replace(/<%=display%>/g, entry.manifest + "/" +
            entry.display.image);
        html = html.replace(/<%=width%>/g, entry.display.width);
        html = html.replace(/<%=height%>/g, entry.display.height);
        html = html.replace(/<%=border%>/g, entry.display.border);
        html = html.replace(/<%=margin%>/g, entry.display.margin);
    }

    var notes = "";

    if ('notes' in entry) {
        for (var note in entry.notes) {
            notes += entry.notes[note];
        }

    }

    html = html.replace(/<%=notes%>/g, notes);

    var details = document.getElementById("details");

    details.innerHTML = html;

    var cards = document.getElementsByClassName('card');

    for (let card = 0; card < cards.length; card++) {
        cards[card].style.borderBottom = "3px solid white";
    }

    document.getElementById(`card-${view}-${id}`).style.borderBottom =
        "3px solid rgb(119,181,254)";

    document.getElementById("actions").style.display = "inline-block";

    var play = document.getElementById("play");
    var url = entry['url'].replaceAll("\\", "\\\\");

    play.href = `javascript:play("${entry['label']}", ` +
        `"${url}", ` +
        `"${entry['play']['size']['height']}", ` +
        `"${entry['play']['size']['width']}", ` +
        `"${entry['play']['scale']}")`;

}

function playGame(id, view) {
    var entry = manifests.find((manifest) => {
        return manifest.id == id;
    });

    var url = entry['url'].replaceAll("\\", "\\\\");

    play(entry['label'],
        url, entry['play']['size']['height'],
        entry['play']['size']['width'],
        entry['play']['scale']);

}

function details(activation, id, view) {

    if (activation == "click") {
        viewDetails(id, view);
    }

    if (activation == "dblclick") {
        playGame(id, view);
    }

}

document.addEventListener("DOMContentLoaded", (event) => {

    window.packages = [];

    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    document.getElementById("cancel-compile-dialog").addEventListener('click', async (e) => {
        document.getElementById("compile-dialog").close();

    });

    window.api.load();

    document.getElementById("load-upload-dialog").addEventListener('click', async (e) => {
        window.api.upload();
    });

    document.getElementById("ok-compile-dialog").addEventListener('click', async (e) => {
        var packager = new Packager(document);

        var package = await packager.compile();

        var fileUtil = new FileUtil(document);

        fileUtil.saveAs(package, `${document.getElementById("package-name").value.toLowerCase().replaceAll(" ", "-")}.zip`);

    });

    document.getElementById("ok-install-dialog").addEventListener('click', async (e) => {
        var packager = new Packager(document);
        var package = await packager.compile();

    });

    document.getElementById("banner-width").addEventListener('input', async (e) => {
        var bannerImage = document.getElementById("banner-image");

        bannerImage.style.width = `${document.getElementById("banner-width").value}%`;

    });

    document.getElementById("banner-height").addEventListener('input', async (e) => {
        var bannerImage = document.getElementById("banner-image");

        bannerImage.style.height = `${document.getElementById("banner-height").value}%`;

    });

    document.getElementById("banner-width").addEventListener('change', async (e) => {
    });

    document.getElementById("upload-icon").addEventListener('click', async (e) => {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async (files) => {

            const reader = new FileReader();
            reader.onload = () => {
                const uploadedImage = reader.result;
                var nodeUtil = new NodeUtil(document);
                var iconImage = nodeUtil.createImageNode(uploadedImage);

                iconImage.id = "icon-image";
                iconImage.style.height = "64px";
                iconImage.style.width = "64px";

                var nodeUtil = new NodeUtil(document);
                nodeUtil.prune(document.getElementById("package-icon"));

                document.getElementById("package-icon").appendChild(iconImage);

            };

            reader.readAsDataURL(files[0]);

        });

    });

    document.getElementById("upload-banner").addEventListener('click', async (e) => {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async (files) => {
            const reader = new FileReader();
            reader.onload = () => {
                const uploadedImage = reader.result;
                var nodeUtil = new NodeUtil(document);
                var bannerImage = nodeUtil.createImageNode(uploadedImage);

                bannerImage.id = "banner-image";
                document.getElementById("banner-width").value = "100";
                document.getElementById("banner-height").value = "100";

                bannerImage.style.width = "100%";
                bannerImage.style.height = "100%";

                var nodeUtil = new NodeUtil(document);
                nodeUtil.prune(document.getElementById("package-banner"));

                document.getElementById("package-banner").appendChild(bannerImage);

            };

            reader.readAsDataURL(files[0]);

        });
    });

});

/**
 * The archive has loaded
 */
window.api.on('load-complete', (channel, args) => {

    window.appViews = {};
    window.activeView = null;

    manifests = JSON.parse(args);

    for (var manifest in manifests) {
        manifests[manifest]["id"] = manifest;

        display(manifests[manifest], manifest, "details");
    }

    let tab_buttons = document.querySelectorAll(".tab-button");

    tab_buttons.forEach((item) => {

        item.addEventListener("click", (e) => {

            function inactivateAll() {

                let tab_buttons = document.querySelectorAll(".tab-button");

                for (let tab_button = 0; tab_button < tab_buttons.length; tab_button++) {
                    tab_buttons[tab_button].children[0].classList.replace("rotate-active", "rotate-inactive");
                }

            }

            function hideAllViews() {

                let views = document.querySelectorAll(".view");

                for (let view = 0; view < views.length; view++) {
                    views[view].style.display = "none";
                }

            }

            if (e.currentTarget.children[0].classList.contains("rotate-inactive")) {

                inactivateAll();

                e.currentTarget.children[0].classList.replace("rotate-inactive", "rotate-active");

                hideAllViews();

                document.getElementById(`${e.currentTarget.id}s`).style.display = "inline-block";

            }

        });

    });

    document.getElementById(window.activeView).style.display = "inline-block";

    var cards = document.getElementsByClassName('card');

    for (let card = 0; card < cards.length; card++) {
        cards[card].style.borderBottom = "3px solid white";
    }

});

window.api.on('install-complete', (channel, args) => {
    var definition = JSON.parse(args);

    definition.id = manifests.length;

    manifests = manifests.filter((manifest, index) => {

        if (manifest.label == definition.label) {
            var card = document.getElementById(`card-${categories[manifest.category].view}-${manifest.id}`);

            card.parentNode.removeChild(card);
            definition.id = manifest.id;

        }

        return manifest.label != definition.label;

    });

    manifests.push(definition);

    display(definition, definition.id, "details");

    var cards = document.getElementsByClassName('card');

    for (let card = 0; card < cards.length; card++) {
        cards[card].style.borderBottom = "3px solid white";
    }

});

window.api.on('upload-complete', (channel, args) => {
    var package = JSON.parse(args);

    window.archive = package.archive;

    console.log(JSON.stringify(package));

    if (!'manifest' in package || package.manifest == "") {
        return;
    }

    window.manifest = package.manifest;
    window.icon = package.icon;
    window.banner = package.banner;

    var nodeUtil = new NodeUtil(document);
    var manifest = package.manifest.manifest;

    var width = manifest["display"]["width"].replace("%", "");
    var height = manifest["display"]["height"].replace("%", "");

    nodeUtil.setFields(
        {
            "name": "package-name",
            "value": manifest["label"]
        },
        {
            "name": "package-category",
            "value": manifest["category"]
        },
        {
            "name": "package-description",
            "value": manifest["description"]
        },
        {
            "name": "package-notes",
            "value": manifest["notes"]
        },
        {
            "name": "package-index",
            "value": manifest["play"]["index"]
        },
        {
            "name": "package-display-width",
            "value": manifest["play"]["size"]["width"]
        },
        {
            "name": "package-display-height",
            "value": manifest["play"]["size"]["height"]
        },
        {
            "name": "package-display-scale",
            "value": manifest["play"]["scale"]
        },
        {
            "name": "package-display-scale",
            "value": manifest["play"]["scale"]
        },
        {
            "name": "banner-width",
            "value": width
        },
        {
            "name": "banner-height",
            "value": height
        }

    );

    var iconImage = nodeUtil.createImageNode(package.icon);

    iconImage.style.height = "64px";
    iconImage.style.width = "64px";
    iconImage.id = "icon-image";

    nodeUtil.prune(document.getElementById("package-icon"));
    document.getElementById("package-icon").appendChild(iconImage);

    var bannerImage = nodeUtil.createImageNode(package.banner);

    bannerImage.style.height = `${height}%`;
    bannerImage.style.width = `${width}%`;
    bannerImage.id = "banner-image";

    nodeUtil.prune(document.getElementById("package-banner"));
    document.getElementById("package-banner").appendChild(bannerImage);

});

window.api.on('upload-exception', (channel, args) => {

    alert('upload-exception');

});

window.setTimeout(function () {
    document.getElementById("splash-page").classList.toggle("hidden");

    window.setTimeout(function () {
        document.getElementById("main").style.display = "inline-block";
    }, 1500);

}, 500);