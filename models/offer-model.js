const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  title: {
    type: String,
    minlength: 1,
    maxlength: 50,
  },
  description: {
    type: String,
    minlength: 1,
    maxlength: 500,
  },
  price: {
    type: Number,
    max: 100000,
    min: 0,
  },
  created: Date,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  picture: {
    public_id: String,
    secure_url: String,
  },
});

module.exports = Offer;