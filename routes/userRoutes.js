const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../middleware');
const User = require('../models/user');
const router = express.Router();
const passport = require("passport");
const Post = require('../models/post');

// login and signup
router.get("/signup", (req, res)=> {
    res.render("./user/signup.ejs");
});

router.get("/login", (req, res)=> {
    res.render("./user/login.ejs");
});

router.post('/signup',wrapAsync (async(req, res)=> {
    try {
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        req.flash("success", "User Registered Successfully!");
        res.redirect("/login"); 
    } catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

router.post('/login',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true,
    }),
    wrapAsync(async (req, res) => {  
    if(req.user.role === 'admin'){
            req.flash("success", "Welcome to the admin dashboard!");
            return res.redirect('/users');
     }
      req.flash("success", "Welcome to GarageNearMe!");
      res.redirect('/posts'); // Redirect to the dashboard or wherever you want after login
    })
  );

router.get("/logout", isLoggedIn, (req, res, next)=> {
    req.logout((err)=> {
        if (err) { 
            return next(err);
         }
         req.flash("success", "Logged out Successfully!");
         res.redirect("/posts");
    });
}); 

//show route of myaccount
router.get('/myaccount',isLoggedIn ,wrapAsync (async (req, res)=> {
    const allPosts = await Post.find({ uid: req.user._id });
    res.render('./post/myAccount.ejs', {allPosts});
}));  

module.exports = router;