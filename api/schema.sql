CREATE DATABASE IF NOT EXISTS inventario_equipos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_equipos;

CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  marca VARCHAR(80) NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  serial VARCHAR(80) NOT NULL UNIQUE,
  ubicacion VARCHAR(120) NOT NULL,
  estado ENUM('Activo', 'En reparacion', 'Baja') NOT NULL,
  equipoUsuario VARCHAR(120) DEFAULT '',
  equipoContrasena VARCHAR(120) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
