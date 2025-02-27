const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validatePost, isOwner } = require('../middleware');
const multer = require('multer'); 
const { storage } = require('../cloudConfig.js');
const Post = require('../models/post');
const upload = multer({ storage });
const router = express.Router();


//home route
router.get('/posts', wrapAsync (async (req, res)=>{
    const allPosts = await Post.find({});
    res.render('./post/home.ejs', {allPosts});
}));

//new route
router.get("/posts/new",isLoggedIn, (req, res)=> {
    res.render("./post/new.ejs");
});

// create route
router.post(
    "/posts",
    upload.single('post[image]'),
    isLoggedIn,
    validatePost,
    wrapAsync(async (req, res) => {
      // Check if file was uploaded
      if (!req.file) {
        req.flash("error", "Please upload an image!");
        return res.redirect("/posts/new");
      } 6
      const url = req.file.path;
      const filename = req.file.filename; 
      const newPost = new Post(req.body.post);
      newPost.uid = req.user._id;
      newPost.image = { url, filename };
      await newPost.save(); 
      req.flash("success", "New Post Created!");
      res.redirect("/posts");
    })
);

// search route
router.post("/posts/search", wrapAsync(async (req, res) => {
    const searchInput = req.body.search || ''; // Default to an empty string if undefined    
    const selectedOption = req.body.options;   // Selected category   
    console.log("Search Input:", searchInput);
    console.log("Selected Option:", selectedOption);
    // Escape special characters in search input for regex
    const sanitizedSearchInput = searchInput.replace(/[$()*+?.\\^{}|]/g, ''); 
    try {
        // Query Database for Matching Posts
        const matchingPosts = await Post.find({
            category: selectedOption,
            location: { $regex: new RegExp(sanitizedSearchInput, "i") }, // Case-insensitive regex for placeName
        });
        res.render("./post/searchPage.ejs", { posts: matchingPosts, searchInput, selectedOption });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).send("Error while searching for posts");
    }
}));


//show route
router.get('/posts/:id',wrapAsync (async (req, res)=> {
    let {id}= req.params;
    const post = await Post.findById(id)
    .populate({
        path: "rid",
        populate: {
        path: "uid",
        },
    })
    .populate('uid');
    if(!post){
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }
    res.render('./post/show.ejs', {post});
}));   


// edit route
router.get("/posts/:id/edit", isLoggedIn, isOwner, wrapAsync (async(req, res) => {
    let {id}= req.params;
    const post = await Post.findById(id);
    let originalImageUrl = post.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("./post/edit.ejs", {post, originalImageUrl});
}));

//update route
router.put("/posts/:id",isLoggedIn, isOwner, upload.single("post[image]") ,wrapAsync (async (req, res)=> {
   let {id}= req.params;   
   let post =  await Post.findByIdAndUpdate(id, {...req.body.post});
   if(typeof req.file !== "undefined"){
       let url = req.file.path;
       let filename = req.file.filename;
      
       post.image = {url, filename};
       await post.save();
   }
   req.flash("success", "Post Updated Successfully!");
   res.redirect(`/posts/${id}`);
}));

//delete route
router.delete("/posts/:id",isLoggedIn,isOwner, wrapAsync(
   async (req, res)=> {
   let {id}= req.params;
   let deletedPost = await Post.findByIdAndDelete(id);
   req.flash("success", "Post Deleted Successfully!");
   res.redirect("/posts");
}));

module.exports = router;