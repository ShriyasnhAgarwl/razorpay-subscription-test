import React, { useState } from 'react';
import { useRazorpay } from 'react-razorpay';
// import Razorpay from '@razorpay/razorpay-js';
import axios from 'axios';
import './App.css';

function App() {
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const Razorpay = useRazorpay();

    // **Replace with your actual Razorpay Plan IDs (Test Mode)**
    const testPlanIds = [
        "plan_MOCK_MONTHLY_PLAN_ID",  // Replace with your Test Monthly Plan ID
        "plan_MOCK_YEARLY_PLAN_ID"   // Replace with your Test Yearly Plan ID
    ];

    const handleSubscriptionSuccess = (response) => {
        console.log("Subscription Success:", response);
        setSubscriptionStatus("Subscription Successful!");
        setErrorMsg('');
    };

    const handleSubscriptionError = (error) => {
        console.error("Subscription Error:", error);
        setSubscriptionStatus('');
        setErrorMsg("Subscription Failed. Check console.");
    };

    const createRazorpaySubscription = async () => {
        if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
            setErrorMsg("Razorpay API key not configured");
            return null;
        }
        if (!selectedPlanId) {
            setErrorMsg("Please select a Plan ID.");
            return null;
        }
        setErrorMsg('');
        try {
            const response = await axios.post('/api/payment/create-subscription', { plan_id: selectedPlanId });
            const subscription = response.data;
            return {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                subscription_id: subscription.id,
                name: "Test Subscription App",
                description: "Sample Subscription",
                handler: handleSubscriptionSuccess,
                theme: { color: "#686CFD" }
            };
        } catch (error) {
            console.error("Error creating subscription:", error);
            setErrorMsg("Error creating subscription. Check console.");
            return null;
        }
    };

    const initializeRazorpayPayment = async () => {
        const options = await createRazorpaySubscription();
        if (!options) return;

        const rzp = new Razorpay(options);
        rzp.open();
    };

    return (
        <div className="App">
            <h1>Razorpay Subscription Test</h1>

            <div>
                <label htmlFor="planSelect">Select Plan ID:</label>
                <select id="planSelect" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                    <option value="">-- Select Plan --</option>
                    {testPlanIds.map(planId => (
                        <option key={planId} value={planId}>{planId}</option>
                    ))}
                </select>
            </div>

            <div style={{ margin: '20px 0' }}>
                <button onClick={initializeRazorpayPayment}>
                    Subscribe Now
                </button>
            </div>

            {subscriptionStatus && <p style={{ color: 'green' }}>{subscriptionStatus}</p>}
            {errorMsg && <p style={{ color: 'red' }}>Error: {errorMsg}</p>}
        </div>
    );
}

export default App;