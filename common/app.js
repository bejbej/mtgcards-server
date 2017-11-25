module.exports = () => {

    var app = require("express")();

    let wrapAsync = (method, uri, func) => {
        method.call(app, uri, (request, response, next) => {
            Promise.resolve()
            .then(() => func(request, response))
            .catch(next);
        });
    }

    let originalGet = app.get;
    app.get = (uri, func) => wrapAsync(originalGet, uri, func);

    let originalPost = app.post;
    app.post = (uri, func) => wrapAsync(originalPost, uri, func);

    return app;
};