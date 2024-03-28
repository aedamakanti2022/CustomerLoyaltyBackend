const jwt = require("jsonwebtoken");
const Business = require("../models/business");
const points = require("../models/businessPoints");
const loginBusiness = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  let foundUser = await Business.findOne({ email: req.body.email });
  if (foundUser) {
    const isMatch = await foundUser.comparePassword(password);

    if (isMatch) {
      const token = jwt.sign(
        { id: foundUser._id, name: foundUser.name, businessName:foundUser.businessName, businessId: foundUser.businessId },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );

      return res.status(200).json({ msg: "user logged in", token });
    } else {
      return res.status(400).json({ msg: "Bad password" });
    }
  } else {
    return res.status(400).json({ msg: "Bad credentails" });
  }
};

const dashboard = async (req, res) => {
  let businessId = req.business.businessId;
  const luckyNumber = Math.floor(Math.random() * 100);
  let businessPoints = await points.find({businessId});

  let rewardName = businessPoints.rewardName;
  let rewardDollar = businessPoints.rewardDollar;
  let redeemLimit = businessPoints.redeemLimit;


  let businessData = await Business.find({ businessId });
  res.status(200).json({
    msg: `Hello, ${req.business.businessName}`,
    businessName: req.business.businessName,
    businessId: req.business.businessId,
    businessData: businessData,
    businessPoints: businessPoints
  });
};

const getAllBusinesses = async (req, res) => {
  let businesses = await Business.find({});
  return res.status(200).json({ businesses });
};

const registerBusiness = async (req, res) => {
  let foundBusiness = await Business.findOne({ email: req.body.email });
  if (foundBusiness === null) {
    let { username, email, password,businessName,businessId } = req.body;
    if (username.length && email.length && password.length) {
      const business = new Business({
        name: username,
        email: email,
        password: password,
        businessName: businessName,
        businessId: businessId
      });
      await business.save();
      return res.status(201).json({ business });
    }else{
        return res.status(400).json({msg: "Please add all values in the request body"});
    }
  } else {
    return res.status(400).json({ msg: "Email already in use" });
  }
};

const updateBusinessPoints = async (req, res) => {
  const businessId = req.business.businessId;
  let foundBusiness = await Business.findOne({ businessId: req.business.businessId });
  if (foundBusiness !== null) {
    let { rewardName, rewardDollar,redeemLimit} = req.body;
    if (rewardName.length && rewardDollar.length && redeemLimit.length) {
      const business = new Business({
        rewardName: rewardName,
        rewardDollar: rewardDollar,
        redeemLimit: redeemLimit
      });
      await business.updateOne({businessId: businessId}, {$set: business});
      return res.status(201).json({ business });
    }else{
        return res.status(400).json({msg: "Please add all values in the request body"});
    }
  } else {
    return res.status(400).json({ msg: "Business Does not exist" });
  }
};

module.exports = {
  loginBusiness,
  registerBusiness,
  dashboard,
  getAllBusinesses,
  updateBusinessPoints
};
