# 🏪 Inventario API — Proyecto 8

API REST construida con **TypeScript + Express** para gestionar un sistema de inventario completo  
con productos, variantes, imágenes, reportes y notificaciones automáticas.

Proyecto de práctica de la **Sección 5 — Objetos y Tipos Personalizados en TypeScript**.  
Diseñada para conectarse al proyecto Angular **inventario-app** (proyecto3).

---

## 📁 Estructura del proyecto

```
proyecto8/
├── types/
│   ├── product.types.ts          ← Producto, Variante, Categoría, Estados, Reportes
│   └── notification.types.ts     ← Notification, NotificationType, NotificationAction
├── data/
│   ├── products.json             ← Base de datos de productos (persiste en disco)
│   ├── notifications.json        ← Base de datos de notificaciones (persiste en disco)
│   └── db.ts                     ← Capa de lectura/escritura al JSON
├── utils/
│   ├── product.utils.ts          ← CRUD + consultas + helpers de triggers
│   ├── notification.utils.ts     ← CRUD + triggers automáticos
│   ├── report.utils.ts           ← Generación de estadísticas y reportes
│   └── file.utils.ts             ← Helper para borrar archivos del disco
├── uploads/                      ← Imágenes subidas (generado automáticamente)
└── api/
    ├── middlewares/
    │   └── upload.middleware.ts  ← Multer: single (variantes) y array (productos)
    ├── controllers/
    │   ├── products.controller.ts
    │   ├── reports.controller.ts
    │   └── notifications.controller.ts
    ├── routes/
    │   ├── products.routes.ts
    │   ├── reports.routes.ts
    │   └── notifications.routes.ts
    └── app.ts                    ← Servidor Express (puerto 3002)
```

---

## 🚀 Cómo ejecutar

Desde la raíz de `04-practica-claude`:

```bash
npx ts-node proyectos/proyecto8/api/app.ts
```

API disponible en: **http://localhost:3002**

---

## 🔑 Conceptos TypeScript practicados

| Concepto | Dónde se usa |
|---|---|
| `type` aliases e `interface` | `types/` |
| Union types de string literals | `Categoria`, `EstadoProducto`, `EstadoVariante`, `NotificationType` |
| Propiedades opcionales (`?`) | `imagen?`, `descuento?`, `skills?` |
| `Omit<T, K>` | Parámetros de create en utils |
| `Partial<T>` | Parámetros de update en utils |
| `Record<K, V>` | `productosPorCategoria` en stats |
| `Partial<Record<K, V>>` | Stats con categorías opcionales |
| Nullish coalescing (`??`) | Fallbacks de propiedades opcionales |
| Spread condicional | Whitelist de campos en PATCH |
| `reduce` | Cálculo de stats y acumuladores |
| `some` / `every` | Detección de stock bajo/agotado |

---

## ⚙️ Middlewares

| Middleware | Función |
|---|---|
| `express.json()` | Parsea el body de las peticiones como JSON |
| `cors()` | Permite peticiones desde cualquier origen — habilita el consumo desde Angular u otros frontends |
| `upload.single('imagen')` | Multer — acepta un solo archivo por request (variantes) |
| `uploadMultiple` | Multer — acepta hasta 5 archivos por request (productos) |
| `express.static('/uploads')` | Sirve las imágenes públicamente desde `http://localhost:3002/uploads/` |

---

## 🗄️ Modelos de datos

### Valores válidos
```
Categorias:       electronica | tecnologia | ropa | calzado | alimentos | bebidas |
                  hogar | muebles | deportes | belleza | juguetes | libros |
                  vehiculos | herramientas | otros

EstadoProducto:   disponible | agotado | reservado | proximamente | descontinuado | pausado

EstadoVariante:   disponible | sin_stock | reservado | descontinuado

NotificationType: critical | warning | movements | confirmed | system
```

---

## 📡 Endpoints completos

### Base
```
GET  /                              → Estado de la API + lista de recursos
```

---

### 🛍️ Productos — `/products`

