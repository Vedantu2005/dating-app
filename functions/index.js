const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();

// Initialize Razorpay with your keys
// IMPORTANT: These are your TEST keys. 
const razorpay = new Razorpay({
  key_id: "rzp_test_RoMYE85wG1Vzew", 
  key_secret: "2DACsLl2sqveLX7ypGcmqn9S",
});


// 1. Function to Create an Order
exports.createOrder = functions.https.onCall(async (data, context) => {
  // 👇 FIX: Handle nested data structure
  // Sometimes Firebase wraps the payload in a 'data' property
  const payload = data.data ? data.data : data;

  console.log("📦 Parsed Payload:", payload);

  const amount = payload.amount; 
  
  if (!amount) {
    console.error("❌ Amount is missing! Received:", payload);
    throw new functions.https.HttpsError("invalid-argument", "Amount is required. Received: " + JSON.stringify(payload));
  }

  const options = {
    amount: amount, 
    currency: "INR",
    receipt: "receipt_" + Math.random().toString(36).substring(7),
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log("✅ Order created successfully:", order.id);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error("❌ Error creating order:", error);
    throw new functions.https.HttpsError("internal", "Unable to create order");
  }
});

// 2. Function to Verify Payment (Security Step)
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  // 👇 FIX: Handle nested data here too, just in case
  const payload = data.data ? data.data : data;
  
  const { orderId, paymentId, signature } = payload;

  const generated_signature = crypto
    .createHmac("sha256", "2DACsLl2sqveLX7ypGcmqn9S") // Use the SAME secret key
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature === signature) {
    console.log("✅ Payment verified successfully");
    // You can add logic here to update the user in the database directly if you prefer
    // But currently, your frontend handles the updateDoc call.
    return { status: "success", message: "Payment verified successfully" };
  } else {
    console.error("❌ Signature mismatch");
    throw new functions.https.HttpsError("invalid-argument", "Signature verification failed");
  }
});