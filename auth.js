// Global Configuration for EmailJS
window.EMAILJS_PUBLIC_KEY = "jZmDzOTsXBojdVgzH";
window.EMAILJS_SERVICE_ID = "service_30dr4b8";
window.EMAILJS_TEMPLATE_ID = "template_2bzxr6m";

// Initialize EmailJS safely
(function() {
    if (window.emailjs) {
        emailjs.init(window.EMAILJS_PUBLIC_KEY);
    }
})();

// Store generated OTP in memory
let generatedOTP = "";

// ----------------------------------------------------
// 1. Send OTP Function
// ----------------------------------------------------
async function sendOTP() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const btn = document.querySelector('.auth-btn'); 

    // Validation
    if (!name || !email || !password) {
        alert("Please enter your name, email, and password before requesting an OTP.");
        return;
    }

    if (!email.includes("@")) {
        alert("Please enter a valid email address.");
        return;
    }

    // UI Feedback
    if (btn) {
        btn.innerText = "Sending OTP...";
        btn.disabled = true;
    }

    // Generate random 4-digit OTP
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Package data for EmailJS
    const templateParams = {
        user_name: name,
        user_email: email,
        to_email: email,      // alias in case template uses {{to_email}}
        email: email,         // alias in case template uses {{email}}
        otp: generatedOTP
    };

    try {
        const response = await emailjs.send(
            window.EMAILJS_SERVICE_ID, 
            window.EMAILJS_TEMPLATE_ID, 
            templateParams
        );
        console.log('SUCCESS!', response.status, response.text);
        
        alert("OTP has been sent to " + email);

        // Hide Step 1, Show Step 2
        document.getElementById('step-1').style.display = 'none';
        document.getElementById('step-2').style.display = 'block';

    } catch (error) {
        console.error('EmailJS FAILED...', error);
        alert("Failed to send OTP! Check the browser console for details.");
        if (btn) {
            btn.innerText = "Send OTP";
            btn.disabled = false;
        }
    }
}

// ----------------------------------------------------
// 2. Verify OTP & Register to MongoDB
// ----------------------------------------------------
async function verifyOTP() {
    const userEnteredOTP = document.getElementById('otpInput').value.trim();

    if (!userEnteredOTP) {
        alert("Please enter the OTP sent to your email.");
        return;
    }

    // Compare entered code against generated OTP
    if (userEnteredOTP === generatedOTP) {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name, email: email, password: password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Verification successful! Account created.");
                localStorage.setItem("edutech_user", name);
                window.location.href = 'dashboard.html'; 
            } else {
                alert("Registration Error: " + (data.message || "Could not register"));
            }
        } catch (error) {
            console.error("Backend error:", error);
            alert("Backend connection failed! Ensure your Node.js server is running on port 5000.");
        }
        
    } else {
        alert("Invalid OTP. Please try again.");
    }
}

// ----------------------------------------------------
// 3. User Login Function
// ----------------------------------------------------
async function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login Successful! Welcome back, " + data.name);
            localStorage.setItem("edutech_user", data.name);
            window.location.href = 'dashboard.html'; 
        } else {
            alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
    } catch (error) {
        console.error("Backend error:", error);
        alert("Backend connection failed! Ensure your Node.js server is running on port 5000.");
    }
}