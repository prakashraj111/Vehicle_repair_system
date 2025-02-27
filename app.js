const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require('ejs-mate');
const mongoose= require("mongoose");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const postsRoutes = require('./routes/postRoutes.js');
const reviewRoutes = require('./routes/reviewRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "/public")));
// app.use(express.urlencoded({extended: true}));
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
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

// all post routes pass from this middleware
app.use('/', postsRoutes);
app.use('/', reviewRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);



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