#### Consultas con filtros
```
GET  /products                              → Todos los productos
GET  /products?categoria=tecnologia         → Filtrar por categoría exacta
GET  /products?estado=disponible            → Filtrar por estado
GET  /products?marca=xiaomi                 → Filtrar por marca (búsqueda parcial)
GET  /products?etiqueta=nue                 → Filtrar por etiqueta (búsqueda parcial)
GET  /products?searchNombre=lavadora        → Buscar por nombre (parcial)
GET  /products?searchCategoria=tecno        → Buscar por categoría (parcial)
GET  /products/:id                          → Producto por id
GET  /products/:id/precio                   → Precio base + descuento + precio final
GET  /products/:id/precio?varianteId=2      → Precio final incluyendo precio adicional de variante
GET  /products/:id/variantes_agotadas       → Variantes con stock = 0
GET  /products/:id/variantes_bajas          → Variantes con stock < 10
```

#### CRUD Productos
```
POST   /products                    → Crear producto (sin variantes — se agregan por separado)
PATCH  /products/:id                → Actualizar producto (parcial, con whitelist)
DELETE /products/:id                → Eliminar producto
```

**POST body obligatorio:**
```json
{
    "nombre":    "Samsung Galaxy S24",
    "precio":    950,
    "categoria": "tecnologia",
    "estado":    "disponible"
}
```

**POST body completo:**
```json
{
    "nombre":      "Samsung Galaxy S24",
    "descripcion": "Smartphone flagship con IA integrada",
    "marca":       "Samsung",
    "modelo":      "S24",
    "precio":      950,
    "descuento":   5,
    "categoria":   "tecnologia",
    "estado":      "disponible",
    "etiquetas":   ["nuevo", "destacado"]
}
```

**PATCH — solo los campos que cambien:**
```json
{ "precio": 899, "descuento": 10 }
{ "estado": "descontinuado" }
{ "etiquetas": ["oferta", "liquidacion"] }
```

---

#### CRUD Variantes
```
POST   /products/:id/variantes                      → Crear variante (imagen opcional)
PATCH  /products/:id/variantes/:varianteId          → Actualizar variante (parcial, con whitelist)
DELETE /products/:id/variantes/:varianteId          → Eliminar variante
```

**POST variante — sin imagen (JSON o form-data):**
```json
{
    "stock":  20,
    "estado": "disponible",
    "color":  "Negro",
    "sku":    "SAM-S24-NEG-128"
}
```

**POST variante — con imagen (form-data):**
```
Body → form-data
  stock:  20
  estado: disponible
  color:  Negro
  sku:    SAM-S24-NEG-128
  imagen: [archivo.jpg]   ← campo File (opcional)
```

**Lógica automática de estados en variantes:**
```
stock enviado = 0   → estado se fuerza a "sin_stock" automáticamente
stock sube desde 0  → estado cambia a "disponible" automáticamente (si no se envía estado explícito)
todas variantes = 0 → producto pasa a "agotado" automáticamente
alguna variante > 0 → producto vuelve a "disponible" automáticamente
```

---

#### Imágenes de productos
```
POST   /products/:id/imagenes               → Subir 1 a 5 imágenes (máximo 10 en total por producto)
DELETE /products/:id/imagenes?url=...       → Eliminar imagen específica del producto + borra archivo del disco
```

**POST imágenes — form-data (NO poner Content-Type manualmente):**
```
Body → form-data
  imagenes: [imagen1.jpg]   ← campo File (se pueden agregar varias filas con el mismo key)
  imagenes: [imagen2.png]
  imagenes: [imagen3.webp]
```

**DELETE imagen de producto:**
```
DELETE http://localhost:3002/products/1/imagenes?url=http://localhost:3002/uploads/foto.jpg
```

---

#### Imágenes de variantes
```
POST   /products/:id/variantes/:varianteId/imagen   → Subir o reemplazar imagen de variante
DELETE /products/:id/variantes/:varianteId/imagen   → Eliminar imagen de variante
```

> Al reemplazar la imagen de una variante, el archivo anterior se borra automáticamente del disco.  
> Al eliminar una imagen, el archivo también se borra del disco.

