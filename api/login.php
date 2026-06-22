<?php
// =============================================
// api/login.php
// Handles resident login via Supabase REST API
// =============================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

// ---- Validate inputs ----
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// ---- Fetch user by email from Supabase ----
$url = rtrim(SUPABASE_URL, '/') . '/rest/v1/users?email=eq.' . urlencode($email) . '&select=user_id,first_name,last_name,middle_initial,email,password,status,position,role_id,barangay_id';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET        => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '               . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
    ],
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Request failed: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
    exit;
}

$users = json_decode($response, true);

// ---- Check if user exists ----
if (empty($users)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
    exit;
}

$user = $users[0];

// ---- Check account status ----
if ($user['status'] === 'inactive') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account has been deactivated. Please contact the SK Admin.']);
    exit;
}

if ($user['status'] === 'pending') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account is pending approval. Please wait for confirmation.']);
    exit;
}

// ---- Verify password ----
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
    exit;
}

// ---- Return safe user data (never return password) ----
echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'user'    => [
        'userId'        => $user['user_id'],
        'firstName'     => $user['first_name'],
        'lastName'      => $user['last_name'],
        'middleInitial' => $user['middle_initial'],
        'email'         => $user['email'],
        'position'      => $user['position'],
        'barangayId'    => $user['barangay_id'],
    ]
]);
