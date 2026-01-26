function Template(document) {

    this._document = document;

    this._traverse = function (input, output, callback) {
         if (input !== null && typeof input === "object") {
            
            if (Array.isArray(input)) {
                var collection = []
                input.forEach(item => {
                    collection.push(this._traverse(item, collection, callback)); // Recurse on array items
                });

                return collection;

            } else {
                var structure = {};

                Object.entries(input).forEach(([key, value]) => {

                    structure[key] = this._traverse(value, structure, callback); // Recurse on the value
                });

                return structure;

            }
        } else {
            return callback(input);
        }
        
    }

    this._getFieldValues = function (className) {
        var map = {}
        var fields = document.getElementsByClassName(className);

        for (const field in fields) {
            map[fields[field].id] = fields[field].value;

        }

        return map;

    };

}

Template.prototype.substitute = function (className, template) {
    var map = this._getFieldValues(className);

    var $ = function (id) {
        if (map[id] === undefined) {
            return "";
        }
        return map[id];
    };

    var _ = function (value) {
        return value
    };

    package = this._traverse(template, null, function (value) {
        console.log(`Evaluating: ${value} : ${eval(value)} : ${Array.isArray(eval(value))}`);
        
        return eval(value)
    
    });

    console.log(JSON.stringify(package, null, 4));

    return package;

}   