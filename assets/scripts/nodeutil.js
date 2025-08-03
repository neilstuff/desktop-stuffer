function NodeUtil(document) {

    this._document = document;

};

NodeUtil.prototype.createImageNode = function (source) {
    var image =  this._document.createElement("img");

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
    console.log("field.name: " + fields[field].name + " : " + fields[field].value);

    var element = this._document.getElementById(fields[field].name);

    element.value = fields[field].value;

   }
    
}

