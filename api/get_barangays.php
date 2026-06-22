<?php
// =============================================
// api/get_barangays.php
// Fetches all barangays from Supabase
// =============================================

require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Call Supabase REST API — query barangays table directly
$url = rtrim(SUPABASE_URL, '/') . '/rest/v1/barangays?select=barangay_id,barangay_name,municipality,province&order=barangay_name.asc';

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
    http_response_code($httpCode);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch barangays.', 'details' => json_decode($response)]);
    exit;
}

$barangays = json_decode($response, true);

echo json_encode([
    'success' => true,
    'data'    => $barangays ?? []
]);
