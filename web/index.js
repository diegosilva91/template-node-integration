// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import "dotenv/config";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import verifyRequest from "./middlewares/verifyRequest.js";
import mongoose from "mongoose";
import userRoutes from "./routes/index.js";
import csp from "./middlewares/csp.js";
import isShopActive from "./middlewares/isShopActive.js";
import nonce from 'nonce';
import crypto from "crypto";
import request from "request-promise";
import querystring from "querystring";
import cookie from "cookie";
import bodyParser from "body-parser";
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
const shopifyApiPublicKey = process.env.SHOPIFY_API_PUBLIC_KEY;
const shopifyApiSecretKey = process.env.SHOPIFY_API_SECRET_KEY;
const appUrl = process.env.SHOPIFY_APP_URL;
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

// MongoDB Connection
const mongoUrl =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopify-express-app";

mongoose.connect(mongoUrl).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));;
const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);
/*app.use(function(req,res,next){
  req.rawBody = '';
  req.setEncoding('utf8');
  
  req.on('data', function (chunk){
    req.rawBody += chunk;
  })
  next();
})

app.use(bodyParser.json({
  limit:"50mb",
  verify(req,res,buf){   
       req.textBody= buf.toString();
  }
}))*/
app.get("/shopify", (req, res) => {
  const shopName = req.query.shop;
  if (shopName) {
    // use nonce to set a parameter called state
    // the nonce is random string that would be set
    // it would be received on the request
    // the callback from shopify would echo the state
    // the two states would be compared
    // if they match, we are sure the request came from shopify
    // if they don't match, they request is being spoofed
    // this would throw an error
    const shopState = nonce();
    // shopify callback redirect
    const redirectURL = process.env.SHOPIFY_APP_URL + "/shopify/callback";

    // install url for app install
    const installUrl =
      "https://" +
      shopName +
      "/admin/oauth/authorize?client_id=" +
      process.env.SHOPIFY_API_KEY +
      "&scope=" +
      'write_products' +
      "&state=" +
      shopState +
      "&redirect_uri=" +
      redirectURL;

    // in a production app, the cookie should be encrypted
    // but, for the purpose of this application, we won't do that
    res.cookie("state", shopState);
    // redirect the user to the installUrl
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing "Shop Name" parameter!!');
  }
});
// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js


app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());
app.use(csp);
//app.use(isShopActive);
app.get("/api/products/get", async (_req, res) => {
  const Products = await shopify.api.rest.Product.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(Products);
});

app.get("/api/products/get/:productId", async (_req, res) => {
  const productId = _req.params.productId;
  console.log("params", _req.params);
  const Product = await shopify.api.rest.Product.find({
    session: res.locals.shopify.session,
    id: productId,
    fields: 'id,title, variants,image'
  });
  console.log(Product)
  return Product;
});

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});


app.use("/apps", verifyRequest, userRoutes); //Verify user route requests

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
