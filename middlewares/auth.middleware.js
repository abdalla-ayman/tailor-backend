// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const Account = require("../models/account.model");

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = await Account.findById(decoded.id);
    req.user = account;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token", error });
  }
};

exports.verifySuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Super admin access required" });
  }
  next();
};
