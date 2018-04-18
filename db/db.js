module.exports = function () {
    var mongoose = require("mongoose");
    var q = require("q");

    var card = () => {
        var card = mongoose.Schema({
            name: String,
            cmc: Number,
            primaryType: String,
            color: String,
            multiverseId: String,
            imageUri: String
        }, { versionKey: false });

        card.set("toJSON", {
            transform: function (document, ret) {
                delete ret._id;
                delete ret.price;
            }
        });

        return mongoose.model("cards2", card);
    }

    var set = () => {
        var set = mongoose.Schema({
            name: String,
            code: String,
            searchUri: String
        }, { versionKey: false });

        set.set("toJSON", {
            transform: (document, ret) => {
                delete ret._id;
            }
        });

        return mongoose.model("sets2", set);
    }

    var init = (connectionString) => {
        mongoose.connect(connectionString);
        var db = mongoose.connection;

        var deferred = q.defer();
        db.on("error", deferred.reject);
        db.on("error", console.error.bind(console, "connection error:"));
        db.once("open", deferred.resolve);
        return deferred.promise;
    }

    return {
        Card: card(),
        Set: set(),
        init: init
    };
}();