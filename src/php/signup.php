<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Debug: Write logs to a file
file_put_contents("debug_log.txt", "PHP file is running\n", FILE_APPEND);

$host = "localhost";
$username = "root";
$password = "";
$database = "mydatabase";

$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) {
    file_put_contents("debug_log.txt", "DB Connection Failed: " . $conn->connect_error . "\n", FILE_APPEND);
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

$data = json_decode(file_get_contents("php://input"), true);
file_put_contents("debug_log.txt", "Received Data: " . print_r($data, true) . "\n", FILE_APPEND);

if (!$data || !isset($data["username"], $data["email"], $data["password"])) {
    file_put_contents("debug_log.txt", "Invalid Input\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Invalid JSON input"]);
    exit();
}

$username = $conn->real_escape_string($data["username"]);
$email = $conn->real_escape_string($data["email"]);
$password = password_hash($data["password"], PASSWORD_BCRYPT);

$sql = "INSERT INTO users (username, email, password_hash) VALUES ('$username', '$email', '$password')";
if ($conn->query($sql) === TRUE) {
    file_put_contents("debug_log.txt", "User inserted successfully\n", FILE_APPEND);
    echo json_encode(["status" => "success", "message" => "User registered successfully"]);
} else {
    file_put_contents("debug_log.txt", "DB Insert Error: " . $conn->error . "\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Registration failed"]);
}

$conn->close();
?>
