<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getConnection(): mysqli
{
    $host = '127.0.0.1';
    $user = 'root';
    $pass = '';
    $database = 'inventario_equipos';

    $conn = new mysqli($host, $user, $pass, $database);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo conectar a MySQL.']);
        exit;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}
