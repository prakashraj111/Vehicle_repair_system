const joi = require("joi");

module.exports.postSchema = joi.object({
    post: joi.object({
      title: joi.string().required().messages({
        "string.empty": "Title is required."
      }),
      description: joi.string().required().messages({
        "string.empty": "Description is required."
      }),
      location: joi.string().required().messages({
        'string.base': 'Location must be a string', 
        'any.required': 'Location is required.', 
      }),
      email: joi.string().email().required().messages({
        "string.empty": "Email is required.",
        "string.email": "Enter a valid email address."
      }),
      country: joi.string().required().messages({
        "string.empty": "Country is required."
      }),
      available: joi.boolean().required().messages({
        "any.required": "Availability is required."
      }),
      contact: joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.empty": "Contact number is required.",
        "string.pattern.base": "Contact number must be a 10-digit number."
      }),
      image: joi.string().allow("", null),
      category: joi.string().required().messages({
        "string.empty": "Category is required."
      })
    }).required()
  });


module.exports.reviewSchema = joi.object({
    review: joi.object({
        rating: joi.number().required().min(1).max(5),
        comment: joi.string().required()
    }).required(),
});