const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { type: String, unique: true, required: true },
  token: String,
  hash: String,
  salt: String,
  account: {
    username: { type: String, unique: true, required: true },
    phone: { type: String },
  }
});

module.exports = User;