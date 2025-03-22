<?php
require 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and validate inputs
    $fullname = trim(htmlspecialchars($_POST["fullname"]));
    $email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);
    $password = $_POST["password"];

    // Check if email is valid
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "<script>alert('Invalid email format.'); window.location='register.php';</script>";
        exit();
    }

    // Check if password is strong
    if (strlen($password) < 8 || !preg_match("/[A-Z]/", $password) || !preg_match("/[0-9]/", $password)) {
        echo "<script>alert('Password must be at least 8 characters long and include an uppercase letter and a number.'); window.location='register.php';</script>";
        exit();
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // Check if email already exists
    $check_email = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check_email->bind_param("s", $email);
    $check_email->execute();
    $check_email->store_result();
    
    if ($check_email->num_rows > 0) {
        echo "<script>alert('Email already exists. Please use a different email.'); window.location='register.php';</script>";
        exit();
    }

    // Insert user into database securely
    $sql = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $fullname, $email, $hashed_password);

    if ($stmt->execute()) {
        echo "<script>alert('Registration Successful!'); window.location='login.php';</script>";
    } else {
        echo "<script>alert('Error during registration. Please try again.');</script>";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Sign Up - SneakerHub</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="form-container">
        <img src="sneak.png" alt="SneakerHub Logo" class="logo">
        <h2>Sign Up</h2>
        <p class="guide">Please fill in the details below to create an account.</p>

        <form method="POST">
            <div class="form-group">
                <label for="fullname">Full Name</label>
                <input type="text" name="fullname" id="fullname" placeholder="Fullname" required>
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" placeholder="Email" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-container">
                    <input type="password" name="password" id="password" placeholder="Password" required onkeyup="checkPasswordStrength()">
                    <span class="toggle-password" onclick="togglePassword()"></span>
                </div>
                <p class="password-guide">Password must be at least 8 characters long, include an uppercase letter and a number.</p>
                <p id="password-strength"></p>
            </div>

            <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="login.php">Login here</a></p>
    </div>

    <script>
        function checkPasswordStrength() {
            var password = document.getElementById("password").value;
            var strength = document.getElementById("password-strength");

            if (password.length < 8) {
                strength.innerHTML = "Weak Password (Too short)";
                strength.style.color = "red";
            } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
                strength.innerHTML = "Moderate Password (Needs uppercase & number)";
                strength.style.color = "orange";
            } else {
                strength.innerHTML = "Strong Password";
                strength.style.color = "green";
            }
        }

        function togglePassword() {
            var passwordField = document.getElementById("password");
            if (passwordField.type === "password") {
                passwordField.type = "text";
            } else {
                passwordField.type = "password";
            }
        }
    </script>
</body>
</html>
