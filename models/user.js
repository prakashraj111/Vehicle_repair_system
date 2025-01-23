const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const Post = require('./post.js');
const Review = require('./review.js');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user"
    }
});



userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);