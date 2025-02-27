const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware');
const Post = require('../models/post');
const Review = require('../models/review');
const router = express.Router();

//review post route
router.post("/posts/:id/reviews",isLoggedIn, validateReview, wrapAsync(async (req, res)=> {
    let post = await Post.findById(req.params.id);
    // let review = new Review(req.body.review);
    let newReview = new Review(req.body.review);
    newReview.uid = req.user._id;
    post.rid.push(newReview);
    await newReview.save();
    await post.save();
    req.flash("success", "Review added Successfully!");
    res.redirect(`/posts/${req.params.id}`);
}));

// review delete route
router.delete("/posts/:id/reviews/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(async (req, res)=> {
    let {id, reviewId} = req.params;
    await Post.findByIdAndUpdate(id, {$pull: {rid: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted Successfully!");
    res.redirect(`/posts/${id}`);
}));

module.exports = router;