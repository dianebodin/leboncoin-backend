const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Offer = require("../models/offer-model");
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//create offer
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const res_cloudi = await cloudinary.v2.uploader.upload(req.files.picture.path); //chemin de notre fichier

    if (req.user) {
      if (req.fields.title && req.fields.description && req.fields.price) {

        if (req.fields.title.length > 30) return res.status(400).json({ error: "Title must be less than 30 characters" });     
        if (req.fields.description.length > 200) return res.status(400).json({ error: "Description must be less than 200 characters" });
        if (isNaN(req.fields.price)) return res.status(400).json({ error: "Price must be a number" });
        if (req.fields.price > 100000 || Math.sign(req.fields.price) !== 1) return res.status(400).json({ error: "Price must be between 0.1 and 100000" });

        const newOffer = new Offer({
          title: req.fields.title,
          description: req.fields.description,
          price: parseFloat(req.fields.price).toFixed(2),
          created: new Date(),
          creator: req.user,
          picture: {
            public_id: res_cloudi.public_id,
            secure_url: res_cloudi.secure_url,
          },
        });

        await newOffer.save();
        const o = await Offer.findById(newOffer.id).populate({ path: "creator", select: "account.username account.phone" }); //pour ne pas afficher de données sensibles
        return res.status(200).json(o);

      } else return res.status(400).json({ error: "Missing parameters" });
    } else return res.status(400).json({ error: "User unauthorized" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


//update offer, id offer avec req.params, le reste sont les paramètres body
router.put("/offer/edit/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.user) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {

        const o = await Offer.findById(req.params.id).populate("creator");

        if (o) {
          if (o.creator.token === req.user.token) {

            if (req.fields.title.length > 30) return res.status(400).json({ error: "Title must be less than 30 characters" });
            if (req.fields.description.length > 200) return res.status(400).json({ error: "Description must be less than 200 characters" });
            if (isNaN(req.fields.price)) return res.status(400).json({ error: "Price must be a number" });
            if (req.fields.price > 100000) return res.status(400).json({ error: "Price must be less than 100000" });
            
            if (req.fields.title && req.fields.title.trim().length > 0) {
              o.title = req.fields.title;
            }
            if (req.fields.description && req.fields.title.trim().length > 0) {
              o.description = req.fields.description;
            }
            if (req.fields.price && req.fields.price > 0) {
              o.price = parseFloat(req.fields.price).toFixed(2);
            }
            if (req.files.picture.type !== null && req.files.picture.name !== null) {
              const res_cloudi = await cloudinary.v2.uploader.upload(req.files.picture.path); //chemin de notre fichier
              await cloudinary.uploader.destroy(o.picture.public_id); //supprimer de cloudinary avant de remplacer
              o.picture.secure_url = res_cloudi.secure_url;
              o.picture.public_id = res_cloudi.public_id;
            }

            await o.save();
            return res.status(200).json(o);

          } else return res.status(401).json({ error: "User unauthorized" });
        } else return res.status(404).json({ error: "Offer not found" });
      } else return res.status(400).json({ error: "Wrong id" });
    } else return res.status(401).json({ error: "User unauthorized" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


//delete offer
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  if (req.params.id){
    try {
      if (req.user) {
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
          const o = await Offer.findById(req.params.id).populate("creator");
          if (o) {
            if (o.creator.token === req.user.token) {

              await o.remove();
              await cloudinary.uploader.destroy(o.picture.public_id);

              return res.status(200).json({ message: "Offer removed" });
            } else return res.status(401).json({ error: "User unauthorized" });
          } else return res.status(404).json({ error: "Offer not found" });
        } else return res.status(400).json({ error: "Wrong id" });
      } else return res.status(401).json({ error: "User unauthorized" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  } else return res.status(400).json({ error: "Missing id" });
});


//afficher et filtrer avec des paramètres query
router.get("/offer/with-count", async (req, res) => {
  try {

    const f = {}; //objet filtres
    if (req.query.title) {
      f.title = new RegExp(req.query.title, "i"); //ignorer la casse
    }
    if ((req.query.priceMin && !isNaN(req.query.priceMin)) || (req.query.priceMax && !isNaN(req.query.priceMax))) {
      f.price = {};
      if (req.query.priceMin) f.price.$gte = req.query.priceMin; //au dessus de min
      if (req.query.priceMax) f.price.$lte = req.query.priceMax; //au dessous de max
    }

    const s = {}; //objet tri
    if (req.query.sort) {
      if (req.query.sort === "price-desc") s.price = -1;
      else if (req.query.sort === "price-asc") s.price = 1;
      else if (req.query.sort === "date-desc") s.created = -1;
      else if (req.query.sort === "date-asc") s.created = 1;
    }

    //populate avec arguments pour préciser les données qu'on souhaite
    let offers = await Offer.find(f).sort(s).populate({ path: "creator", select: "account.username account.phone" }); //ajout des objets filtres/tri
    const size_offers = offers.length;

    if (req.query.page) {
      if (!isNaN(req.query.page)) {
        const l = 3; //on choisit de limiter 3 annonces par page
        const nb_pages = Math.ceil(size_offers / l); //arrondir au supérieur

        if (req.query.page > 0 && req.query.page <= nb_pages) {
          offers = await Offer.find(f).sort(s).limit(l).skip(l * req.query.page - l).populate({ path: "creator", select: "account.username account.phone" });
        }
      }
    }

    return res.status(200).json({ count: size_offers, offers: offers });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


//get offer, id offer avec req.params
router.get("/offer/:id", async (req, res) => {
  if (req.params.id){
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const o = await Offer.findById(req.params.id).populate({ path: "creator", select: "account.username account.phone" });
        if (o) {

          return res.status(200).json(o);
            
        } else return res.status(404).json({ error: "Offer not found" });
      } else return res.status(400).json({ error: "Wrong id" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  } else return res.status(400).json({ error: "Missing id" });
});


module.exports = router;