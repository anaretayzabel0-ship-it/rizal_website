<?php
// =============================================
// api/get_posts.php
// Calls your Supabase function via REST API:
//   get_website_post_details(p_website_post_id)
//
// Usage:
//   GET  api/get_posts.php        → returns all posts
//   GET  api/get_posts.php?id=5   → returns one post
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

// Optional: filter by a single post id
$postId = isset($_GET['id']) ? intval($_GET['id']) : null;

// ---- Build the RPC endpoint URL ----
// Supabase exposes your functions at: /rest/v1/rpc/function_name
$url = rtrim(SUPABASE_URL, '/') . '/rest/v1/rpc/get_website_post_details';

// ---- Build the request body ----
$body = json_encode([
    'p_website_post_id' => $postId  // NULL if not provided = fetch all posts
]);

// ---- Call Supabase using cURL ----
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '         . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// ---- Handle cURL errors ----
if ($curlError) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Request failed: ' . $curlError]);
    exit;
}

// ---- Handle Supabase errors ----
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['success' => false, 'message' => 'Supabase error.', 'details' => json_decode($response)]);
    exit;
}

// ---- Return the data ----
$posts = json_decode($response, true);

echo json_encode([
    'success' => true,
    'data'    => $posts ?? []
]);
