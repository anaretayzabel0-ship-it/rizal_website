<?php
// =============================================
// api/post_comment.php
// Inserts a new comment into resident_comments
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

$data          = json_decode(file_get_contents('php://input'), true);
$websitePostId = intval($data['website_post_id'] ?? 0);
$residentId    = intval($data['resident_id']    ?? 0);
$content       = trim($data['content']          ?? '');

// ---- Validate ----
if ($websitePostId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid post.']);
    exit;
}

if ($residentId <= 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to comment.']);
    exit;
}

if (empty($content)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Comment cannot be empty.']);
    exit;
}

// ---- Insert comment into Supabase ----
$url = rtrim(SUPABASE_URL, '/') . '/rest/v1/resident_comments';

$newComment = [
    'website_post_id' => $websitePostId,
    'resident_id'     => $residentId,
    'content'         => $content,
    'is_read'         => false,
    'is_flagged'      => false,
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($newComment),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'apikey: '               . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Prefer: return=representation',
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

if ($httpCode !== 201) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to post comment.',
        'details' => json_decode($response)
    ]);
    exit;
}

$comment = json_decode($response, true);

echo json_encode([
    'success' => true,
    'message' => 'Comment posted successfully.',
    'comment' => $comment[0]
]);
