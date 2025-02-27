const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, isAdmin } = require('../middleware');
const User = require('../models/user');
const Post = require('../models/post');
const router = express.Router();


//admin routes
router.get('/users',isLoggedIn,isAdmin,  wrapAsync(async (req, res)=> {
    let allUsers = await User.find({});
   return res.render("./admin/adminDashboard.ejs", {allUsers}); 
}));



// register admin
// router.get('/registeradmin', async (req, res)=> {
// let data = ({
//     username: "admin",
//     email: "admin@gmail.com",
//     role: "admin"
// });
// const registeredAdmin = await User.register(data, "admin");
// console.log(registeredAdmin);
// res.send("admin registered");
// });


//show route of userAccounts
router.get('/users/:id',isLoggedIn, isAdmin, wrapAsync (async (req, res)=> {
let {id} = req.params;
const user = await User.findById(id);
const allPosts = await Post.find({ uid: id });
res.render('./admin/useraccount.ejs', {user, allPosts});
}));  

//delete route of users
router.delete('/users/:id', isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
const { id } = req.params;
// Find and delete the user
const user = await User.findByIdAndDelete(id);
// Delete all posts owned by the user
await Post.deleteMany({ uid: id });
req.flash("success", `User ${user.username} and their associated posts have been deleted.`);
res.redirect('/users');
}));

// display contact page
router.get('/admin/contact', (req, res)=> {
    res.render('./admin/contact.ejs');
})

module.exports = router;