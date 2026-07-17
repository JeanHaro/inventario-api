# Inventario API 

API REST construida con **TypeScript + Express** para gestionar un sistema de inventario completo  
con productos, variantes, imágenes, reportes, notificaciones automáticas y un **asistente de IA con tool-calling** (Invy).

Proyecto de práctica de **Objetos y Tipos Personalizados en TypeScript**.  
Diseñada para conectarse al proyecto Angular **inventario-app**.

---

## Estructura del proyecto

```
src/
├── types/
│   ├── product.types.ts          ← Producto, Variante, Categoría, Estados, Reportes
│   ├── notification.types.ts     ← Notification, NotificationType, NotificationAction
│   └── chat.types.ts             ← ChatMessage, ChatContentBlock, ToolCall, ToolDefinition
├── data/
│   ├── products.json             ← Base de datos de productos (persiste en disco)
│   ├── notifications.json        ← Base de datos de notificaciones (persiste en disco)
│   └── db.ts                     ← Capa de lectura/escritura al JSON
├── utils/
│   ├── product.utils.ts          ← CRUD + consultas + helpers de triggers
│   ├── notification.utils.ts     ← CRUD + triggers automáticos
│   ├── report.utils.ts           ← Generación de estadísticas y reportes
│   ├── file.utils.ts             ← Helper para borrar archivos del disco
│   ├── ai-provider.utils.ts      ← Factory que elige el proveedor de IA por petición
│   ├── chat-tools.utils.ts       ← Definición de las tools + ejecución real contra la API
│   └── providers/
│       ├── openai.provider.ts    ← Implementación con la API de OpenAI
│       └── anthropic.provider.ts ← Implementación con la API de Anthropic (Claude)
├── uploads/                      ← Imágenes subidas (generado automáticamente)
└── api/
    ├── middlewares/
    │   └── upload.middleware.ts  ← Multer: single (variantes) y array (productos)
    ├── controllers/
    │   ├── products.controller.ts
    │   ├── reports.controller.ts
    │   ├── notifications.controller.ts
    │   └── chat.controller.ts    ← Orquesta el bucle de conversación + tool-calling
    ├── routes/
    │   ├── products.routes.ts
    │   ├── reports.routes.ts
    │   ├── notifications.routes.ts
    │   └── chat.routes.ts
    └── app.ts                    ← Servidor Express (puerto 3002)
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (nunca se sube a git — usa `.env.example` como plantilla):

```dotenv
PORT=3002

OPENAI_API_KEY=tu-clave-de-openai
ANTHROPIC_API_KEY=tu-clave-de-anthropic
```

Ambas claves pueden convivir activas al mismo tiempo — el proveedor a usar se decide **por cada petición** al endpoint `/chat` (ver más abajo), no de forma fija por variable de entorno.

---

## Cómo ejecutar

```bash
pnpm install
pnpm start
```

API disponible en: **http://localhost:3002**

---

## Conceptos TypeScript practicados

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
| Type guards / narrowing | Filtrado de `tool_calls` por tipo en `openai.provider.ts` |
| Discriminated unions | `ChatContentBlock` (`'text' \| 'image'`) |

---

## Middlewares

| Middleware | Función |
|---|---|
| `express.json({ limit: '10mb' })` | Parsea el body como JSON — límite ampliado para soportar imágenes en Base64 en el chat |
| `cors()` | Permite peticiones desde cualquier origen — habilita el consumo desde Angular u otros frontends |
| `upload.single('imagen')` | Multer — acepta un solo archivo por request (variantes) |
| `uploadMultiple` | Multer — acepta hasta 5 archivos por request (productos) |
| `express.static('/uploads')` | Sirve las imágenes públicamente desde `http://localhost:3002/uploads/` |

---

## Modelos de datos

