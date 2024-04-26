const jwt = require("jsonwebtoken");
const Business = require("../models/business");
const points = require("../models/businessPoints");
const Mailer = require("nodemailer");

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


/**
 * transporter - object that is able to send an email
 * takes a transport configuration object, connection url or a transport plugin instance
 */
const transporter = Mailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    type: "login",
    user: "aedamakanti@outlook.com",
    pass: "tivvyp-7xiCxi-hedmut",
  },
  tls: {
    ciphers: "SSLv3",
  },
});


const businessResetPassword = async (req, res) => {
  //check for user
  let foundUser = await Business.findOne({ email: req.body.email });
  if (!foundUser) {
    res.status(400).json({ msg: "Email address doesn't exist" });
    return;
  }

  //We encode the email with base64 url to make it work with url by replacing url unfreandly characters.
  const email = req.body.email;
  const buffer = Buffer.from(JSON.stringify({email:req.body.email, timestamp: Date.now()}));
  const hashed_email =  buffer.toString("base64url");

  const message = `
    reset_link: https://customerloyaty.azurewebsites.net/#/business/password_reset/${hashed_email}
  `;

  console.log(message)

  //send email.
  try {
    const info = await transporter.sendMail({
      from: "aedamakanti@outlook.com",
      to: email,
      subject: "Password reset",
      text: message,
    });
  } catch (e) {
    console.error(e);
  }

  res.json({ msg: "Password reset link has been submitted" });
};

const businessUpdatePassword = async (req, res) => {
  const new_password = req.body.new_password;
  const email_hash = req.body.email;

  console.log(req.body);

  //We decode the email hash back to its original email and check if the email exists against the database.
  const buffer = Buffer.from(email_hash, "base64url");
  const email =  JSON.parse(buffer.toString())["email"];

  const user = await Business.findOne({email: email});

  if (user === null) {
    res.status(400).json({msg: "Email doesn't exist"});
    return;
  }

  user.password = new_password;
  user.save();

  res.status(200).json({msg: "Password update successful"});
}

module.exports = {
  loginBusiness,
  registerBusiness,
  dashboard,
  getAllBusinesses,
  updateBusinessPoints,
  businessResetPassword,
  businessUpdatePassword,
};
