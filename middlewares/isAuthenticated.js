const User = require("../models/user-model");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    //Bearer toujours précédé du token par convention
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });
    if (!user) {
      return res.status(401).json({ error: "Token unauthorized" });
    } else {
      req.user = user; //la route pourra avoir accès à req.user càd à ses informations
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = isAuthenticated;