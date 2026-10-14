<?php
// 동력 공약 사이트 — PHP 예제
// 실행: handoff 폴더에서  php -S localhost:8000 -t .   →  http://localhost:8000/php/
// 하는 일: data/pledges.json을 읽어 HTML 버전에 데이터를 직접 넣어 보냅니다 (브라우저가 따로 fetch하지 않음).
// 나중에 DB(MySQL 등)로 옮기면 아래 $data를 DB 조회 결과로 바꾸기만 하면 됩니다. 구조는 pledges.json과 같게 맞추세요.

$data = json_decode(file_get_contents(__DIR__ . '/../data/pledges.json'), true);

$html = file_get_contents(__DIR__ . '/../html/index.html');
$html = str_replace('href="style.css"', 'href="../html/style.css"', $html);
$inject = '<script>window.PLEDGES_DATA = ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . ';</script>';
$html = str_replace('<script src="app.js"></script>', $inject . "\n  <script src=\"../html/app.js\"></script>", $html);

header('Content-Type: text/html; charset=utf-8');
echo $html;
