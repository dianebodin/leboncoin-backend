const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const compression = require("compression");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(formidable());
app.use(compression());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const userRoutes = require("./routes/user-route");
app.use(userRoutes);

const offerRoutes = require("./routes/offer-route");
app.use(offerRoutes);

const paymentRoutes = require("./routes/payment-route");
app.use(paymentRoutes);


app.all("*", function (req, res) {
  res.status(404).json({ error: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
