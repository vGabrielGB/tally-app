# 📊 Tally App

> Sistema integral de gestión de estudiantes, pagos y auditoría para el entorno universitario.

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🎯 Sobre el Proyecto
**Tally** es una solución de software diseñada para optimizar y asegurar los procesos administrativos dentro de la universidad. El sistema centraliza la gestión de usuarios (Estudiantes, Administradores, Dueños), el registro de pagos, el manejo de divisas (Tasa BCV) y la generación de reportes, manteniendo un historial de auditoría estricto para garantizar la transparencia.

### 📸 Interfaz de Usuario
*(Aquí puedes ver cómo luce el sistema en acción)*

| Login | Panel Principal | Gestión de Pagos |
| :---: | :---: | :---: |
| <img src="assets/login.png" width="250"/> | <img src="assets/dashboard.png" width="250"/> | <img src="assets/pagos.png" width="250"/> |

## ✨ Características Principales
- **Arquitectura Basada en Roles:** Accesos y vistas dinámicas dependiendo del tipo de usuario (Dueño, Admin, Estudiante, Verificador).
- **Gestión Financiera:** Control de pagos, métodos de pago, comprobantes y conversión automatizada con la tasa BCV.
- **Auditoría y Seguridad:** Registro detallado de acciones (`AuditoriaController`) y autenticación robusta (`SecurityConfig`).
- **Generación de Reportes:** Exportación de datos e historiales para el control administrativo.

## 🛠️ Tecnologías Utilizadas
- **Backend:** Java, Spring Boot, Maven.
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
- **Base de Datos:** MySQL (Estructura relacional gestionada vía Spring Data JPA / Hibernate).

## 🚀 Instalación y Uso Local

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/vGabrielGB/tally-app.git](https://github.com/vGabrielGB/tally-app.git)