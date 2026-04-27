# Inventario de Equipos (Guia para principiantes)

Este sistema te permite:

- Registrar equipos (impresoras, escaneres, laptops, etc.).
- Importar equipos desde un archivo Excel.
- Exportar el inventario a Excel y PDF.
- Descargar una **plantilla Excel** con el formato correcto para importar.

---

## 1) Requisitos

Antes de empezar, instala:

- [Node.js](https://nodejs.org/) (recomendado version LTS).
- [XAMPP](https://www.apachefriends.org/) o cualquier servidor con **Apache + PHP + MySQL**.

Verifica que `npm` este disponible:

```bash
npm -v
```

---

## 2) Instalar dependencias del proyecto

En la carpeta del proyecto, ejecuta:

```bash
npm install
```

Esto descarga las librerias necesarias para Angular.

---

## 3) Configurar base de datos (MySQL)

1. Abre **phpMyAdmin**.
2. Importa el archivo `api/schema.sql`.
3. Eso crea la base de datos `inventario_equipos` y la tabla `equipos`.

> Importante: la conexion a BD esta en `api/db.php`.
> Si tu MySQL usa otro usuario/contrasena, cambialo ahi.

---

## 4) Levantar backend (PHP)

Debes tener la carpeta del proyecto dentro de tu servidor web local.

En este proyecto, la API se consume desde:

`http://localhost/inventario-app/api`

Si tu ruta es distinta, actualiza `apiBaseUrl` en `src/app/app.ts`.

---

## 5) Levantar frontend (Angular)

Ejecuta:

```bash
npm start
```

o

```bash
ng serve
```

Luego abre:

`http://localhost:4200/`

---

## 6) Usuarios de acceso

En la pantalla de login puedes usar:

- Admin: `admin / admin123`
- Admin: `soporte / soporte123`
- Usuario: `usuario1 / usuario123`

---

## 7) Como usar Excel (muy importante)

### Descargar plantilla

En la vista de inventario (admin), haz clic en:

**Descargar plantilla Excel**

Se descargara el archivo:

`plantilla-inventario-equipos.xlsx`

### Columnas esperadas para importar

Debes respetar estos encabezados:

- `Tipo`
- `Marca`
- `Modelo`
- `Serial`
- `Ubicacion`
- `Estado`
- `UsuarioEquipo` (opcional)
- `ContrasenaEquipo` (opcional)

### Valores recomendados

- `Tipo`: Impresora, Escaner, PC Todo en Uno, Laptop, PC de Mesa.
- `Estado`: Activo, En reparacion, Baja.

Si algun dato clave viene vacio o incorrecto, esa fila se omitira al importar.

---

## 8) Exportaciones

En inventario (admin) puedes:

- Exportar a Excel.
- Exportar a PDF.

---

## 9) Comandos utiles

- Iniciar proyecto: `npm start`
- Compilar: `npm run build`
- Pruebas: `npm test`

---

## 10) Problemas comunes

- **No conecta a MySQL**: revisa usuario, contrasena, nombre de BD en `api/db.php`.
- **No carga API**: revisa que Apache este iniciado y que la ruta `http://localhost/inventario-app/api` exista.
- **Falla importacion Excel**: verifica nombres de columnas y que no falten campos obligatorios.
