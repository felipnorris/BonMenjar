<?php
header('Content-Type: application/json');

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['author', 'itemReviewed', 'reviewRating', 'reviewBody'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }
    
    // Read existing reviews
    $reviewsFile = '../assets/data/reviews.json';
    $jsonContent = file_get_contents($reviewsFile);
    $reviews = json_decode($jsonContent, true);
    
    if (!$reviews) {
        $reviews = [
            '@context' => 'http://schema.org',
            '@type' => 'Review',
            'reviews' => []
        ];
    }
    
    // Create new review
    $newReview = [
        'id' => 'review-' . (count($reviews['reviews']) + 1),
        'author' => $input['author'],
        'itemReviewed' => $input['itemReviewed'],
        'reviewRating' => [
            '@type' => 'Rating',
            'ratingValue' => intval($input['reviewRating'])
        ],
        'reviewBody' => $input['reviewBody']
    ];
    
    // Add new review
    $reviews['reviews'][] = $newReview;
    
    // Save updated reviews
    if (!file_put_contents($reviewsFile, json_encode($reviews, JSON_PRETTY_PRINT))) {
        throw new Exception('Failed to save review');
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Review saved successfully',
        'review' => $newReview
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>