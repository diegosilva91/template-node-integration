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
import querystring  from "querystring";
import cookie from "cookie";
import bodyParser from "body-parser";
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
const shopifyApiPublicKey = process.env.SHOPIFY_API_PUBLIC_KEY;
const shopifyApiSecretKey = process.env.SHOPIFY_API_SECRET_KEY;
const appUrl = process.env.SHOPIFY_APP_URL ;
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

    // MongoDB Connection
const mongoUrl =
process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopify-express-app";

mongoose.connect(mongoUrl) .then(() => console.log('MongoDB Connected'))
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
/*app.get("/shopify/callback", (req, res) => {
  const { shop, hmac, code, shopState } = req.query;

  if(req.headers.cookie === undefined){
    return res.status(400).send("request origin cannot be found");
  }
  const stateCookie = cookie.parse(req.headers.cookie).shopState;

  if (shopState !== stateCookie) {
    return res.status(400).send("request origin cannot be found");
  }

  if (shop && hmac && code) {
    const Map = Object.assign({}, req.query);
    delete Map["hmac"];
    delete Map["signature"];

    const message = 'textBody' in req ? req?.textBody:JSON.stringify(req.body) ;
    console.log("req.textBody",message)
    const providedHmac = Buffer.from(hmac, "utf-8");
    const generatedHash = Buffer.from(
      crypto
        .createHmac("sha256", process.env.SHOPIFY_API_SECRET ??'')
        .update(typeof message === 'string' ? message: JSON.stringify(message))
        .digest("base64"),
      "utf-8"
    );
    let hashEquals = false;
    try {
      console.log("generatedHash",generatedHash);
      console.log("providedHmac",providedHmac)
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
    } catch (e) {
      hashEquals = false;
    }
    if (!hashEquals) {
    //  return res.status(400).send("HMAC validation failed");
    }
    const accessTokenRequestUrl =
      "https://" + shop + "/admin/oauth/access_token";
    const accessTokenPayload = {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    };
    request
      .post(accessTokenRequestUrl, { json: accessTokenPayload })

      .then((accessTokenResponse) => {
        const accessToken = accessTokenResponse.access_token;

        const apiRequestURL = `https:// + ${shop} + /admin/shop.json`;

        const apiRequestHeaders = {
          "X-Shopify-Access-Token": accessToken,
        };

        request
          .get(apiRequestURL, { headers: apiRequestHeaders })

          .then((apiResponse) => {
            res.end(apiResponse);
          })

          .catch((error) => {
            res.status(error.statusCode).send(error.error.error_description);
          });
      })

      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
      });
  } else {
    return res.status(400).send("required parameter missing");
  }
});*/
const buildRedirectUri = () => `${appUrl}/shopify/callback`;

const buildInstallUrl = (shop, state, redirectUri) => `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiPublicKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

const buildAccessTokenRequestUrl = (shop) => `https://${shop}/admin/oauth/access_token`;

const buildShopDataRequestUrl = (shop) => `https://${shop}/admin/shop.json`;

const generateEncryptedHash = (params) => crypto.createHmac('sha256', shopifyApiSecretKey).update(params).digest('hex');

app.get('/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  if(req.headers.cookie === undefined){
    return res.status(400).send("request origin cannot be found");
  }
  const stateCookie = cookie.parse(req.headers.cookie).state;

  console.log("stateCookie,",stateCookie, "state",state,stateCookie===state)
  if (state !== stateCookie) { return res.status(403).send('Cannot be verified')}

  const { hmac, ...params } = req.query
  const queryParams = querystring.stringify(params)
  const hash = generateEncryptedHash(queryParams)

  if (hash !== hmac) { return res.status(400).send('HMAC validation failed')}

  try {
    const data = {
      client_id: shopifyApiPublicKey,
      client_secret: shopifyApiSecretKey,
      code
    };
    const tokenResponse = await fetchAccessToken(shop, data)

    const { access_token } = tokenResponse.data

    const shopData = await fetchShopData(shop, access_token)
    res.send(shopData.data.shop)

  } catch(err) {
    console.log(err)
    res.status(500).send('something went wrong')
  }
});

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());
app.use(csp);
//app.use(isShopActive);
app.get("/api/products/get", async (_req, res) => {
  const Product = await shopify.api.rest.Product.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(Product);
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
