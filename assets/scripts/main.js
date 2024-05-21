var manifests = [];

const categories = {
    "Utility": {
        "button": "apps-cards",
        "view": "apps-cardbox"
    },
    "Fun": {
        "button": "fun-cards",
        "view": "fun-cardbox"
    },
    "Game": {
        "button": "games-cards",
        "view": "games-cardbox"
    },
    "App": {
        "button": "apps-cards",
        "view": "apps-cardbox"
    }

}

function install_package() {
    var element = document.getElementById("package-url");

    window.api.install(element.value);

}

window.api.on('install-complete', (channel, args) => {

    close_model_panel();

});


function about() {
    document.getElementById('about-dialog').style.display = "inline-block";
}

function help() {
    document.getElementById('help-dialog').style.display = "inline-block";
}

function close_model_panel() {
    var dialogs = document.getElementsByClassName('model')

    for (var dialog in dialogs) {
        if (dialogs[dialog].style) {
            dialogs[dialog].style.display = "none";
        }

    }

    document.getElementById('viewer').innerHTML = "<html></html>";

}

function play(name, url, height, width, scale) {
    var element = document.getElementById("player");

    var template = element.text;
    var adjustment = parseFloat(scale);

    var adjustedWidth = parseInt(width);
    var adjustedHeight = parseInt(height);

    var viewportWidth = parseInt(width) - 30;
    var viewportHeight = parseInt(height) - 70;
    var translateX = 0;
    var translateY = 0;

    if (adjustment == 0.5) {
        translateX = -(viewportWidth * adjustment + 15);
        translateY = -(viewportHeight * adjustment + 5);

        adjustedWidth = adjustedWidth * adjustment;
        adjustedHeight = adjustedHeight * adjustment + 28;

    } else if (adjustment == 0.75) {
        translateX = -(viewportWidth * (1.00 - adjustment) - 60);
        translateY = -(viewportHeight * (1.00 - adjustment) - 55);

        console.log(translateX, translateY)

        adjustedWidth = adjustedWidth * adjustment - 18;
        adjustedHeight = adjustedHeight * adjustment + 5;

    }

    var html = template.replace('<%=url%>', url).
        replace('<%=title%>', name).
        replace('<%=width%>', adjustedWidth).
        replace('<%=height%>', adjustedHeight).
        replace('<%=viewport-width%>', viewportWidth).
        replace('<%=viewport-height%>', viewportHeight).
        replace('<%=scale%>', parseFloat(scale)).
        replace('<%=translate-x%>', translateX).
        replace('<%=translate-y%>', translateY);


    document.getElementById('viewer').innerHTML = html;
    document.getElementById('player-viewer').focus();

}

function display(manifest, id, callback) {

    var element = document.getElementById("template");
    var template = element.text;
    var view = categories[manifest.category].view;

    var cardValue = template.replace(/<%=callback%>/g, callback).
        replace(/<%=id%>/g, id).
        replace(/<%=image%>/g, manifest.manifest + "/" + manifest.image).
        replace(/<%=label%>/g, manifest.label).
        replace(/<%=view%>/g, view);

    var card = document.getElementById(view);

    card.innerHTML += cardValue;

}

function details(id, view) {
    var element = document.getElementById("view");
    var template = element.text;
    var entry = parseInt(id);
    var repository = manifests[entry];
    var description = "";

    for (var line in manifests[entry].description) {
        description += manifests[entry].description[line];
    }

    var html = template.replace(/<%=name%>/g, manifests[entry].label).
        replace(/<%=description%>/g, description);

    if ('display' in manifests[entry]) {
        html = html.replace(/<%=display%>/g, manifests[entry].manifest + "/" +
            manifests[entry].display.image);
        html = html.replace(/<%=width%>/g, manifests[entry].display.width);
        html = html.replace(/<%=height%>/g, manifests[entry].display.height);
        html = html.replace(/<%=border%>/g, manifests[entry].display.border);
        html = html.replace(/<%=margin%>/g, manifests[entry].display.margin);
    }

    var notes = "";

    if ('notes' in manifests[entry]) {
        for (var note in manifests[entry].notes) {
            notes += manifests[entry].notes[note];
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
    var url = manifests[entry]['url'].replaceAll("\\", "\\\\");

    play.href = `javascript:play("${manifests[entry]['label']}", ` +
        `"${url}", ` +
        `"${manifests[entry]['play']['size']['height']}", ` +
        `"${manifests[entry]['play']['size']['width']}", ` +
        `"${manifests[entry]['play']['scale']}")`;
}

document.addEventListener("DOMContentLoaded", (event) => {

    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    window.api.load();

});

window.api.on('load-complete', (channel, args) => {

    window.activeCards = "games-cards";
    window.activeView = "games-cardbox";

    manifests = JSON.parse(args);

    for (var manifest in manifests) {
        display(manifests[manifest], manifest, "details");
    }

    document.getElementById(window.activeCards).style.display = "inline-block";

    var cards = document.getElementsByClassName('card');

    for (let card = 0; card < cards.length; card++) {
        cards[card].style.borderBottom = "3px solid white";
    }


});

window.setTimeout(function () {
    document.getElementById("splash-page").classList.toggle("hidden");

    window.setTimeout(function () {
        document.getElementById("main").style.display = "inline-block";

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

                    document.getElementById(`${e.currentTarget.id}-cards`).style.display = "inline-block";

                }

            });

        });


    }, 1500);

}, 500);