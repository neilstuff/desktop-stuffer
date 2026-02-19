function ImageUtil(url) {

    this._url = url;

};

ImageUtil.prototype.exists = function () {
    
    return new Promise(resolve => {
        var img = new Image()
        img.addEventListener('load', () => resolve(true))
        img.addEventListener('error', () => resolve(false))
        img.src = this._url
    });

}

ImageUtil.prototype.check = async function (defaultUrl) {
    
    if (this._url == null || !await this.exists()) {
        return defaultUrl
    }

    return this._url;
    
}   