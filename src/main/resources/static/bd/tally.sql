/*
 Navicat Premium Data Transfer

 Source Server         : Evaluacion
 Source Server Type    : MySQL
 Source Server Version : 100432 (10.4.32-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : tally

 Target Server Type    : MySQL
 Target Server Version : 100432 (10.4.32-MariaDB)
 File Encoding         : 65001

 Date: 29/01/2026 22:08:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for auditoria
-- ----------------------------
DROP TABLE IF EXISTS `auditoria`;
CREATE TABLE `auditoria`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `rol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `accion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `detalle` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `fecha` datetime NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of auditoria
-- ----------------------------
INSERT INTO `auditoria` VALUES (1, 'Admin', 'ADMIN', 'APROBADO Pago #2', NULL, '2026-01-28 05:12:21');
INSERT INTO `auditoria` VALUES (2, 'Admin', 'ADMIN', 'RECHAZADO Pago #1', NULL, '2026-01-28 05:22:55');
INSERT INTO `auditoria` VALUES (3, 'Admin', 'ADMIN', 'APROBADO Pago #3', NULL, '2026-01-28 05:23:01');
INSERT INTO `auditoria` VALUES (4, 'Admin', 'ADMIN', 'APROBADO Pago #4', NULL, '2026-01-28 05:23:08');
INSERT INTO `auditoria` VALUES (5, 'Admin', 'ADMIN', 'APROBADO Pago #5', NULL, '2026-01-28 05:33:14');

-- ----------------------------
-- Table structure for billetera_estudiante
-- ----------------------------
DROP TABLE IF EXISTS `billetera_estudiante`;
CREATE TABLE `billetera_estudiante`  (
  `estudiante_id` bigint NOT NULL,
  `saldo_bs` decimal(38, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`estudiante_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of billetera_estudiante
-- ----------------------------

-- ----------------------------
-- Table structure for carreras
-- ----------------------------
DROP TABLE IF EXISTS `carreras`;
CREATE TABLE `carreras`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `codigo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `nombre`(`nombre` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of carreras
-- ----------------------------
INSERT INTO `carreras` VALUES (1, 'Ingeniería de Sistemas', 'ING-SIS');
INSERT INTO `carreras` VALUES (2, 'Ingeniería Industrial', 'ING-IND');

-- ----------------------------
-- Table structure for comprobantes
-- ----------------------------
DROP TABLE IF EXISTS `comprobantes`;
CREATE TABLE `comprobantes`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pago_estudiante_id` int NOT NULL,
  `monto_pagado_bs` double NULL DEFAULT NULL,
  `tasa_cambio` decimal(10, 2) NULL DEFAULT NULL,
  `banco_origen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `numero_referencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha_transaccion` date NOT NULL,
  `url_archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `estatus_admin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `motivo_rechazo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp,
  `notas_admin` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `telefono_origen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pago_estudiante_id`(`pago_estudiante_id` ASC) USING BTREE,
  CONSTRAINT `comprobante_fk_pago` FOREIGN KEY (`pago_estudiante_id`) REFERENCES `pagos_estudiante` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comprobantes
-- ----------------------------
INSERT INTO `comprobantes` VALUES (1, 1, 36000, NULL, 'Banesco', '456456', '2026-01-28', 'uploads/1769576965934_logo.png', 'RECHAZADO', 'Foto equivocada', '2026-01-28 05:09:25', NULL, NULL);
INSERT INTO `comprobantes` VALUES (2, 1, 40000, NULL, 'Banesco', '131313', '2026-01-28', 'uploads/1769576982324_logo.png', 'APROBADO', NULL, '2026-01-28 05:09:42', NULL, NULL);
INSERT INTO `comprobantes` VALUES (3, 2, 37380, NULL, 'Venezuela', '241234', '2026-01-28', 'uploads/1769577085436_WhatsApp Image 2026-01-27 at 12.03.08 AM.jpeg', 'APROBADO', NULL, '2026-01-28 05:11:25', NULL, NULL);
INSERT INTO `comprobantes` VALUES (4, 6, 48500, NULL, 'Venezuela', '123963', '2026-01-28', 'uploads/1769577722125_WhatsApp Image 2026-01-27 at 12.03.08 AM.jpeg', 'APROBADO', NULL, '2026-01-28 05:22:02', NULL, NULL);
INSERT INTO `comprobantes` VALUES (5, 8, 35000, NULL, 'Venezuela', '344556', '2026-01-28', 'uploads/1769578346906_WhatsApp Image 2026-01-27 at 12.03.08 AM.jpeg', 'APROBADO', NULL, '2026-01-28 05:32:26', NULL, NULL);

-- ----------------------------
-- Table structure for conceptos_pago
-- ----------------------------
DROP TABLE IF EXISTS `conceptos_pago`;
CREATE TABLE `conceptos_pago`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `periodo_id` int NOT NULL,
  `divisa_id` int NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `monto_default` decimal(38, 2) NULL DEFAULT NULL,
  `fecha_vencimiento` date NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `prorroga` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `periodo_id`(`periodo_id` ASC) USING BTREE,
  INDEX `divisa_id`(`divisa_id` ASC) USING BTREE,
  CONSTRAINT `concepto_fk_divisa` FOREIGN KEY (`divisa_id`) REFERENCES `divisas` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `concepto_fk_periodo` FOREIGN KEY (`periodo_id`) REFERENCES `periodos` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of conceptos_pago
-- ----------------------------
INSERT INTO `conceptos_pago` VALUES (1, 1, 1, 'Inscripción 2026-1', 120.00, '2026-01-25', 1, 10);
INSERT INTO `conceptos_pago` VALUES (7, 1, 1, 'Mensualidad Febrero', 80.00, '2026-02-01', 1, 5);
INSERT INTO `conceptos_pago` VALUES (8, 1, 1, 'Mensualidad Marzo', 80.00, '2026-03-01', 1, 5);
INSERT INTO `conceptos_pago` VALUES (10, 1, 1, 'Mensualidad Abrilaa', 80.00, '2026-04-01', 1, 5);
INSERT INTO `conceptos_pago` VALUES (12, 3, 2, 'Inscripción 2026-2', 10.00, '2026-10-07', 1, 5);

-- ----------------------------
-- Table structure for datos_pago
-- ----------------------------
DROP TABLE IF EXISTS `datos_pago`;
CREATE TABLE `datos_pago`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `banco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identificador` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `numero_cuenta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instrucciones` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `activo` tinyint(1) NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of datos_pago
-- ----------------------------
INSERT INTO `datos_pago` VALUES (1, 'PAGO_MOVIL', 'Banco de Venezuela', NULL, 'J-500123456', NULL, '0412-1234567', NULL, 1, '2026-01-26 23:49:50');
INSERT INTO `datos_pago` VALUES (3, 'TRANSFERENCIA', 'Venezuela', 'PSM', '0103227443003', '01020032344242323233', '', 'Enviar capture', 1, '2026-01-28 01:19:47');

-- ----------------------------
-- Table structure for divisas
-- ----------------------------
DROP TABLE IF EXISTS `divisas`;
CREATE TABLE `divisas`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `simbolo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tasa` decimal(38, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `codigo`(`codigo` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of divisas
-- ----------------------------
INSERT INTO `divisas` VALUES (1, 'USD', 'Dólar', '$', 367.31);
INSERT INTO `divisas` VALUES (2, 'EUR', 'Euro', '€', 439.47);

-- ----------------------------
-- Table structure for estudiante_detalles
-- ----------------------------
DROP TABLE IF EXISTS `estudiante_detalles`;
CREATE TABLE `estudiante_detalles`  (
  `usuario_id` int NOT NULL,
  `carrera_id` int NULL DEFAULT NULL,
  `extension_id` int NULL DEFAULT NULL,
  `saldo_billetera` decimal(38, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`usuario_id`) USING BTREE,
  INDEX `fk_detalles_carrera`(`carrera_id` ASC) USING BTREE,
  INDEX `fk_detalles_extension`(`extension_id` ASC) USING BTREE,
  CONSTRAINT `fk_detalles_carrera` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_detalles_extension` FOREIGN KEY (`extension_id`) REFERENCES `extensiones` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_detalles_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of estudiante_detalles
-- ----------------------------
INSERT INTO `estudiante_detalles` VALUES (8, 2, 1, 5000.00);
INSERT INTO `estudiante_detalles` VALUES (9, 1, 2, 0.00);
INSERT INTO `estudiante_detalles` VALUES (10, 1, 1, 0.00);
INSERT INTO `estudiante_detalles` VALUES (12, 1, 1, 55000.00);
INSERT INTO `estudiante_detalles` VALUES (15, 1, 2, 0.00);
INSERT INTO `estudiante_detalles` VALUES (16, 1, 2, 0.00);

-- ----------------------------
-- Table structure for extensiones
-- ----------------------------
DROP TABLE IF EXISTS `extensiones`;
CREATE TABLE `extensiones`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `nombre`(`nombre` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of extensiones
-- ----------------------------
INSERT INTO `extensiones` VALUES (2, 'Caracas');
INSERT INTO `extensiones` VALUES (1, 'Maracay');

-- ----------------------------
-- Table structure for feedback
-- ----------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comentario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha_enviado` timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of feedback
-- ----------------------------
INSERT INTO `feedback` VALUES (1, 'Sugerencia', 'Profe pongame 20', '2026-01-29 23:55:24');

-- ----------------------------
-- Table structure for metodos_pago
-- ----------------------------
DROP TABLE IF EXISTS `metodos_pago`;
CREATE TABLE `metodos_pago`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `banco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cedula` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `titular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usuario_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_metodos_usuario`(`usuario_id` ASC) USING BTREE,
  CONSTRAINT `fk_metodos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of metodos_pago
-- ----------------------------
INSERT INTO `metodos_pago` VALUES (1, 'Mi Banesco', 'Banesco', '23123123', '04121231212', 'PAGO_MOVIL', '', 8);
INSERT INTO `metodos_pago` VALUES (2, 'Mi venezuela', 'Venezuela', '31265708', '04124834441', 'PAGO_MOVIL', '', 12);

-- ----------------------------
-- Table structure for pagos_estudiante
-- ----------------------------
DROP TABLE IF EXISTS `pagos_estudiante`;
CREATE TABLE `pagos_estudiante`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `estudiante_id` int NOT NULL,
  `concepto_id` int NOT NULL,
  `monto_final_divisa` decimal(38, 2) NULL DEFAULT NULL,
  `monto_abonado` decimal(38, 2) NULL DEFAULT NULL,
  `estatus_pago` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `estudiante_id`(`estudiante_id` ASC) USING BTREE,
  INDEX `concepto_id`(`concepto_id` ASC) USING BTREE,
  CONSTRAINT `pago_est_fk_concepto` FOREIGN KEY (`concepto_id`) REFERENCES `conceptos_pago` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `pago_est_fk_usuario` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of pagos_estudiante
-- ----------------------------
INSERT INTO `pagos_estudiante` VALUES (1, 8, 1, 120.00, 120.00, 'APROBADO', '2026-01-28 01:08:27');
INSERT INTO `pagos_estudiante` VALUES (2, 9, 1, 120.00, 0.00, 'PENDIENTE', '2026-01-28 01:10:12');
INSERT INTO `pagos_estudiante` VALUES (3, 8, 7, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:12:21');
INSERT INTO `pagos_estudiante` VALUES (4, 8, 8, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:12:21');
INSERT INTO `pagos_estudiante` VALUES (5, 10, 1, 120.00, 0.00, 'PENDIENTE', '2026-01-28 01:18:35');
INSERT INTO `pagos_estudiante` VALUES (6, 12, 1, 120.00, 120.00, 'APROBADO', '2026-01-28 01:18:35');
INSERT INTO `pagos_estudiante` VALUES (7, 8, 10, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:18:52');
INSERT INTO `pagos_estudiante` VALUES (8, 12, 7, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:23:08');
INSERT INTO `pagos_estudiante` VALUES (9, 12, 8, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:23:08');
INSERT INTO `pagos_estudiante` VALUES (10, 12, 10, 80.00, 0.00, 'PENDIENTE', '2026-01-28 01:23:08');
INSERT INTO `pagos_estudiante` VALUES (15, 8, 12, 10.00, 0.00, 'PENDIENTE', '2026-01-29 00:57:54');
INSERT INTO `pagos_estudiante` VALUES (16, 9, 12, 10.00, 0.00, 'PENDIENTE', '2026-01-29 00:57:54');
INSERT INTO `pagos_estudiante` VALUES (17, 10, 12, 10.00, 0.00, 'PENDIENTE', '2026-01-29 00:57:54');
INSERT INTO `pagos_estudiante` VALUES (18, 12, 12, 10.00, 0.00, 'PENDIENTE', '2026-01-29 00:57:54');

-- ----------------------------
-- Table structure for periodos
-- ----------------------------
DROP TABLE IF EXISTS `periodos`;
CREATE TABLE `periodos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estatus` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `nombre`(`nombre` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of periodos
-- ----------------------------
INSERT INTO `periodos` VALUES (1, '2026-1', '2026-01-07', '2026-06-30', 'ACTIVO');
INSERT INTO `periodos` VALUES (3, '2026-2', '2026-08-01', '2027-02-13', 'INACTIVO');

-- ----------------------------
-- Table structure for usuarios
-- ----------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cedula` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `apellido` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `activo` tinyint(1) NULL DEFAULT 1,
  `foto_perfil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `cedula`(`cedula` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of usuarios
-- ----------------------------
INSERT INTO `usuarios` VALUES (1, '12345678', 'Carlos', 'Dueño', 'dueno@tally.com', '{noop}1234', 'ADMINISTRADOR', NULL, 1, '/uploads/perfil/user_1_1769738394927.jpg', '2026-01-29 21:40:46');
INSERT INTO `usuarios` VALUES (2, '23456781', 'Ana', 'Admin', 'admin@tally.com', '{noop}1234', 'GERENTE', NULL, 1, NULL, '2026-01-26 23:49:50');
INSERT INTO `usuarios` VALUES (3, '34567812', 'Pedro', 'Seguridad', 'seguridad@tally.com', '{noop}1234', 'VERIFICADOR', NULL, 1, NULL, '2026-01-26 23:49:50');
INSERT INTO `usuarios` VALUES (8, '15471237', 'Jose', 'Perez', 'jose@gmail.com', '{noop}1234', 'ESTUDIANTE', NULL, 1, NULL, '2026-01-28 01:06:01');
INSERT INTO `usuarios` VALUES (9, '16022253', 'Ana', 'Rosa', 'ana@gmail.com', '{noop}1234', 'ESTUDIANTE', NULL, 1, NULL, '2026-01-28 01:06:27');
INSERT INTO `usuarios` VALUES (10, '31264284', 'Federico', 'Sanchez', 'Federico@gmail.com', '{noop}1234', 'ESTUDIANTE', NULL, 1, NULL, '2026-01-28 01:07:03');
INSERT INTO `usuarios` VALUES (11, '12398712', 'William', 'Jimenez', 'William@gmail.com', '{noop}123456', 'GERENTE', '04124423823', 0, NULL, '2026-01-28 01:17:44');
INSERT INTO `usuarios` VALUES (12, '31265708', 'Thor', 'Gonzalez', 'thor@gmail.com', '{noop}1234', 'ESTUDIANTE', '04124834441', 1, '/uploads/perfil/user_12_1769577671504.jpg', '2026-01-28 01:18:21');
INSERT INTO `usuarios` VALUES (14, '123123', 'hfghf', 'Torres', 'gfgfg@mail.com', '{noop}123456', 'GERENTE', '2131', 1, NULL, '2026-01-28 23:30:21');
INSERT INTO `usuarios` VALUES (15, '1212', 'Federico', 'Sanchez', '1212@gmail.com', '{noop}1234', 'ESTUDIANTE', NULL, 1, NULL, '2026-01-29 12:17:26');
INSERT INTO `usuarios` VALUES (16, 'fd', 'Federico', 'Perez', 'fd@gmail.com', '{noop}1234', 'ESTUDIANTE', NULL, 1, NULL, '2026-01-29 12:17:43');
INSERT INTO `usuarios` VALUES (18, '43432432', 'William', 'Torres', 'gfgffg@mail.com', '{noop}123456', 'VERIFICADOR', '', 0, NULL, '2026-01-29 21:27:37');

SET FOREIGN_KEY_CHECKS = 1;
