import { API_CONFIG } from './config.js';

// 1. Setup UPI
const upiId = API_CONFIG.upiId || 'singhharsh199-1@okaxis';
const amount = '500';
const name = 'Harsh Singh';

const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

const upiQrImg = document.getElementById('upi-qr');
if (upiQrImg) upiQrImg.src = qrUrl;

const upiIdDisplay = document.getElementById('upi-id-display');
if (upiIdDisplay) upiIdDisplay.textContent = upiId;

// 2. Setup PayPal
const paypalBtn = document.getElementById('paypal-btn');
if (paypalBtn && API_CONFIG.paypalLink) {
    paypalBtn.style.display = 'flex';
    paypalBtn.addEventListener('click', () => {
        window.open(API_CONFIG.paypalLink, '_blank');
    });
}

// 3. Automated Key Request
const requestBtn = document.getElementById('request-key-btn');
const statusMsg = document.getElementById('status-msg');
const emailInput = document.getElementById('user-email');

if (requestBtn) {
    requestBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();

        if (!email || !email.includes('@')) {
            statusMsg.style.color = '#ff6b6b';
            statusMsg.textContent = "❌ Please enter a valid email first.";
            return;
        }

        requestBtn.disabled = true;
        statusMsg.style.color = '#888';
        statusMsg.textContent = "Sending request...";

        try {
            const endpoint = API_CONFIG.licenseServerUrl;
            if (!endpoint) throw new Error("Backend not configured");

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: "request_key",
                    email: email
                })
            });

            const data = await response.json();

            if (data.success) {
                statusMsg.style.color = '#10a37f';
                statusMsg.textContent = "✅ Key sent! Check your inbox (and Spam).";
                requestBtn.textContent = "Email Sent!";
            } else {
                throw new Error(data.message || "Failed to send key");
            }
        } catch (error) {
            console.error(error);
            statusMsg.style.color = '#ff6b6b';
            statusMsg.textContent = "❌ Error: " + error.message;
            requestBtn.disabled = false;
        }
    });
}

// 4. Geo Detect Strategy
let viewDecided = false;

function showView(countryCode) {
    if (viewDecided) return;
    viewDecided = true;
    document.getElementById('loader').style.display = 'none';
    if (countryCode === 'IN') {
        document.getElementById('view-in').classList.add('active');
    } else {
        document.getElementById('view-global').classList.add('active');
    }
}

setTimeout(() => {
    if (!viewDecided) showView('GLOBAL');
}, 3500);

async function checkIpLocation() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            showView(data.country_code);
            return;
        }
        throw new Error("Primary API Failed");
    } catch (e) {
        try {
            const res2 = await fetch('https://api.country.is/');
            if (res2.ok) {
                const data2 = await res2.json();
                showView(data2.country);
                return;
            }
        } catch (e2) { }
        showView('GLOBAL');
    }
}

// Trigger browser prompt then check IP
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        () => checkIpLocation(),
        () => checkIpLocation()
    );
} else {
    checkIpLocation();
}
