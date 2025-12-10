/**
 * functions/index.js
 * Cloud Function to generate Razorpay Orders securely.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Initialize Razorpay with your key and secret
// TODO: Replace with your actual keys from Razorpay Dashboard
const razorpay = new Razorpay({
  key_id: "rzp_test_RoMYE85wG1Vzew",
  key_secret: "2DACsLl2sqveLX7ypGcmqn9S",
});

exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  // Enable CORS for all requests
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      // 1. Get amount from frontend
      const { amount, currency = "INR" } = req.body;

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      // 2. Create Razorpay options
      // Razorpay accepts amount in 'paise' (1 INR = 100 paise)
      const options = {
        amount: amount * 100, 
        currency,
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1, // Auto-capture payment
      };

      // 3. Create the order via Razorpay API
      const order = await razorpay.orders.create(options);

      // 4. Send order ID back to frontend
      res.status(200).json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
});