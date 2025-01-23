const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { string } = require("joi");

const postSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    image: {
            url: String,
            filename: String,
        // default: "https://www.istockphoto.com/photo/pool-for-relaxation-gm466761350-59948294?utm_campaign=adp_photos_sponsored&utm_content=https%3A%2F%2Funsplash.com%2Fphotos%2Fa-large-swimming-pool-surrounded-by-palm-trees-_pPHgeHz1uk&utm_medium=affiliate&utm_source=unsplash&utm_term=hotel%3A%3A%3A",
        }
    ,
    location:  {
        type: String
    },
    country: {
        type: String
    },
    category: {
        type: String
    },
   contact: {
    type: String
   },
   email: {
    type: String
   },
   available: {
    type: Boolean
   },
   reviews: [
    {
       type: Schema.Types.ObjectId,
       ref: "Review"
    }
   ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});



postSchema.post("findOneAndDelete", async (post) => {
    if (post) {
        await Review.deleteMany({ _id: { $in: post.reviews } });
    }   
})


const Post = mongoose.model("Post", postSchema);
module.exports = Post;