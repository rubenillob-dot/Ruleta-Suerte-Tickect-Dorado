# 💜 Ruleta de la Suerte - ImArixu Edition 🚀

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Twitch API](https://img.shields.io/badge/Twitch_API-9146FF?style=for-the-badge&logo=twitch&logoColor=white)

Una aplicación web interactiva de estilo *Dark Mode* desarrollada en Vanilla JS, diseñada específicamente para dinamizar los sorteos en los directos de Twitch. Cuenta con un diseño personalizado, animaciones fluidas y conexión directa a la API de Twitch.

---

## ✨ Características Principales

*   📝 **Entrada Manual Inteligente:** Un área de texto que formatea automáticamente cualquier lista de nombres pegada (separada por comas, espacios, saltos de línea, etc.) gracias a un parseo mediante Regex.
*   🟣 **Integración con Twitch:** Botones dedicados para cargar automáticamente la lista de **Suscriptores** y **Seguidores** del canal consumiendo la API de Twitch.
*   🎫 **Sistema de Tickets VIP:** Cuando la ruleta se detiene, el ganador aparece en un modal hiperrealista con forma de ticket de sorteo, que incluye un número de serie secuencial autogenerado (`#001`, `#002`, etc.) bajo el sello **"ImArixu Live Prize"**.
*   ⚙️ **Control de Emisión:** 
    *   Mini-menú flotante para ajustar la velocidad de giro en tiempo real (de `x0.25` a `x3.0`).
    *   Botón de "Reset Contador" para reiniciar los números de los tickets a cero en cualquier momento del directo.
    *   Opción para eliminar al ganador actual de la lista y seguir tirando.
*   🎨 **Estética Anti-Fatiga:** Paleta de colores optimizada con el branding del canal (Morado, Cyan, Oscuro) en tonos pastel para evitar la fatiga visual durante usos prolongados en pantalla.

---

## 🛠️ Instalación y Configuración

Al estar desarrollado en Vanilla JavaScript, el proyecto no requiere de instalaciones complejas ni frameworks. 

1. **Clonar el repositorio** o descargar los archivos.
2. **Configurar las Credenciales de Twitch:**
   Abre el archivo `app.js` e introduce tus credenciales de la consola de desarrolladores de Twitch en las constantes superiores:
```javascript
   const TWITCH_CLIENT_ID = 'TU_CLIENT_ID_AQUI';
   const TWITCH_ACCESS_TOKEN = 'TU_ACCESS_TOKEN_AQUI';
