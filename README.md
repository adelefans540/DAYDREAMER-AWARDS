# 🏆 Daydreamers Awards Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-11.6.1-orange.svg)](https://firebase.google.com/)
[![HTML5/CSS3/JS](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20(ES6+)-blue.svg)](#)

**Daydreamers Awards** es una plataforma web interactiva diseñada por y para la comunidad global de fans de Adele. Su propósito es reconocer y premiar la creatividad, dedicación y pasión de los creadores de contenido, administradores de fanpages, editores y miembros activos del fandom.

---

## 🌟 Características Principales

- 🎨 **Diseño Moderno y Adaptativo:**
  - Estilo visual de tarjeta de vidrio (*Glassmorphism*) elegante.
  - Soporte para **Modo Claro (Light Theme)** y **Modo Oscuro (Dark Theme)**.
  - Diseño 100% responsivo apto para móviles, tabletas y computadoras de escritorio.

- 🌐 **Soporte Multilingüe (i18n):**
  - Cambio de idioma dinámico e instantáneo entre **Inglés** y **Español** sin recargar la página.

- 🗳️ **Sistema de Votaciones y Nominados:**
  - Lectura en tiempo real de nominados y recuento de votos a través de **Firebase Firestore**.
  - Autenticación anónima para seguimiento seguro de usuarios y visitas.
  - Generación de tarjetas compartibles de votos en redes sociales con `html2canvas`.

- 📢 **Sección de Noticias y Anuncios:**
  - Carrusel y paneles interactivos para mostrar las últimas actualizaciones y fechas clave.

- 🔑 **Panel de Administración (Control de Contenido):**
  - Gestión centralizada con protección por contraseña/login de Firebase.
  - Edición e inserción de **texto en marquesina (*Scrolling Text*)**, **noticias** y **colaboradores**.
  - Integración directa con **ImgBB API** para la subida e incrustación de imágenes alojadas en la nube.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - HTML5 Semántico
  - CSS3 (Variables CSS, Flexbox, CSS Grid, Glassmorphism & Animaciones)
  - JavaScript Vanilla (ES6 Modules)
- **Servicios Backend & BaaS:**
  - **Firebase Auth:** Autenticación anónima y basada en correo/contraseña.
  - **Firebase Firestore:** Base de datos NoSQL en tiempo real para noticias, estadísticas, votos y colaboradores.
- **Librerías Externas & APIs:**
  - [FontAwesome 6.4.0](https://fontawesome.com/) — Iconografía.
  - [html2canvas](https://html2canvas.hertzen.com/) — Renderizado de tarjetas de votación en imagen.
  - [ImgBB API](https://api.imgbb.com/) — Hosting y subida de imágenes de noticias y colaboradores.

---

## 📂 Estructura del Proyecto

```text
.
├── index.html            # Página principal (Noticias, Manifiesto, Categorías, Colaboradores y Admin)
├── votaciones.html       # Interfaz principal de votaciones, resultados y generación de tarjetas
├── icono.adele.jpeg      # Logotipo principal de la aplicación
├── premio-award.jpeg     # Imagen representativa del galardón
└── README.md             # Documentación del proyecto
