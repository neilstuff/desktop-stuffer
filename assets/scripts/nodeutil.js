function NodeUtil(document) {

    this._document = document;

};

NodeUtil.prototype.createImageNode = function (source) {
    var image = this._document.createElement("img");

    image.src = source;

    return image;

}

NodeUtil.prototype.prune = function (node) {

    node.replaceChildren();

}

NodeUtil.prototype.replace = function (node, ...children) {

    node.replaceChildren(children);

}

NodeUtil.prototype.setFields = function (...fields) {

    for (const field in fields) {
        var element = this._document.getElementById(fields[field].name);

        element.value = fields[field].value;

    }

}

NodeUtil.prototype.getFields = function (className) {

    var fields = document.getElementsByClassName(className);
    var map = {};

    for (const field in fields) {
        map[field.id] = field.value;
    }
    return map;
    
}

NodeUtil.prototype.setCheckBoxes = function (name, ...values) {
    var list = this._document.createElement("ul");

    for (var value in values) {
        var label = this._document.createElement("label");
        label.value = values[value];
        label.innerHTML = `<b>${values[value]}</b>`;
        label.style.fontSize = "12px";

        var checkbox = this._document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = label.value = values[value];
        checkbox.id = `checkbox-${label.value = values[value]}`;
        checkbox.className = name;
        checkbox.style = marhinTop = "3px";
        checkbox.value = values[value];
        checkbox.checked = true;

        label.appendChild(checkbox);
        list.appendChild(label);

    }

    return list;

}
