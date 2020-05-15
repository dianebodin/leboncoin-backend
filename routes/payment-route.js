const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);


router.post("/payment", async (req, res) => { 
  try {
    const response = await stripe.charges.create({
      amount: req.fields.amount,
      currency: "eur",
      description: `Paiement leboncoin pour: ${req.fields.title}`,
      source: req.fields.stripeToken
    });
    return res.status(200).json({ response });
    
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


module.exports = router;