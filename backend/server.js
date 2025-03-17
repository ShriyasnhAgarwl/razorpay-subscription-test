// razorpay-subscription-test/backend/server.js
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post('/api/payment/create-subscription', async (req, res) => {
    try {
        const plan_id = req.body.plan_id;
        if (!plan_id) return res.status(400).send({ error: "Plan ID required" });
        
        const options = {
            plan_id: plan_id,
            customer_notify: 1,
            total_count: 12  // Number of billing cycles
        };

        console.log('Creating subscription with options:', options);

        razorpayInstance.subscriptions.create(options, (err, subscription) => {
            if (err) {
                console.error("Subscription Creation Error Details:", err);
                return res.status(500).send({ 
                    error: "Subscription Creation Failed",
                    details: err.message 
                });
            }
            console.log('Subscription created successfully:', subscription);
            res.json(subscription);
        });
    } catch (error) {
        console.error("Server Error (createSub):", error);
        res.status(500).send({ error: "Server Error", details: error.message });
    }
});

const crypto = require('crypto');
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

app.post('/api/payment/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookBody = req.body.toString();
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(webhookBody).digest('hex');

        if (expectedSignature === signature) {
            const eventData = JSON.parse(webhookBody);
            const eventType = eventData.event;

            console.log(`[Webhook Received]: ${eventType}`); // Simplified Logging

            if (eventType === 'payment.captured') {
                console.log("[Webhook Payload (payment.captured)]:", eventData.payload.payment.entity.subscription_id);
            } else if (eventType === 'payment.failed') {
                console.log("[Webhook Payload (payment.failed)]:", eventData.payload.payment.entity.subscription_id);
            } else if (eventType === 'subscription.updated') {
                console.log("[Webhook Payload (subscription.updated)]:", eventData.payload.subscription.entity.id, eventData.payload.subscription.entity.status);
            } else if (eventType === 'subscription.cancelled') {
                console.log("[Webhook Payload (subscription.cancelled)]:", eventData.payload.subscription.entity.id);
            }

            res.status(200).send('Webhook Received');
        } else {
            console.error("Webhook Signature Verification Failed!");
            res.status(400).send('Webhook Signature Verification Failed');
        }
    } catch (error) {
        console.error("Webhook Processing Error:", error);
        res.status(500).send('Webhook Processing Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Sample App listening on port ${PORT}`));