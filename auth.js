// 1. Initialize EmailJS with your Public Key
emailjs.init(EMAILJS_PUBLIC_KEY);

// Variable to store the generated OTP
let generatedOTP = "";

// Function 1: Sending the Email
function sendOTP() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const btn = document.querySelector('.auth-btn'); 

    // Don't let them click if boxes are empty
    if (name === "" || email === "") {
        alert("Please enter both your name and email.");
        return;
    }

    // Change button to show it is loading
    btn.innerText = "Sending...";
    btn.disabled = true;

    // Generate a random 4-digit number
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Package the data for EmailJS
    const templateParams = {
        user_name: name,
        user_email: email, // EmailJS uses this to know where to send it
        otp: generatedOTP
    };

    // Send the email via EmailJS
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Hide Step 1, Show Step 2
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-2').style.display = 'block';
            
        }, function(error) {
            console.log('FAILED...', error);
            alert("Failed to send OTP!");
            btn.innerText = "Send OTP";
            btn.disabled = false;
        });
}

// Function 2: Checking the OTP
function verifyOTP() {
    const userEnteredOTP = document.getElementById('otpInput').value;

    // Compare what they typed with what we generated
    if (userEnteredOTP === generatedOTP) {
        alert("Verification successful! Welcome to EduTech.");
        // Redirect them to the main dashboard
        window.location.href = 'index.html'; 
    } else {
        alert("Invalid OTP. Please try again.");
    }
}