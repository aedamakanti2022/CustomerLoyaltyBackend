const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Mailer = require("nodemailer");

const login = async (req, res) => {
  const { email, password, persist } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  let foundUser = await User.findOne({ email: req.body.email });
  if (foundUser) {
    const isMatch = await foundUser.comparePassword(password);

    if (isMatch) {
      const token = jwt.sign(
        {
          id: foundUser._id,
          name: foundUser.name,
          customerId: foundUser.customerId,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: persist ? "30d" : "1d",
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
  const luckyNumber = Math.floor(Math.random() * 100);
  let customerId = req.user.customerId;
  let userData = await User.find({ customerId });
  res.status(200).json({
    msg: `Hello, ${req.user.name}`,
    customerId: req.user.customerId,
    userData: userData,
  });
};

const userData = async (req, res) => {
  let customerId = req.user.customerId;
  let userData = await User.find({ customerId });
  res.status(200).json({
    userData,
  });
};

const getAllUsers = async (req, res) => {
  let users = await User.find({});

  return res.status(200).json({ users });
};

const register = async (req, res) => {
  let foundUser = await User.findOne({ email: req.body.email });
  if (foundUser === null) {
    let { username, email, password, customerId } = req.body;
    if (username.length && email.length && password.length) {
      const person = new User({
        customerId: customerId,
        name: username,
        email: email,

        password: password,
      });
      await person.save();
      return res.status(201).json({ person });
    } else {
      return res
        .status(400)
        .json({ msg: "Please add all values in the request body" });
    }
  } else {
    return res.status(400).json({ msg: "Email already in use" });
  }
};

const transporter = Mailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    type: "login",
    user: "aedamakanti@outlook.com",
    pass: "tivvyp-7xiCxi-hedmut",
    // user: "tedd.juma@outlook.com",
    // pass: "birthday1998",
  },
  tls: {
    ciphers: "SSLv3",
  },
});

const resetPassword = async (req, res) => {
  //check for user
  let foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser && false) {
    res.status(400).json({ msg: "Email address doesn't exist" });
    return;
  }

  const email = req.body.email;
  const buffer = Buffer.from(req.body.email);
  const hashed_email = buffer.toString("base64url");

  const message = `
    reset_link: http://localhost:5173/password_reset/${hashed_email}
  `;

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

  res.json({ msg: "Password reset success" });
};

const updatePassword = async (req, res) => {
  const new_password = req.body.new_password;
  const email_hash = req.body.email;

  console.log(req.body);

  const buffer = Buffer.from(email_hash, "base64url");
  const email = buffer.toString();

  const user = await User.findOne({email: email});

  if (user === null) {
    res.status(400).json({msg: "Email doesn't exist"});
    return;
  }

  user.password = new_password;
  user.save();

  res.status(200).json({msg: "Password update successful"});
}

module.exports = {
  login,
  register,
  dashboard,
  getAllUsers,
  resetPassword,
  updatePassword,
};