### Valores válidos
```
Categorias:       electronica | tecnologia | ropa | calzado | alimentos | bebidas |
                  hogar | muebles | deportes | belleza | juguetes | libros |
                  vehiculos | herramientas | otros

EstadoProducto:   disponible | agotado | reservado | proximamente | descontinuado | pausado

EstadoVariante:   disponible | sin_stock | reservado | descontinuado

NotificationType: critical | warning | movements | confirmed | system
```

### Campos obligatorios

```
Producto:  nombre, marca, precio (> 0), categoria, estado
Variante:  nombre, sku (único, sin espacios), stock (>= 0), estado, precioAdicional (>= 0)
```

> El backend valida estos campos en el controller (no solo en el frontend) — cualquier cliente que golpee la API directamente (incluida la IA vía tool-calling) queda sujeto a las mismas reglas.

---

## Endpoints completos

### Base
```
GET  /                              → Estado de la API + lista de recursos
```

---

### Productos — `/products`

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
    "marca":     "Samsung",
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

> **Validaciones activas:** `precio` debe ser un número mayor a 0 (tanto al crear como al actualizar); `marca` no puede quedar vacía si se envía; ningún campo opcional se descarta en silencio por ser `0` o string vacío — se usa `!== undefined` para distinguir "no enviado" de "enviado como valor falsy".

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
    "nombre": "Negro 128GB",
    "sku":    "SAM-S24-NEG-128",
    "stock":  20,
    "estado": "disponible",
    "precioAdicional": 0,
    "color":  "Negro"
}
```

**POST variante — con imagen (form-data):**
```
Body → form-data
  nombre: Negro 128GB
  stock:  20
  estado: disponible
  color:  Negro
  sku:    SAM-S24-NEG-128
  precioAdicional: 0
  imagen: [archivo.jpg]   ← campo File (opcional)
```

**Lógica automática de estados en variantes:**
```
stock enviado = 0   → estado se fuerza a "sin_stock" automáticamente
stock sube desde 0  → estado cambia a "disponible" automáticamente (si no se envía estado explícito)
todas variantes = 0 → producto pasa a "agotado" automáticamente
alguna variante > 0 → producto vuelve a "disponible" automáticamente
```

> **Validaciones activas:** `stock` y `precioAdicional` no pueden ser negativos (create y update); `sku` se recorta de espacios y se valida único globalmente (no solo por producto) antes de guardar; `nombre` y `sku` no pueden quedar vacíos ni ser solo espacios.

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

### Chat con IA — `/chat`

Endpoint conversacional con **tool-calling** — el modelo puede consultar, crear, actualizar, archivar y desarchivar productos/variantes reales del inventario, además de razonar libremente sobre los datos que obtiene (cálculos, totales, comparaciones) sin necesitar una tool específica para cada pregunta posible.

```
POST /chat
```

**Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Busca el producto Xiaomi 14" }
  ],
  "provider": "openai"
}
```

