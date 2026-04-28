-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-04-2026 a las 17:37:15
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventario_equipos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `id` int(11) NOT NULL,
  `equipoId` int(11) NOT NULL,
  `reportadoPor` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Abierta','Resuelta') NOT NULL DEFAULT 'Abierta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `id` int(11) NOT NULL,
  `tipo` enum('Impresora','Escaner','PC Todo en Uno','Laptop','PC de Mesa') NOT NULL,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `serial` varchar(100) NOT NULL,
  `ubicacion` varchar(150) NOT NULL,
  `estado` enum('Activo','En reparacion','Baja') NOT NULL DEFAULT 'Activo',
  `equipoUsuario` varchar(100) DEFAULT NULL,
  `equipoContrasena` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `equipos`
--

INSERT INTO `equipos` (`id`, `tipo`, `marca`, `modelo`, `serial`, `ubicacion`, `estado`, `equipoUsuario`, `equipoContrasena`) VALUES
(910, 'Escaner', 'kyosera', 'wqerqw', 'Q2E32QWE', 'centro', 'Activo', 'Q2E32QWE', 'Equipo2026'),
(911, 'Impresora', 'Lenovo', 'ProBook 450 G8', 'TIRHSJJ5', 'Consultorio 2', 'Baja', 'TIRHSJJ5', 'Equipo2026'),
(912, 'PC de Mesa', 'Lenovo', 'ProBook 450 G8', '884IXDZM', 'Contabilidad', 'En reparacion', '884IXDZM', 'Equipo2026'),
(913, 'PC de Mesa', 'Kyocera', 'Inspiron 15 3511', 'LX96K9AP', 'Consultorio 1', 'Activo', 'LX96K9AP', 'Equipo2026'),
(914, 'PC de Mesa', 'Acer', 'ProBook 450 G8', 'YRVVI7R2', 'Sistemas', 'Activo', 'YRVVI7R2', 'Equipo2026'),
(915, 'Laptop', 'Asus', 'Inspiron 15 3511', 'FNWB0U9B', 'Consultorio 1', 'Baja', 'FNWB0U9B', 'Equipo2026'),
(916, 'PC de Mesa', 'Kyocera', 'ThinkPad T14', 'OHDI9U1Y', 'Recepción', 'Activo', 'OHDI9U1Y', 'Equipo2026'),
(917, 'PC de Mesa', 'Acer', 'Inspiron 15 3511', 'DLIKK0U1', 'Gerencia', 'En reparacion', 'DLIKK0U1', 'Equipo2026'),
(918, 'Impresora', 'Asus', 'ECOSYS M2040dn', 'JZPO7ZO1', 'Contabilidad', 'Baja', 'JZPO7ZO1', 'Equipo2026'),
(919, 'PC de Mesa', 'HP', 'ECOSYS M2040dn', '8OA1TJLR', 'Consultorio 2', 'En reparacion', '8OA1TJLR', 'Equipo2026'),
(920, 'PC de Mesa', 'Dell', 'Inspiron 15 3511', '9T9GL4JF', 'Recepción', 'En reparacion', '9T9GL4JF', 'Equipo2026'),
(921, 'PC de Mesa', 'Dell', 'Aspire 5', 'AT6K2K9W', 'Consultorio 2', 'En reparacion', 'AT6K2K9W', 'Equipo2026'),
(922, 'PC de Mesa', 'Kyocera', 'ProBook 450 G8', 'LHSY8E87', 'Gerencia', 'Baja', 'LHSY8E87', 'Equipo2026'),
(923, 'Laptop', 'Acer', 'Inspiron 15 3511', 'WBSRH4UM', 'Gerencia', 'Activo', 'WBSRH4UM', 'Equipo2026'),
(924, 'Laptop', 'Acer', 'Aspire 5', 'Q792TO9O', 'Contabilidad', 'Baja', 'Q792TO9O', 'Equipo2026'),
(925, 'Laptop', 'Epson', 'ProBook 450 G8', 'JMTCUUVH', 'Consultorio 1', 'Baja', 'JMTCUUVH', 'Equipo2026'),
(926, 'PC de Mesa', 'Acer', 'ThinkPad T14', '3CX4TR1G', 'Recepción', 'En reparacion', '3CX4TR1G', 'Equipo2026'),
(927, 'Impresora', 'Asus', 'ProBook 450 G8', '3NPY44RT', 'Sistemas', 'Activo', '3NPY44RT', 'Equipo2026'),
(928, 'PC de Mesa', 'Dell', 'Aspire 5', '4X06080M', 'Consultorio 2', 'Baja', '4X06080M', 'Equipo2026'),
(929, 'PC de Mesa', 'HP', 'Inspiron 15 3511', 'QP7NH554', 'Recepción', 'Activo', 'QP7NH554', 'Equipo2026'),
(930, 'PC de Mesa', 'Lenovo', 'ECOSYS M2040dn', '2M470VZ9', 'Contabilidad', 'Activo', '2M470VZ9', 'Equipo2026'),
(931, 'PC de Mesa', 'Asus', 'ECOSYS M2040dn', 'VO5R0OFF', 'Consultorio 1', 'Baja', 'VO5R0OFF', 'Equipo2026'),
(932, 'Impresora', 'Epson', 'ThinkPad T14', 'GJC5659K', 'Consultorio 1', 'Activo', 'GJC5659K', 'Equipo2026'),
(933, 'PC de Mesa', 'Asus', 'ECOSYS M2040dn', 'OT75ZFE4', 'Gerencia', 'En reparacion', 'OT75ZFE4', 'Equipo2026'),
(934, 'Laptop', 'Lenovo', 'ProBook 450 G8', 'PX60XWTX', 'Gerencia', 'Activo', 'PX60XWTX', 'Equipo2026'),
(935, 'Laptop', 'Dell', 'ECOSYS M2040dn', 'QU3QCPP7', 'Consultorio 1', 'Activo', 'QU3QCPP7', 'Equipo2026'),
(936, 'Impresora', 'HP', 'Aspire 5', 'TXA9YW7W', 'Sistemas', 'Activo', 'TXA9YW7W', 'Equipo2026'),
(937, 'Laptop', 'HP', 'Aspire 5', 'I36RPW7J', 'Contabilidad', 'En reparacion', 'I36RPW7J', 'Equipo2026'),
(938, 'Laptop', 'Dell', 'ECOSYS M2040dn', '59GY44LB', 'Sistemas', 'Baja', '59GY44LB', 'Equipo2026'),
(939, 'PC de Mesa', 'Kyocera', 'VivoBook 15', 'FL5RPJJZ', 'Gerencia', 'Activo', 'FL5RPJJZ', 'Equipo2026'),
(940, 'Impresora', 'HP', 'ThinkPad T14', 'HQ36F80N', 'Recepción', 'Activo', 'HQ36F80N', 'Equipo2026'),
(941, 'PC de Mesa', 'Acer', 'Inspiron 15 3511', '7J1B7XL5', 'Consultorio 1', 'Activo', '7J1B7XL5', 'Equipo2026'),
(942, 'Impresora', 'Epson', 'ECOSYS M2040dn', 'AVSLYYGC', 'Consultorio 2', 'Baja', 'AVSLYYGC', 'Equipo2026'),
(943, 'Laptop', 'Dell', 'ProBook 450 G8', '0OQYFHXW', 'Contabilidad', 'Baja', '0OQYFHXW', 'Equipo2026'),
(944, 'PC de Mesa', 'Epson', 'Aspire 5', 'NYJ0J3DQ', 'Gerencia', 'Activo', 'NYJ0J3DQ', 'Equipo2026'),
(945, 'PC de Mesa', 'Kyocera', 'Aspire 5', '9DXAOQM3', 'Gerencia', 'Baja', '9DXAOQM3', 'Equipo2026'),
(946, 'Laptop', 'Asus', 'ThinkPad T14', '7VTEJ992', 'Consultorio 2', 'En reparacion', '7VTEJ992', 'Equipo2026'),
(947, 'PC de Mesa', 'Kyocera', 'ECOSYS M2040dn', 'N3XVKPGP', 'Consultorio 2', 'Baja', 'N3XVKPGP', 'Equipo2026'),
(948, 'PC de Mesa', 'Lenovo', 'Inspiron 15 3511', 'SZCLV26B', 'Gerencia', 'Baja', 'SZCLV26B', 'Equipo2026'),
(949, 'Laptop', 'HP', 'Inspiron 15 3511', 'O6DZ82OQ', 'Gerencia', 'Baja', 'O6DZ82OQ', 'Equipo2026'),
(950, 'PC de Mesa', 'Acer', 'ThinkPad T14', '4QH5TGDV', 'Consultorio 2', 'Activo', '4QH5TGDV', 'Equipo2026'),
(951, 'PC de Mesa', 'Asus', 'Aspire 5', '23IKS2GV', 'Gerencia', 'Activo', '23IKS2GV', 'Equipo2026'),
(952, 'PC de Mesa', 'Dell', 'VivoBook 15', '9FHU9SC3', 'Consultorio 1', 'Activo', '9FHU9SC3', 'Equipo2026'),
(953, 'PC de Mesa', 'Lenovo', 'ProBook 450 G8', 'AKMQRY13', 'Gerencia', 'Activo', 'AKMQRY13', 'Equipo2026'),
(954, 'PC de Mesa', 'Epson', 'ECOSYS M2040dn', 'BFEDUZRC', 'Consultorio 2', 'Baja', 'BFEDUZRC', 'Equipo2026'),
(955, 'Laptop', 'Kyocera', 'VivoBook 15', 'I2CTL03B', 'Consultorio 2', 'Activo', 'I2CTL03B', 'Equipo2026'),
(956, 'Impresora', 'HP', 'ThinkPad T14', 'HJQAUKW0', 'Gerencia', 'En reparacion', 'HJQAUKW0', 'Equipo2026'),
(957, 'Impresora', 'Acer', 'Inspiron 15 3511', 'OYNME5Q2', 'Sistemas', 'En reparacion', 'OYNME5Q2', 'Equipo2026'),
(958, 'PC de Mesa', 'Acer', 'Aspire 5', 'C770IKFU', 'Sistemas', 'En reparacion', 'C770IKFU', 'Equipo2026'),
(959, 'PC de Mesa', 'Epson', 'ECOSYS M2040dn', 'PSCYRL0U', 'Consultorio 1', 'En reparacion', 'PSCYRL0U', 'Equipo2026'),
(960, 'Laptop', 'Epson', 'Inspiron 15 3511', '7T8V6H5H', 'Sistemas', 'Baja', '7T8V6H5H', 'Equipo2026');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rol` enum('admin','usuario') NOT NULL DEFAULT 'usuario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`usuario`, `contrasena`, `nombre`, `rol`) VALUES
('admin', 'admin123', 'Administrador', 'admin');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alertas_equipoId` (`equipoId`),
  ADD KEY `idx_alertas_estado` (`estado`),
  ADD KEY `idx_alertas_fecha` (`fecha`);

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_equipos_serial` (`serial`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_ubicacion` (`ubicacion`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `equipos`
--
ALTER TABLE `equipos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=961;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD CONSTRAINT `fk_alertas_equipo` FOREIGN KEY (`equipoId`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
