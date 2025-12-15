const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Resend } = require("resend"); // Import Resend

admin.initializeApp();

// --- CONFIGURATION ---

// 1. Initialize Razorpay (Your Existing Test Keys)
const razorpay = new Razorpay({
  key_id: "rzp_test_RoMYE85wG1Vzew",
  key_secret: "2DACsLl2sqveLX7ypGcmqn9S",
});

// 2. Initialize Resend (Email Service)
// ⚠️ IMPORTANT: Replace this string with your actual API Key from https://resend.com
const resend = new Resend("re_X117WVFD_GZpbiVN7hH6Z6GWhQ3NLNkLu");


// --- FUNCTIONS ---

// Function 1: Send Password Reset Email (High Deliverability)
exports.sendPasswordReset = functions.https.onCall(async (data, context) => {
  // Handle nested data structure if necessary
  const payload = data.data ? data.data : data;
  const email = payload.email;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // A. Generate the official Firebase reset link
    const link = await admin.auth().generatePasswordResetLink(email);

    // B. Send the email using Resend
    // Note: If you haven't verified a domain on Resend yet, you must send FROM: 'onboarding@resend.dev'
    // Once verified, change it to 'support@yourdomain.com'
    await resend.emails.send({
      from: "BSSS Dating Support <onboarding@resend.dev>", 
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reset Password Request</h2>
          <p>Hi there,</p>
          <p>We received a request to reset your password for BSSS Dating.</p>
          <p style="margin: 20px 0;">
            <a href="${link}" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </p>
          <p style="font-size: 12px; color: #666;">If you didn't ask for this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Hi there, We received a request to reset your password. Click here: ${link}`,
    });

    return { success: true, message: "Email sent successfully" };

  } catch (error) {
    console.error("Error sending email:", error);
    
    if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    throw new functions.https.HttpsError('internal', 'Unable to send email');
  }
});


// Function 2: Create Razorpay Order
exports.createOrder = functions.https.onCall(async (data, context) => {
  const payload = data.data ? data.data : data;
  console.log("📦 Parsed Payload:", payload);

  const amount = payload.amount;

  if (!amount) {
    console.error("❌ Amount is missing! Received:", payload);
    throw new functions.https.HttpsError("invalid-argument", "Amount is required.");
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


// Function 3: Verify Razorpay Payment
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  const payload = data.data ? data.data : data;
  const { orderId, paymentId, signature } = payload;

  const generated_signature = crypto
    .createHmac("sha256", "2DACsLl2sqveLX7ypGcmqn9S") // Using your provided secret
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature === signature) {
    console.log("✅ Payment verified successfully");
    return { status: "success", message: "Payment verified successfully" };
  } else {
    console.error("❌ Signature mismatch");
    throw new functions.https.HttpsError("invalid-argument", "Signature verification failed");
  }
});