- `provider` es opcional — `"openai"` por defecto. Acepta `"openai"` o `"anthropic"`.
- `content` puede ser un `string` simple, o un array de bloques para mensajes multimodales:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Crea una variante con esta imagen" },
        { "type": "image", "imageBase64": "data:image/jpeg;base64,..." }
      ]
    }
  ]
}
```

**Respuesta:**
```json
{ "role": "assistant", "content": "Encontré el producto Xiaomi 14..." }
```

> El bucle de conversación ejecuta hasta 5 vueltas de tool-calling por petición antes de forzar una respuesta final, como medida de seguridad ante loops.

> **Creación/actualización en lote:** no existe una tool especial de "batch" — si el usuario pide crear o actualizar varios productos/variantes en un mismo mensaje, el modelo puede emitir múltiples llamadas a la misma tool en un solo turno, y el backend las ejecuta todas.

#### Tools disponibles

**Lectura**
| Tool | Descripción |
|---|---|
| `consultar_productos` | Consulta con filtros opcionales (nombre, categoría, marca, etiqueta, estado). Sin filtros, devuelve todo el inventario — útil para que la IA calcule totales, promedios, etc. por su cuenta |
| `consultar_stock_bajo` | Variantes con stock bajo (umbral configurable, 10 por defecto) |
| `consultar_stock_agotado` | Variantes completamente sin stock (0 unidades) |
| `consultar_precio_final` | Precio con descuento aplicado, de un producto o de una variante específica |

**Creación**
| Tool | Descripción |
|---|---|
| `crear_producto` | Crea un producto, sin imágenes |
| `crear_producto_con_imagenes` | Crea un producto y le asocia imágenes adjuntas en el mensaje |
| `crear_variante` | Crea una variante, sin imagen |
| `crear_variante_con_imagen` | Crea una variante y le asocia una imagen adjunta en el mensaje |

**Actualización / Archivado** *(eliminar queda fuera de alcance intencionalmente)*
| Tool | Descripción |
|---|---|
| `actualizar_producto` | Actualiza cualquier campo de un producto existente |
| `archivar_producto` | Pasa un producto a estado `descontinuado` |
| `desarchivar_producto` | Reactiva un producto — resuelve a `disponible` o `agotado` según el stock real de sus variantes |
| `actualizar_variante` | Actualiza cualquier campo de una variante existente |
| `archivar_variante` | Pasa una variante a estado `descontinuado` |
| `desarchivar_variante` | Reactiva una variante — resuelve a `disponible` o `sin_stock` según su stock |
| `agregar_imagenes_producto` | Agrega imágenes a un producto **ya existente** (no lo crea) |
| `agregar_imagen_variante` | Sube o reemplaza la imagen de una variante **ya existente** (no la crea) |

#### Arquitectura de las tools

- Las tools de **lectura** llaman directamente a `product.utils.ts` — no hay validación que evitar en una consulta.
- Las tools de **escritura** (crear, actualizar, archivar) hacen un `fetch` interno hacia los propios endpoints HTTP de `/products` (`http://localhost:{PORT}`), en vez de llamar a `product.utils.ts` directamente — así se reutiliza automáticamente toda la validación del controller (SKU único, campos obligatorios, precio/stock no negativos) sin duplicar reglas de negocio en dos lugares.
- El archivado/desarchivado replica la misma lógica de resolución de estado que ya usa el frontend (revisando stock real antes de decidir a qué estado volver).

---

### Reportes — `/reports`

```
GET  /reports                           → Reporte general (todos los productos)
GET  /reports/stock-bajo                → Productos con al menos una variante < 10 unidades
GET  /reports/stock-bajo?umbral=5       → Stock bajo con umbral personalizado
GET  /reports/categoria/:categoria      → Reporte filtrado por categoría
GET  /reports/estado/:estado            → Reporte filtrado por estado
```

> Cada vez que se genera un reporte, se crea automáticamente una notificación de tipo `system`.

---

### Notificaciones — `/notifications`

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

## Mapa de triggers automáticos de notificaciones

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

## Códigos de respuesta HTTP

| Código | Significado |
|---|---|
| `200` | OK — operación exitosa |
| `201` | Created — recurso creado |
| `400` | Bad Request — datos inválidos o campos faltantes |
| `404` | Not Found — recurso no encontrado |
| `500` | Internal Server Error — incluye errores de la API de IA (ver logs del servidor) |

---

## Notas técnicas

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
- **SKU único y normalizado** — se recorta de espacios y se valida contra todas las variantes del inventario, no solo las del mismo producto
- **Selección de proveedor de IA por petición** — no hay un proveedor "fijo" en el servidor; cada llamada a `/chat` decide con qué modelo hablar, permitiendo comparar OpenAI y Anthropic sin reiniciar el servidor
- **Sin eliminación vía IA** — las tools del chat cubren lectura, creación, actualización y archivado, pero deliberadamente no incluyen eliminar productos/variantes, para evitar pérdida accidental de datos por una instrucción ambigua
- **En producción** reemplazar `multer.diskStorage` por `multer.memoryStorage` + S3/Cloudinary