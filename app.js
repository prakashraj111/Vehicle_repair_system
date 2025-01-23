const express = require("express");
const app = express();
const path = require("path");
const Post = require("./models/post");
const Review = require("./models/review");
const ejsMate = require('ejs-mate');
const mongoose= require("mongoose");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const multer = require('multer');
const {isLoggedIn, isOwner, validatePost, validateReview, isReviewAuthor, isAdmin} = require('./middleware.js');
const { storage } = require('./cloudConfig');
const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({ extended: true })); // To parse form data
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

const MONGO_URL = "mongodb://127.0.0.1:27017/vehicle-repair_system";

main().then(()=> {
    console.log("Connected to db");
}).catch((err)=> {
    console.log(err);
});

async function main() {
  await mongoose.connect(MONGO_URL,  { useNewUrlParser: true, useUnifiedTopology: true });
};


//session options
const sessionOptions = {
    secret: "Mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
};

app.use(session(sessionOptions));
app.use(flash());


// Passport session setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
})


//index route
app.get('/', (req, res)=> {
    res.render('./post/index.ejs');
});

//home route
app.get('/posts', wrapAsync (async (req, res)=>{
    const allPosts = await Post.find({});
    res.render('./post/home.ejs', {allPosts});
}));

 
//new route
app.get("/posts/new",isLoggedIn, (req, res)=> {
    res.render("./post/new.ejs");
});

// create route
app.post(
    "/posts",
    upload.single('post[image]'),
    isLoggedIn,
    validatePost,
    wrapAsync(async (req, res) => {
      // Check if file was uploaded
      if (!req.file) {
        req.flash("error", "Please fill all the fields!");
        return res.redirect("/posts/new");
      }
  
      const url = req.file.path;
      const filename = req.file.filename;
  
      const newPost = new Post(req.body.post);
      newPost.owner = req.user._id;
      newPost.image = { url, filename };
      await newPost.save();
  
      req.flash("success", "New Post Created!");
      res.redirect("/posts");
    })
  );
  


// search route
app.post("/posts/search", wrapAsync(async (req, res) => {
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
app.get('/posts/:id',wrapAsync (async (req, res)=> {
    let {id}= req.params;
    const post = await Post.findById(id)
    .populate({
        path: "reviews",
        populate: {
        path: "author",
        },
    })
    .populate('owner');
    if(!post){
        req.flash("error", "Post not found!");
        return res.redirect("/posts");
    }
    res.render('./post/show.ejs', {post});
}));   

//show route of myaccount
app.get('/myaccount',isLoggedIn ,wrapAsync (async (req, res)=> {
    const allPosts = await Post.find({ owner: req.user._id });
    res.render('./post/myAccount.ejs', {allPosts});
}));  

// edit route
app.get("/posts/:id/edit", isLoggedIn, isOwner, wrapAsync (async(req, res) => {
     let {id}= req.params;
     const post = await Post.findById(id);
     console.log(post.image.url);
     let originalImageUrl = post.image.url;
     originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250")
     res.render("./post/edit.ejs", {post, originalImageUrl});
 }));

//update route
app.put("/posts/:id",isLoggedIn, isOwner, validatePost, wrapAsync (async(req, res)=> {
    let {id}= req.params;
    await Post.findByIdAndUpdate(id, {...req.body.post});
    req.flash("success", "Post Updated Successfully!");
    res.redirect(`/posts/${id}`);
})); 

//delete route
app.delete("/posts/:id",isLoggedIn,isOwner, wrapAsync(
    async (req, res)=> {
    let {id}= req.params;
    let deletedPost = await Post.findByIdAndDelete(id);
    req.flash("success", "Post Deleted Successfully!");
    res.redirect("/posts");
}));


//review post route
app.post("/posts/:id/reviews",isLoggedIn, validateReview, wrapAsync(async (req, res)=> {
    let post = await Post.findById(req.params.id);
    let review = new Review(req.body.review);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    post.reviews.push(newReview);
    await newReview.save();
    await post.save();
    req.flash("success", "Review added Successfully!");
    res.redirect(`/posts/${req.params.id}`);
}));

// review delete route
app.delete("/posts/:id/reviews/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(async (req, res)=> {
    let {id, reviewId} = req.params;
    await Post.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted Successfully!");
    res.redirect(`/posts/${id}`);
}));



// login and signup
app.get("/signup", (req, res)=> {
    res.render("./user/signup.ejs");
});

app.get("/login", (req, res)=> {
    res.render("./user/login.ejs");
});

app.post('/signup',wrapAsync (async(req, res)=> {
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

app.post('/login',
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

app.get("/logout", isLoggedIn, (req, res, next)=> {
    req.logout((err)=> {
        if (err) { 
            return next(err);
         }
         req.flash("success", "Logged out Successfully!");
         res.redirect("/posts");
    });
}); 


//admin routes
app.get('/users',isLoggedIn,isAdmin,  wrapAsync(async (req, res)=> {
        let allUsers = await User.find({});
       return res.render("./admin/adminDashboard.ejs", {allUsers}); 
}));



//register admin
app.get('/registeradmin', async (req, res)=> {
    let data = ({
        username: "admin",
        email: "admin@gmail.com",
        role: "admin"
    });
    const registeredAdmin = await User.register(data, "admin");
    console.log(registeredAdmin);
    res.send("admin registered");
});


//show route of userAccounts
app.get('/users/:id',isLoggedIn, isAdmin, wrapAsync (async (req, res)=> {
    let {id} = req.params;
    const user = await User.findById(id);
    const allPosts = await Post.find({ owner: id });
    res.render('./admin/useraccount.ejs', {user, allPosts});
}));  

//delete route of users
app.delete('/users/:id', isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    // Find and delete the user
    const user = await User.findByIdAndDelete(id);
    // Optional: Delete all posts owned by the user
    await Post.deleteMany({ owner: id });
    req.flash("success", `User ${user.username} and their associated posts have been deleted.`);
    res.redirect('/users');
}));


//error handling for non existing routes
app.all("*", (req, res, next)=> {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});


app.listen(8080, ()=> {
    console.log("sever is listening to the port 8080");
});