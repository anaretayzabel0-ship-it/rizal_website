<?php
// =============================================
// api/register.php
// Registers a new resident user via Supabase
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

// Read JSON body
$data          = json_decode(file_get_contents('php://input'), true);
$firstName     = trim($data['firstName']     ?? '');
$lastName      = trim($data['lastName']      ?? '');
$middleInitial = trim($data['middleInitial'] ?? '');
$email         = trim($data['email']         ?? '');
$barangayId    = intval($data['barangayId']  ?? 0);
$password      = $data['password']           ?? '';
$confirmPw     = $data['confirmPassword']    ?? '';

// ---- Validate ----
$errors = [];
if (empty($firstName))                         $errors['firstName']       = 'First name is required.';
if (empty($lastName))                          $errors['lastName']        = 'Last name is required.';
if (empty($email))                             $errors['email']           = 'Email is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email']          = 'Invalid email address.';
if ($barangayId <= 0)                          $errors['barangayId']      = 'Please select your barangay.';
if (empty($password))                          $errors['password']        = 'Password is required.';
if (strlen($password) < 8)                     $errors['password']        = 'Password must be at least 8 characters.';
if ($password !== $confirmPw)                  $errors['confirmPassword'] = 'Passwords do not match.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// ---- Check if email already exists in Supabase ----
$checkUrl = rtrim(SUPABASE_URL, '/') . '/rest/v1/users?email=eq.' . urlencode($email) . '&select=user_id';

$ch = curl_init($checkUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET        => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '               . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
    ],
]);
$checkResponse = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!empty($checkResponse)) {
    http_response_code(409);
    echo json_encode(['success' => false, 'errors' => ['email' => 'This email is already registered.']]);
    exit;
}

// ---- Get resident role_id ----
$roleUrl = rtrim(SUPABASE_URL, '/') . '/rest/v1/roles?role_name=eq.resident&select=role_id';

$ch = curl_init($roleUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET        => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '               . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
    ],
]);
$roleResponse = json_decode(curl_exec($ch), true);
curl_close($ch);

if (empty($roleResponse)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Role 'resident' not found. Please contact the administrator."]);
    exit;
}

$roleId = $roleResponse[0]['role_id'];

// ---- Hash password ----
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// ---- Insert new user into Supabase ----
$insertUrl = rtrim(SUPABASE_URL, '/') . '/rest/v1/users';

$newUser = [
    'role_id'        => $roleId,
    'barangay_id'    => $barangayId,
    'first_name'     => $firstName,
    'last_name'      => $lastName,
    'middle_initial' => $middleInitial ?: null,
    'email'          => $email,
    'password'       => $hashedPassword,
    'status'         => 'active',
    'position'       => 'resident',    // active immediately
];



$ch = curl_init($insertUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($newUser),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '               . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Prefer: return=representation', // return the inserted row
    ],
]);

$insertResponse = curl_exec($ch);
$httpCode       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 201) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create account. Please try again.', 'details' => json_decode($insertResponse)]);
    exit;
}

$created = json_decode($insertResponse, true);

echo json_encode([
    'success' => true,
    'message' => 'Account created successfully! You can now log in.',
    'user'    => [
        'userId'    => $created[0]['user_id'],
        'firstName' => $created[0]['first_name'],
        'lastName'  => $created[0]['last_name'],
        'email'     => $created[0]['email'],
        'status'    => $created[0]['status'],
    ]
]);
