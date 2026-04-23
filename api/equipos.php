<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT id, tipo, marca, modelo, serial, ubicacion, estado, equipoUsuario, equipoContrasena
              FROM equipos
              ORDER BY id DESC";
    $result = $conn->query($query);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo listar equipos.']);
        exit;
    }

    $equipos = [];
    while ($row = $result->fetch_assoc()) {
        $equipos[] = [
            'id' => (int) $row['id'],
            'tipo' => $row['tipo'],
            'marca' => $row['marca'],
            'modelo' => $row['modelo'],
            'serial' => $row['serial'],
            'ubicacion' => $row['ubicacion'],
            'estado' => $row['estado'],
            'equipoUsuario' => $row['equipoUsuario'] ?? '',
            'equipoContrasena' => $row['equipoContrasena'] ?? ''
        ];
    }

    echo json_encode($equipos);
    exit;
}

if ($method === 'POST') {
    $payload = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalido.']);
        exit;
    }

    $tipo = trim((string) ($payload['tipo'] ?? ''));
    $marca = trim((string) ($payload['marca'] ?? ''));
    $modelo = trim((string) ($payload['modelo'] ?? ''));
    $serial = trim((string) ($payload['serial'] ?? ''));
    $ubicacion = trim((string) ($payload['ubicacion'] ?? ''));
    $estado = trim((string) ($payload['estado'] ?? ''));
    $equipoUsuario = trim((string) ($payload['equipoUsuario'] ?? ''));
    $equipoContrasena = trim((string) ($payload['equipoContrasena'] ?? ''));

    if ($tipo === '' || $marca === '' || $modelo === '' || $serial === '' || $ubicacion === '' || $estado === '') {
        http_response_code(422);
        echo json_encode(['error' => 'Faltan campos obligatorios.']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO equipos (tipo, marca, modelo, serial, ubicacion, estado, equipoUsuario, equipoContrasena)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo preparar el INSERT.']);
        exit;
    }

    $stmt->bind_param('ssssssss', $tipo, $marca, $modelo, $serial, $ubicacion, $estado, $equipoUsuario, $equipoContrasena);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo guardar el equipo.']);
        exit;
    }

    $id = (int) $stmt->insert_id;
    http_response_code(201);
    echo json_encode([
        'id' => $id,
        'tipo' => $tipo,
        'marca' => $marca,
        'modelo' => $modelo,
        'serial' => $serial,
        'ubicacion' => $ubicacion,
        'estado' => $estado,
        'equipoUsuario' => $equipoUsuario,
        'equipoContrasena' => $equipoContrasena
    ]);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'ID invalido.']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM equipos WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo preparar el DELETE.']);
        exit;
    }

    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo eliminar el equipo.']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo no permitido.']);
