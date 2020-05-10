const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

const stripe = createStripe(process.env.STRIPE_API_SECRET);


router.post("/payment", async (req, res) => {
  try {
    let { status } = await stripe.charges.create({
      amount: req.fields.amount,
      currency: "eur",
      description: `Paiement leboncoin pour: ${req.fields.title}`,
      source: req.fields.token
    });

    //le paiement a fonctionné - mise à jour de la bdd - réponse au client pour afficher le statut
    res.json({ status });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


module.exports = router;