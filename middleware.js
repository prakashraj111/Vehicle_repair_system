const Post = require("./models/post");
const ExpressError = require("./utils/ExpressError");
const {postSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash("error", "You must be logged in First!");
        return res.redirect('/login');
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the post by ID
        const post = await Post.findById(id);
        if (!post) {
            req.flash("error", "Post not found!");
            return res.redirect('/posts');
        }
        // Check if current user exists and is the owner or an admin
        const currentUser = res.locals.currUser;
        if (!currentUser) {
            req.flash("error", "You must be logged in to perform this action!");
            return res.redirect(`/posts/${id}`);
        }
        const isOwner = post.uid.equals(currentUser._id);
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
            req.flash("error", "You are not authorized to perform this action!");
            return res.redirect(`/posts/${id}`);
        }
        // User is authorized
        next();
    } catch (error) {
        req.flash("error", "An error occurred. Please try again later.");
        res.redirect('/posts');
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let {reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.uid._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the owner of this review!");
        return res.redirect(`/posts/${id}`);
    }
    next();
};

module.exports.isAdmin = async (req, res, next) => {
    if(req.user.role !== 'admin'){
        req.flash("error", "You are not an admin!");
       return  res.redirect('/posts');
    }
    next();
};

module.exports.validatePost = (req, res, next) =>{
    let {error} = postSchema.validate(req.body);
    if(error ){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};

module.exports.validateReview = (req, res, next) =>{
    let {error} = reviewSchema.validate(req.body);
    if(error ){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};