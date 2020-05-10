const express = require("express");
const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/user-model");


//create user -> inscription
router.post("/user/sign_up", async (req, res) => {
  try {
    if (req.fields.email && req.fields.username && req.fields.password) { //&& req.fields.phone
      if (req.fields.email.trim().length > 0 && req.fields.username.trim().length > 0) { //&& req.fields.phone.trim().length > 0
        if(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/.test(req.fields.email)){ //format mail correct
          const u_email = await User.findOne({ email: req.fields.email }); //doublon email
          if (!u_email) {

            const u_username = await User.findOne({ "account.username": req.fields.username }); //doublon username
            if (!u_username) {

              //if(/^0[0-9]{9}$/.test(req.fields.phone)){ //format numéro de tel correct
                if (req.fields.password.length >= 5) {
                  const salt_save = uid2(16);
                  const newUser = new User({
                    email: req.fields.email,
                    account: {
                      username: req.fields.username.trim(),
                      //phone: req.fields.phone.trim(),
                    },
                    token: uid2(16),
                    salt: salt_save,
                    hash: SHA256(req.fields.password + salt_save).toString(encBase64),
                  });

                  await newUser.save();
                  return res.status(200).json({ token: newUser.token, account: newUser.account });
                } else return res.status(400).json({ error: "Password must contain less than 5 characters" });
              //} else return res.status(400).json({ error: "Phone: incorrect format" });
            } else return res.status(400).json({ error: "Username already used" });
          } else return res.status(400).json({ error: "Email already used" });
        } else return res.status(400).json({ error: "Email: incorrect format" });
      } else return res.status(400).json({ error: "All fields must be completed correctly" });
    } else return res.status(400).json({ error: "All fields must be completed" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


//connexion
router.post("/user/log_in", async (req, res) => {
  try {
    if (req.fields.email && req.fields.password) {

      const u = await User.findOne({ email: req.fields.email });

      if (u) {
        if (u.hash === SHA256(req.fields.password + u.salt).toString(encBase64)) {

          //user connecté
          return res.status(200).json({ token: u.token, account: u.account });

        } else return res.status(400).json({ error: "Wrong password" });
      } else return res.status(404).json({ error: "Email not found" });
    } else return res.status(400).json({ error: "All fields must be completed" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


module.exports = router;