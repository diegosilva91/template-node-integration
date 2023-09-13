import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import {MongoDBSessionStorage} from '@shopify/shopify-app-session-storage-mongodb'
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";
import "dotenv/config";

const DB_PATH = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopify_express_app";
const hostName = process.env.SHOPIFY_APP_URL
  ? process.env.SHOPIFY_APP_URL.replace(/https:\/\//, "")
  : "localhost";
// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: process.env.SHOPIFY_API_VERSION || '2023-04',
    restResources,
    billing: undefined, // or replace with billingConfig above to enable example billing
    hostName: hostName,
    hostScheme: "https",
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new MongoDBSessionStorage(
    DB_PATH)
});

export default shopify;