**Formatos aceptados:** jpg, jpeg, png, webp, gif  
**Tamaño máximo:** 5MB por imagen  
**Máximo imágenes por producto:** 10 en total  
**Máximo por request:** 5 imágenes

Las imágenes se sirven estáticamente en:
```
GET http://localhost:3002/uploads/[nombre-del-archivo]
```

---

### 📊 Reportes — `/reports`

```
GET  /reports                           → Reporte general (todos los productos)
GET  /reports/stock-bajo                → Productos con al menos una variante < 10 unidades
GET  /reports/stock-bajo?umbral=5       → Stock bajo con umbral personalizado
GET  /reports/categoria/:categoria      → Reporte filtrado por categoría
GET  /reports/estado/:estado            → Reporte filtrado por estado
```

> Cada vez que se genera un reporte, se crea automáticamente una notificación de tipo `system`.

---

### 🔔 Notificaciones — `/notifications`

```
GET    /notifications                           → Todas las notificaciones
GET    /notifications?unread=true               → Solo no leídas
GET    /notifications?type=critical             → Por tipo
GET    /notifications?type=warning&unread=true  → Por tipo y no leídas (combinados)
GET    /notifications/count                     → Total de no leídas
GET    /notifications/count?type=critical       → No leídas de un tipo específico
GET    /notifications/:id                       → Notificación por id

POST   /notifications                           → Crear notificación (uso interno/admin)
PATCH  /notifications/read-all                  → Marcar todas como leídas
PATCH  /notifications/:id/read                  → Marcar una como leída
DELETE /notifications/:id                       → Eliminar notificación
```

---

## 🔔 Mapa de triggers automáticos de notificaciones

| Acción | Tipo notificación |
|---|---|
| `POST /products` | `movements` — producto creado |
| `DELETE /products/:id` | `movements` — producto eliminado |
| `PATCH /products/:id` → estado `disponible` | `confirmed` — producto activado |
| `PATCH /products/:id` → estado `descontinuado` | `confirmed` — producto descontinuado |
| `PATCH /products/:id/variantes/:id` → stock = 0 | `critical` — stock agotado |
| `PATCH /products/:id/variantes/:id` → stock < 10 y bajando | `warning` — stock bajo |
| `PATCH /products/:id/variantes/:id` → stock sube | `movements` — recepción de mercancía |
| `POST /products/:id/variantes` | `movements` — variante agregada |
| `POST /products/:id/variantes` → stock < 10 | `warning` — stock bajo en variante nueva |
| `GET /reports/*` | `system` — reporte generado |

---

## ⚠️ Códigos de respuesta HTTP

| Código | Significado |
|---|---|
| `200` | OK — operación exitosa |
| `201` | Created — recurso creado |
| `400` | Bad Request — datos inválidos o campos faltantes |
| `404` | Not Found — recurso no encontrado |

---

## 📝 Notas técnicas

- **Persistencia en disco** — `products.json` y `notifications.json` sobreviven al reinicio
- **CORS habilitado** — acepta peticiones desde cualquier origen (`cors()` sin restricciones)
- **IDs sin colisión** — generados con `Math.max` sobre ids existentes
- **Whitelist en PATCH** — solo campos del tipo correspondiente son actualizables
- **Estado automático de variante** — stock 0 → `sin_stock`, stock > 0 desde 0 → `disponible`
- **Estado automático de producto** — todas variantes en 0 → `agotado`, alguna con stock → `disponible`
- **Etiquetas sanitizadas** — al crear o actualizar un producto, las etiquetas se limpian automáticamente: se eliminan duplicados, espacios en blanco y strings vacíos
- **Búsqueda por etiqueta parcial** — `?etiqueta=nue` encuentra productos con etiquetas que contengan "nue" (ej: "nuevo", "nueva-temporada")
- **Limpieza de archivos** — al eliminar o reemplazar imágenes, el archivo físico se borra del disco
- **Orden de rutas** — rutas específicas siempre antes de `/:id`
- **En producción** reemplazar `multer.diskStorage` por `multer.memoryStorage` + S3/Cloudinary