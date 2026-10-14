<?php
// 공약 데이터 JSON API — GET /php/api.php , GET /php/api.php?category=facility
$data = json_decode(file_get_contents(__DIR__ . '/../data/pledges.json'), true);
if (isset($_GET['category'])) {
    $data['categories'] = array_values(array_filter($data['categories'], fn($c) => $c['id'] === $_GET['category']));
}
header('Content-Type: application/json; charset=utf-8');
echo json_encode($data, JSON_UNESCAPED_UNICODE);
