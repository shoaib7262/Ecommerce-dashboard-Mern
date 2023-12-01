const express = require("express");

require("./db/config");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const userData = require("./model/user");
const product = require("./model/product");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  const user = new userData(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send({ error: "something went wrong in token" });
    } else {
      res.send({ result, auth: token });
    }
  });
});

app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    const user = await userData.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send({ result: "something went wrong in token" });
        } else {
          res.send({ user, auth: token });
        }
      });
    } else {
      res.send({ result: "No user found" });
    }
  } else {
    res.send({ result: "No user found" });
  }
});

app.post("/add-product", verifyToken, async (req, res) => {
  const addProduct = new product(req.body);
  let productData = await addProduct.save();
  res.send(productData);
});

app.get("/product-list", verifyToken, async (req, res) => {
  const getProduct = await product.find();
  if (getProduct.length > 0) {
    res.send(getProduct);
  } else {
    res.send({ result: "no data found" });
  }
});

app.delete("/product/:id", verifyToken, async (req, res) => {
  const filterProduct = await product.deleteOne({ _id: req.params.id });
  res.send(filterProduct);
});

app.get("/product/:id", verifyToken, async (req, res) => {
  const selectProduct = await product.findOne({ _id: req.params.id });
  if (selectProduct) {
    res.send(selectProduct);
  } else {
    res.send({ result: "product not found" });
  }
});

app.put("/productUpdate/:id", verifyToken, async (req, res) => {
  let result = await product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  res.send(result);
});

app.get("/productFilter/:key", verifyToken, async (req, res) => {
  const result = await product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "please send valid token" });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "please add token with headers" });
  }
}
app.listen(4000);
