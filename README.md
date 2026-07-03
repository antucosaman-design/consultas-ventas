# Consultas · Cuadro de Ventas (Humboldt)

Visor de consultas sobre el cuadro de ventas 2022–2026.
El sistema **no calcula nada**: muestra los datos del Excel tal cual
y permite consultarlos (buscar RES, filtrar por fecha de depósito, año, canal).

## Estructura

```
index.html          página base
vite.config.js      configuración Vite
package.json        dependencias (React 18 + Vite + lucide-react)
src/main.jsx        arranque de React
src/App.jsx         la aplicación (panel de consultas + tabla)
src/datos.js        LOS DATOS del Excel (este es el que se reemplaza al actualizar)
```

## Cómo actualizar los datos

Cuando el Excel cambie, se regenera `src/datos.js` y se reemplaza ese
único archivo en GitHub (Ctrl+A → Supr → Ctrl+V → Commit).
Vercel re-despliega solo.

## Desplegar

1. GitHub → New repository → subir estos archivos
2. Vercel → Add New Project → importar el repo → Deploy
   (Vercel detecta Vite automáticamente, no hay que configurar nada)
