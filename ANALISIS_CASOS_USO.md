# Análisis de Casos de Uso - MoneyTalk Finance App

## 1. CASOS DE USO DETALLADOS

### CU-01: Gestión de Autenticación

**Actores:** Usuario

**Descripción:** Permite al usuario registrarse, iniciar sesión y cerrar sesión en la aplicación.

**Precondiciones:**
- La aplicación debe estar accesible
- Para login: El usuario debe tener una cuenta registrada
- Para registro: El email no debe estar registrado

**Flujo Principal (Login):**
1. Usuario accede a la página de login
2. Usuario ingresa email y contraseña
3. Sistema valida las credenciales
4. Sistema genera token JWT
5. Sistema almacena token y datos de usuario
6. Sistema redirige al dashboard

**Flujo Alternativo (Registro):**
1. Usuario accede a la página de registro
2. Usuario ingresa email, contraseña y nombre
3. Sistema valida que el email no exista
4. Sistema crea cuenta con contraseña hasheada
5. Sistema genera token JWT
6. Sistema almacena token y datos de usuario
7. Sistema redirige al dashboard

**Flujo Alternativo (Logout):**
1. Usuario hace clic en cerrar sesión
2. Sistema limpia token y datos de usuario
3. Sistema redirige a página de login

**Postcondiciones:**
- Usuario autenticado con token válido almacenado
- Acceso a funcionalidades protegidas habilitado

**Excepciones:**
- E1: Credenciales incorrectas - Mostrar mensaje de error
- E2: Email ya existe - Mostrar mensaje de error
- E3: Error de red - Mostrar mensaje y mantener datos

---

### CU-02: Gestionar Transacciones

**Actores:** Usuario

**Descripción:** Crear, editar, eliminar, buscar y visualizar transacciones financieras (ingresos y gastos).

**Precondiciones:**
- Usuario debe estar autenticado
- Para editar/eliminar: La transacción debe existir y pertenecer al usuario

**Flujo Principal (Ver Transacciones):**
1. Usuario accede a la página de transacciones
2. Sistema carga lista de transacciones del usuario
3. Sistema muestra transacciones paginadas (10 por página)
4. Sistema muestra filtros disponibles

**Flujo Alternativo (Crear):**
1. Usuario hace clic en "Nueva Transacción"
2. Sistema muestra formulario
3. Usuario completa: monto, descripción, categoría, tipo, fecha
4. Usuario envía formulario
5. Sistema valida datos
6. Sistema crea transacción temporal en UI
7. Sistema envía petición al backend
8. Sistema actualiza con ID real
9. Sistema muestra mensaje de éxito
10. Sistema redirige a lista de transacciones

**Flujo Alternativo (Editar):**
1. Usuario hace clic en icono de editar
2. Sistema carga datos de la transacción
3. Usuario modifica campos
4. Usuario guarda cambios
5. Sistema actualiza en UI
6. Sistema envía cambios al backend
7. Sistema muestra mensaje de éxito

**Flujo Alternativo (Eliminar):**
1. Usuario hace clic en icono de eliminar
2. Sistema muestra confirmación
3. Usuario confirma eliminación
4. Sistema elimina de UI
5. Sistema envía petición al backend
6. Sistema muestra mensaje de éxito

**Flujo Alternativo (Filtrar):**
1. Usuario selecciona filtros (tipo, categoría, rango de fechas)
2. Sistema aplica filtros en cliente
3. Sistema muestra resultados filtrados

**Flujo Alternativo (Paginar):**
1. Usuario hace clic en siguiente/anterior
2. Sistema carga página solicitada
3. Sistema muestra transacciones de esa página

**Postcondiciones:**
- Transacciones creadas/actualizadas/eliminadas correctamente
- Lista de transacciones actualizada
- Datos sincronizados con backend

**Excepciones:**
- E1: Validación fallida - Mostrar errores en formulario
- E2: Error de red - Si offline, guardar en outbox
- E3: Error del servidor - Revertir cambio UI y mostrar error
- E4: Sin transacciones - Mostrar mensaje y botón de crear

---

### CU-03: Crear Transacción con Voz

**Actores:** Usuario, Sistema de Reconocimiento de Voz (Web Speech API)

**Descripción:** Permite al usuario crear transacciones usando comandos de voz mediante la Web Speech API.

**Precondiciones:**
- Usuario autenticado
- Navegador compatible con Web Speech API
- Permisos de micrófono concedidos
- Usuario en página de nueva transacción

**Flujo Principal:**
1. Usuario accede a nueva transacción
2. Usuario hace clic en botón de micrófono
3. Sistema solicita permiso de micrófono (si no está concedido)
4. Sistema inicia reconocimiento de voz
5. Sistema indica que está escuchando
6. Usuario habla comando (ej: "Gasto de 50 bolivianos en comida")
7. Sistema recibe transcripción
8. Sistema parsea comando para extraer:
   - Tipo (ingreso/gasto)
   - Monto
   - Descripción/categoría
9. Sistema pre-llena campos del formulario
10. Sistema muestra campos al usuario
11. Usuario revisa y ajusta si es necesario
12. Usuario confirma y guarda
13. Sistema crea transacción (ver CU-02)

**Flujo Alternativo (Ajuste Manual):**
- 11a. Usuario modifica campos pre-llenados
- 11b. Usuario continúa con guardado normal

**Flujo Alternativo (Error de Reconocimiento):**
- 7a. Sistema no reconoce comando
- 7b. Sistema muestra error
- 7c. Usuario puede intentar nuevamente o ingresar manualmente

**Postcondiciones:**
- Transacción creada con datos de comando de voz
- Formulario limpio para nueva transacción

**Excepciones:**
- E1: Permiso denegado - Mostrar mensaje y deshabilitar función
- E2: API no soportada - Ocultar botón de voz
- E3: Sin reconocimiento - Permitir input manual
- E4: Formato inválido - Mostrar campos vacíos para completar

---

### CU-04: Gestionar Presupuestos

**Actores:** Usuario

**Descripción:** Crear, editar, eliminar y monitorear presupuestos y metas de ahorro, así como agregar dinero a presupuestos activos.

**Precondiciones:**
- Usuario autenticado
- Para editar/eliminar: Presupuesto debe existir y pertenecer al usuario

**Flujo Principal (Ver Presupuestos):**
1. Usuario accede a página de presupuestos
2. Sistema carga presupuestos del usuario
3. Sistema calcula y muestra:
   - Total de presupuestos
   - Asignación mensual total
   - Presupuestos activos
4. Sistema muestra lista de presupuestos con progreso

**Flujo Alternativo (Crear):**
1. Usuario hace clic en "Nuevo Presupuesto"
2. Sistema muestra formulario
3. Usuario completa:
   - Nombre
   - Tipo (ahorro, compra, emergencia, vacaciones, otro)
   - Monto objetivo
   - Fecha objetivo (opcional)
   - Descripción (opcional)
4. Usuario envía formulario
5. Sistema valida datos
6. Sistema crea presupuesto con currentAmount = 0
7. Sistema envía al backend
8. Sistema agrega a lista
9. Sistema muestra mensaje de éxito

**Flujo Alternativo (Editar):**
1. Usuario hace clic en editar presupuesto
2. Sistema carga datos en formulario
3. Usuario modifica campos
4. Usuario guarda cambios
5. Sistema valida y actualiza
6. Sistema sincroniza con backend
7. Sistema muestra mensaje de éxito

**Flujo Alternativo (Eliminar):**
1. Usuario hace clic en eliminar
2. Sistema muestra confirmación
3. Usuario confirma
4. Sistema elimina de lista
5. Sistema envía eliminación al backend
6. Sistema recalcula totales
7. Sistema muestra mensaje de éxito

**Flujo Alternativo (Agregar Dinero):**
1. Usuario hace clic en "Agregar Dinero" en presupuesto activo
2. Sistema muestra input de monto
3. Usuario ingresa cantidad
4. Usuario confirma
5. Sistema actualiza currentAmount en UI
6. Sistema envía al backend
7. Sistema recalcula progreso
8. Si currentAmount >= targetAmount:
   - Sistema cambia status a COMPLETED
9. Sistema muestra mensaje de éxito

**Postcondiciones:**
- Presupuestos creados/actualizados/eliminados
- Progreso calculado correctamente
- Totales y métricas actualizadas

**Excepciones:**
- E1: Validación fallida - Mostrar errores
- E2: Monto inválido - Mostrar error
- E3: Error de red - Mostrar mensaje
- E4: Sin presupuestos - Mostrar mensaje y botón crear

---

### CU-05: Gestionar Pagos Recurrentes

**Actores:** Usuario

**Descripción:** Administrar suscripciones y pagos automáticos recurrentes con diferentes frecuencias.

**Precondiciones:**
- Usuario autenticado
- Categorías de gasto disponibles
- Para editar/eliminar: Pago debe existir y pertenecer al usuario

**Flujo Principal (Ver Pagos Recurrentes):**
1. Usuario accede a página de pagos recurrentes
2. Sistema carga pagos del usuario
3. Sistema calcula y muestra:
   - Total de pagos
   - Gasto mensual equivalente
   - Pagos activos
4. Sistema muestra lista con próximas fechas

**Flujo Alternativo (Crear):**
1. Usuario hace clic en "Nuevo Pago Recurrente"
2. Sistema muestra formulario
3. Usuario completa:
   - Nombre
   - Categoría
   - Monto
   - Frecuencia (diaria, semanal, mensual, anual)
   - Próxima fecha de pago
   - Descripción (opcional)
4. Usuario envía formulario
5. Sistema valida datos
6. Sistema crea pago con status ACTIVE
7. Sistema envía al backend
8. Sistema agrega a lista
9. Sistema recalcula gasto mensual
10. Sistema muestra mensaje de éxito

**Flujo Alternativo (Editar):**
1. Usuario hace clic en editar pago
2. Sistema carga datos en formulario
3. Usuario modifica campos
4. Usuario guarda cambios
5. Sistema valida y actualiza
6. Sistema recalcula próxima fecha si cambió frecuencia
7. Sistema sincroniza con backend
8. Sistema muestra mensaje de éxito

**Flujo Alternativo (Eliminar):**
1. Usuario hace clic en eliminar
2. Sistema muestra confirmación
3. Usuario confirma
4. Sistema elimina de lista
5. Sistema envía eliminación al backend
6. Sistema recalcula totales
7. Sistema muestra mensaje de éxito

**Postcondiciones:**
- Pagos recurrentes gestionados correctamente
- Gasto mensual calculado
- Próximas fechas actualizadas

**Excepciones:**
- E1: Validación fallida - Mostrar errores
- E2: Fecha inválida - Mostrar error
- E3: Error al cargar categorías - Mostrar error
- E4: Sin pagos - Mostrar mensaje y botón crear

---

### CU-06: Visualizar Dashboard

**Actores:** Usuario

**Descripción:** Ver resumen financiero del día, gráficos semanales, balance disponible y recomendaciones de IA.

**Precondiciones:**
- Usuario autenticado

**Flujo Principal:**
1. Usuario accede al dashboard
2. Sistema inicia carga de datos en paralelo:
   - Transacciones
   - Presupuestos
   - Pagos recurrentes
   - Recomendaciones IA
3. Sistema calcula resumen del día:
   - Ingresos de hoy
   - Gastos de hoy
   - Balance neto
4. Sistema calcula balance disponible:
   - Ingresos - Gastos - Asignaciones presupuesto - Pagos recurrentes
5. Sistema genera datos de gráfico semanal (últimos 7 días)
6. Sistema muestra tarjetas de resumen con iconos
7. Sistema muestra tarjetas de presupuestos y pagos (si existen)
8. Sistema renderiza gráfico de línea (ingresos vs gastos)
9. Sistema muestra recomendaciones de IA
10. Sistema muestra últimas 5 transacciones

**Flujo Alternativo (Sin Datos):**
- Si no hay transacciones: Mostrar mensaje y botón "Agregar Transacción"
- Si no hay presupuestos: No mostrar sección
- Si no hay recomendaciones: Mostrar placeholder

**Flujo Alternativo (Actualización):**
- Usuario regresa al dashboard
- Sistema recarga datos automáticamente

**Postcondiciones:**
- Dashboard actualizado con datos recientes
- Métricas calculadas correctamente
- Visualizaciones renderizadas

**Excepciones:**
- E1: Error al cargar datos - Mostrar error específico
- E2: Token expirado - Redirigir a login
- E3: Sin conexión - Mostrar datos cacheados

---

### CU-07: Generar Reportes

**Actores:** Usuario

**Descripción:** Visualizar gráficos y análisis de patrones financieros por diferentes períodos con múltiples visualizaciones.

**Precondiciones:**
- Usuario autenticado
- Al menos una transacción existente

**Flujo Principal:**
1. Usuario accede a página de reportes
2. Sistema carga todas las transacciones
3. Sistema aplica filtro por defecto (mes actual)
4. Sistema calcula métricas:
   - Total de ingresos
   - Total de gastos
   - Balance neto
5. Sistema agrupa gastos por categoría
6. Sistema genera datos mensuales
7. Sistema renderiza gráfico circular (distribución por categoría)
8. Sistema renderiza gráfico de barras (ingresos vs gastos)
9. Sistema muestra top 5 categorías con barras de progreso

**Flujo Alternativo (Cambiar Rango):**
1. Usuario selecciona rango predefinido:
   - Últimos 7 días
   - Últimos 30 días
   - Este mes
   - Mes anterior
   - Este año
2. Sistema filtra transacciones por rango
3. Sistema recalcula todas las métricas
4. Sistema actualiza gráficos
5. Sistema actualiza categorías principales

**Flujo Alternativo (Rango Personalizado):**
1. Usuario selecciona "Personalizado"
2. Sistema muestra inputs de fecha
3. Usuario selecciona fecha desde y hasta
4. Sistema filtra transacciones
5. Sistema recalcula métricas
6. Sistema actualiza visualizaciones

**Flujo Alternativo (Actualizar Datos):**
1. Usuario hace clic en "Actualizar Datos"
2. Sistema muestra animación de carga
3. Sistema recarga transacciones del backend
4. Sistema recalcula todo
5. Sistema actualiza visualizaciones
6. Sistema muestra mensaje de éxito

**Postcondiciones:**
- Reportes generados con datos correctos
- Gráficos renderizados apropiadamente
- Métricas calculadas para el período seleccionado

**Excepciones:**
- E1: Sin transacciones en rango - Mostrar mensaje
- E2: Error al cargar - Mostrar error
- E3: Rango inválido - Mostrar error de validación

---

### CU-08: Obtener Recomendaciones IA

**Actores:** Usuario, Sistema de IA

**Descripción:** Recibir recomendaciones inteligentes basadas en análisis de patrones de gasto del usuario.

**Precondiciones:**
- Usuario autenticado
- Usuario tiene historial de transacciones

**Flujo Principal:**
1. Usuario visualiza dashboard (ver CU-06)
2. Sistema verifica cache de recomendaciones
3. Si cache es válido (< 15 minutos):
   - Sistema muestra recomendaciones cacheadas
4. Si cache expiró o está vacío:
   - Sistema solicita recomendaciones al backend
   - Backend analiza patrones del usuario:
     - Categorías con mayor gasto
     - Tendencias de gasto
     - Comparación con presupuestos
     - Oportunidades de ahorro
   - Backend genera recomendaciones con:
     - Título
     - Descripción
     - Tipo (warning, success, info)
     - Prioridad
   - Sistema recibe recomendaciones
   - Sistema almacena en cache
5. Sistema renderiza recomendaciones con:
   - Icono según tipo
   - Color según tipo
   - Título en negrita
   - Descripción
6. Sistema ordena por prioridad

**Flujo Alternativo (Sin Historial):**
- Si usuario es nuevo sin transacciones
- Sistema muestra recomendaciones genéricas

**Flujo Alternativo (Error):**
- Si backend falla
- Sistema muestra última cache disponible
- O muestra mensaje de error suave

**Postcondiciones:**
- Recomendaciones mostradas al usuario
- Cache actualizado con tiempo de expiración
- Usuario informado sobre patrones de gasto

**Excepciones:**
- E1: Error del servicio IA - Mostrar última cache o mensaje
- E2: Sin datos suficientes - Mostrar mensaje informativo
- E3: Cache corrupto - Limpiar y solicitar nuevas

---

### CU-09: Exportar Datos

**Actores:** Usuario

**Descripción:** Exportar transacciones filtradas a formato CSV para análisis externo.

**Precondiciones:**
- Usuario autenticado
- Al menos una transacción existe

**Flujo Principal:**
1. Usuario está en página de transacciones
2. Usuario aplica filtros opcionales:
   - Búsqueda por descripción
   - Tipo (ingreso/gasto)
   - Categoría
   - Rango de fechas
3. Sistema filtra transacciones
4. Usuario hace clic en "Exportar"
5. Sistema crea array de headers CSV:
   - Fecha, Descripción, Categoría, Tipo, Monto
6. Sistema convierte transacciones filtradas a filas CSV:
   - Escapa comillas en descripciones
   - Formatea fechas
   - Traduce tipos
7. Sistema crea contenido CSV completo
8. Sistema crea Blob con tipo "text/csv"
9. Sistema genera URL temporal del Blob
10. Sistema crea elemento <a> con:
    - href = URL del Blob
    - download = "transacciones-YYYY-MM-DD.csv"
11. Sistema dispara clic automático
12. Navegador descarga archivo
13. Sistema limpia URL temporal

**Flujo Alternativo (Sin Filtros):**
- Usuario exporta sin aplicar filtros
- Sistema exporta todas las transacciones

**Flujo Alternativo (Lista Vacía):**
- Si no hay transacciones para exportar
- Sistema muestra mensaje de advertencia
- Sistema no genera archivo

**Postcondiciones:**
- Archivo CSV descargado al dispositivo del usuario
- Archivo contiene transacciones filtradas
- URL temporal limpiada

**Excepciones:**
- E1: Sin transacciones - Mostrar mensaje, no exportar
- E2: Error al generar Blob - Mostrar error
- E3: Navegador no soporta download - Mostrar error

---

### CU-10: Actualizar Perfil

**Actores:** Usuario

**Descripción:** Modificar información personal del usuario (nombre y email).

**Precondiciones:**
- Usuario autenticado

**Flujo Principal:**
1. Usuario accede a página de perfil
2. Sistema muestra datos actuales del usuario:
   - Email
   - Nombre
3. Usuario modifica campos deseados
4. Usuario hace clic en "Guardar Cambios"
5. Sistema valida datos:
   - Email en formato válido
   - Nombre no vacío
6. Sistema envía actualización al backend
7. Backend valida que email no esté en uso (si cambió)
8. Backend actualiza información
9. Sistema actualiza datos en store local
10. Sistema actualiza UI con nuevos datos
11. Sistema muestra mensaje de éxito

**Flujo Alternativo (Solo Nombre):**
- Usuario solo cambia nombre
- Sistema actualiza sin validar email único

**Flujo Alternativo (Solo Email):**
- Usuario solo cambia email
- Sistema valida que email no exista
- Sistema actualiza

**Postcondiciones:**
- Información de usuario actualizada en backend
- Store local sincronizado
- UI muestra datos actualizados

**Excepciones:**
- E1: Email ya existe - Mostrar error, mantener datos
- E2: Validación fallida - Mostrar errores en campos
- E3: Error de red - Mostrar error, mantener cambios en UI
- E4: Token expirado - Redirigir a login

---

## 2. DIAGRAMAS DE CASO DE USO

### Diagrama General del Sistema

```
@startuml
left to right direction
skinparam packageStyle rectangle

actor Usuario as U
actor "Sistema IA" as IA
actor "Web Speech API" as VR

rectangle "MoneyTalk Finance App" {

  package "Autenticación" {
    (CU-01: Gestionar Autenticación) as AUTH
    (Registrarse) as REG
    (Iniciar Sesión) as LOGIN
    (Cerrar Sesión) as LOGOUT

    AUTH ..> REG : <<include>>
    AUTH ..> LOGIN : <<include>>
    AUTH ..> LOGOUT : <<include>>
  }

  package "Gestión Financiera" {
    (CU-02: Gestionar Transacciones) as TRANS
    (Crear Transacción) as CREATE_T
    (Editar Transacción) as EDIT_T
    (Eliminar Transacción) as DELETE_T
    (Buscar/Filtrar) as FILTER_T
    (CU-03: Crear con Voz) as VOICE
    (CU-09: Exportar Datos) as EXPORT

    TRANS ..> CREATE_T : <<include>>
    TRANS ..> EDIT_T : <<include>>
    TRANS ..> DELETE_T : <<include>>
    TRANS ..> FILTER_T : <<extend>>
    CREATE_T <.. VOICE : <<extend>>
    TRANS ..> EXPORT : <<extend>>
  }

  package "Presupuestos" {
    (CU-04: Gestionar Presupuestos) as BUDGET
    (Crear Presupuesto) as CREATE_B
    (Agregar Dinero) as ADD_MONEY
    (Editar Presupuesto) as EDIT_B
    (Eliminar Presupuesto) as DELETE_B

    BUDGET ..> CREATE_B : <<include>>
    BUDGET ..> EDIT_B : <<include>>
    BUDGET ..> DELETE_B : <<include>>
    BUDGET ..> ADD_MONEY : <<extend>>
  }

  package "Pagos Recurrentes" {
    (CU-05: Gestionar Pagos Recurrentes) as RECURRING
    (Crear Pago Recurrente) as CREATE_R
    (Editar Pago Recurrente) as EDIT_R
    (Eliminar Pago Recurrente) as DELETE_R

    RECURRING ..> CREATE_R : <<include>>
    RECURRING ..> EDIT_R : <<include>>
    RECURRING ..> DELETE_R : <<include>>
  }

  package "Visualización y Análisis" {
    (CU-06: Visualizar Dashboard) as DASH
    (Ver Resumen Diario) as DAILY
    (Ver Gráficos Semanales) as WEEKLY
    (CU-07: Generar Reportes) as REPORTS
    (Filtrar por Período) as FILTER_R
    (CU-08: Obtener Recomendaciones IA) as AI_REC

    DASH ..> DAILY : <<include>>
    DASH ..> WEEKLY : <<include>>
    DASH ..> AI_REC : <<include>>
    REPORTS ..> FILTER_R : <<extend>>
  }

  package "Perfil" {
    (CU-10: Actualizar Perfil) as PROFILE
  }
}

U --> AUTH
U --> TRANS
U --> VOICE
U --> BUDGET
U --> RECURRING
U --> DASH
U --> REPORTS
U --> EXPORT
U --> PROFILE

VR ..> VOICE : <<provee servicio>>
IA ..> AI_REC : <<provee análisis>>

@enduml
```

### CU-01: Diagrama de Caso de Uso - Autenticación

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-01: Gestión de Autenticación" {
  (Registrarse) as REG
  (Iniciar Sesión) as LOGIN
  (Cerrar Sesión) as LOGOUT
  (Validar Credenciales) as VALID
  (Generar Token JWT) as TOKEN

  LOGIN ..> VALID : <<include>>
  LOGIN ..> TOKEN : <<include>>
  REG ..> TOKEN : <<include>>
}

U --> REG
U --> LOGIN
U --> LOGOUT

@enduml
```

### CU-02: Diagrama de Caso de Uso - Gestionar Transacciones

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-02: Gestionar Transacciones" {
  (Ver Lista de Transacciones) as VIEW
  (Crear Transacción) as CREATE
  (Editar Transacción) as EDIT
  (Eliminar Transacción) as DELETE
  (Buscar Transacciones) as SEARCH
  (Filtrar por Tipo) as FILTER_TYPE
  (Filtrar por Categoría) as FILTER_CAT
  (Filtrar por Fecha) as FILTER_DATE
  (Paginar Resultados) as PAGING
  (Validar Formulario) as VALIDATE

  VIEW ..> PAGING : <<extend>>
  VIEW ..> SEARCH : <<extend>>
  VIEW ..> FILTER_TYPE : <<extend>>
  VIEW ..> FILTER_CAT : <<extend>>
  VIEW ..> FILTER_DATE : <<extend>>

  CREATE ..> VALIDATE : <<include>>
  EDIT ..> VALIDATE : <<include>>
}

U --> VIEW
U --> CREATE
U --> EDIT
U --> DELETE

@enduml
```

### CU-03: Diagrama de Caso de Uso - Crear Transacción con Voz

```
@startuml
left to right direction

actor Usuario as U
actor "Web Speech API" as WSA

rectangle "CU-03: Crear Transacción con Voz" {
  (Activar Micrófono) as MIC
  (Reconocer Voz) as RECOG
  (Parsear Comando) as PARSE
  (Pre-llenar Formulario) as PREFILL
  (Crear Transacción) as CREATE
  (Solicitar Permisos) as PERM

  MIC ..> PERM : <<include>>
  MIC ..> RECOG : <<include>>
  RECOG ..> PARSE : <<include>>
  PARSE ..> PREFILL : <<include>>
  PREFILL ..> CREATE : <<include>>
}

U --> MIC
WSA ..> RECOG : <<provee servicio>>

@enduml
```

### CU-04: Diagrama de Caso de Uso - Gestionar Presupuestos

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-04: Gestionar Presupuestos" {
  (Ver Presupuestos) as VIEW
  (Crear Presupuesto) as CREATE
  (Editar Presupuesto) as EDIT
  (Eliminar Presupuesto) as DELETE
  (Agregar Dinero) as ADD
  (Calcular Progreso) as CALC_PROG
  (Calcular Asignación Mensual) as CALC_MONTHLY
  (Validar Formulario) as VALIDATE

  VIEW ..> CALC_PROG : <<include>>
  VIEW ..> CALC_MONTHLY : <<include>>
  CREATE ..> VALIDATE : <<include>>
  EDIT ..> VALIDATE : <<include>>
  ADD ..> CALC_PROG : <<include>>
}

U --> VIEW
U --> CREATE
U --> EDIT
U --> DELETE
U --> ADD

@enduml
```

### CU-05: Diagrama de Caso de Uso - Gestionar Pagos Recurrentes

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-05: Gestionar Pagos Recurrentes" {
  (Ver Pagos Recurrentes) as VIEW
  (Crear Pago Recurrente) as CREATE
  (Editar Pago Recurrente) as EDIT
  (Eliminar Pago Recurrente) as DELETE
  (Calcular Gasto Mensual) as CALC_MONTHLY
  (Calcular Próxima Fecha) as CALC_NEXT
  (Validar Formulario) as VALIDATE

  VIEW ..> CALC_MONTHLY : <<include>>
  VIEW ..> CALC_NEXT : <<include>>
  CREATE ..> VALIDATE : <<include>>
  EDIT ..> VALIDATE : <<include>>
}

U --> VIEW
U --> CREATE
U --> EDIT
U --> DELETE

@enduml
```

### CU-06: Diagrama de Caso de Uso - Visualizar Dashboard

```
@startuml
left to right direction

actor Usuario as U
actor "Sistema IA" as IA

rectangle "CU-06: Visualizar Dashboard" {
  (Ver Dashboard) as VIEW
  (Cargar Transacciones) as LOAD_T
  (Cargar Presupuestos) as LOAD_B
  (Cargar Pagos Recurrentes) as LOAD_R
  (Obtener Recomendaciones) as LOAD_AI
  (Calcular Resumen Diario) as CALC_DAILY
  (Generar Gráfico Semanal) as CHART_WEEK
  (Calcular Balance Disponible) as CALC_BAL

  VIEW ..> LOAD_T : <<include>>
  VIEW ..> LOAD_B : <<include>>
  VIEW ..> LOAD_R : <<include>>
  VIEW ..> LOAD_AI : <<include>>
  VIEW ..> CALC_DAILY : <<include>>
  VIEW ..> CHART_WEEK : <<include>>
  VIEW ..> CALC_BAL : <<include>>
}

U --> VIEW
IA ..> LOAD_AI : <<provee análisis>>

@enduml
```

### CU-07: Diagrama de Caso de Uso - Generar Reportes

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-07: Generar Reportes" {
  (Ver Reportes) as VIEW
  (Filtrar por Período) as FILTER
  (Seleccionar Rango Personalizado) as CUSTOM
  (Calcular Totales) as CALC_TOT
  (Agrupar por Categoría) as GROUP_CAT
  (Generar Gráfico Circular) as CHART_PIE
  (Generar Gráfico de Barras) as CHART_BAR
  (Mostrar Top Categorías) as TOP_CAT
  (Actualizar Datos) as REFRESH

  VIEW ..> FILTER : <<extend>>
  VIEW ..> CUSTOM : <<extend>>
  VIEW ..> REFRESH : <<extend>>
  VIEW ..> CALC_TOT : <<include>>
  VIEW ..> GROUP_CAT : <<include>>
  VIEW ..> CHART_PIE : <<include>>
  VIEW ..> CHART_BAR : <<include>>
  VIEW ..> TOP_CAT : <<include>>
}

U --> VIEW

@enduml
```

### CU-08: Diagrama de Caso de Uso - Obtener Recomendaciones IA

```
@startuml
left to right direction

actor Usuario as U
actor "Sistema IA" as IA

rectangle "CU-08: Obtener Recomendaciones IA" {
  (Solicitar Recomendaciones) as REQUEST
  (Verificar Cache) as CHECK_CACHE
  (Analizar Patrones) as ANALYZE
  (Generar Recomendaciones) as GENERATE
  (Mostrar Recomendaciones) as DISPLAY
  (Actualizar Cache) as UPDATE_CACHE

  REQUEST ..> CHECK_CACHE : <<include>>
  CHECK_CACHE ..> ANALYZE : <<extend>>
  ANALYZE ..> GENERATE : <<include>>
  GENERATE ..> UPDATE_CACHE : <<include>>
  REQUEST ..> DISPLAY : <<include>>
}

U --> REQUEST
IA ..> ANALYZE : <<provee análisis>>
IA ..> GENERATE : <<provee generación>>

@enduml
```

### CU-09: Diagrama de Caso de Uso - Exportar Datos

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-09: Exportar Datos" {
  (Exportar a CSV) as EXPORT
  (Aplicar Filtros) as FILTER
  (Generar Archivo CSV) as GENERATE
  (Descargar Archivo) as DOWNLOAD

  EXPORT ..> FILTER : <<extend>>
  EXPORT ..> GENERATE : <<include>>
  EXPORT ..> DOWNLOAD : <<include>>
}

U --> EXPORT

@enduml
```

### CU-10: Diagrama de Caso de Uso - Actualizar Perfil

```
@startuml
left to right direction

actor Usuario as U

rectangle "CU-10: Actualizar Perfil" {
  (Ver Perfil) as VIEW
  (Editar Información) as EDIT
  (Validar Email Único) as VALIDATE_EMAIL
  (Validar Formulario) as VALIDATE_FORM
  (Guardar Cambios) as SAVE

  VIEW ..> EDIT : <<extend>>
  EDIT ..> VALIDATE_FORM : <<include>>
  EDIT ..> VALIDATE_EMAIL : <<extend>>
  EDIT ..> SAVE : <<include>>
}

U --> VIEW

@enduml
```

---

## 3. DIAGRAMAS DE SECUENCIA

### CU-01: Iniciar Sesión

```
@startuml
actor Usuario
participant "Login Page" as LP
participant "Auth Store" as AS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> LP: Ingresa credenciales
LP -> LP: Validar formato de campos
LP -> AS: login(email, password)
AS -> AS: Establecer isLoading = true
AS -> AC: POST /auth/login
AC -> AC: Agregar headers
AC -> API: {email, password}
API -> API: Buscar usuario por email
API -> API: Comparar password hash
API -> API: Generar accessToken JWT
API -> API: Generar refreshToken
API --> AC: {user, accessToken, refreshToken}
AC --> AS: response.data
AS -> AS: Guardar token en state
AS -> AS: Guardar usuario en state
AS -> AS: Establecer isAuthenticated = true
AS -> AS: Persistir en localStorage
AS --> LP: Success
LP -> LP: Redirigir a /dashboard
LP --> Usuario: Mostrar dashboard

alt Error de autenticación
  API --> AC: Error 401
  AC --> AS: Error response
  AS -> AS: isLoading = false
  AS --> LP: Error
  LP --> Usuario: Mostrar "Credenciales incorrectas"
end

@enduml
```

### CU-01: Registrarse

```
@startuml
actor Usuario
participant "Signup Page" as SP
participant "Auth Store" as AS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> SP: Completa formulario de registro
Usuario -> SP: Ingresa email, password, nombre
SP -> SP: Validar formato de campos
Usuario -> SP: Click "Crear Cuenta"
SP -> AS: signup(email, password, displayName)
AS -> AS: Establecer isLoading = true
AS -> AC: POST /auth/register
AC -> API: {email, password, name}
API -> API: Verificar email no existe
API -> API: Hash de password (bcrypt)
API -> API: Crear usuario en BD
API -> API: Generar accessToken JWT
API -> API: Generar refreshToken
API --> AC: {user, accessToken, refreshToken}
AC --> AS: response.data
AS -> AS: Guardar token en state
AS -> AS: Guardar usuario en state
AS -> AS: Establecer isAuthenticated = true
AS -> AS: Persistir en localStorage
AS --> SP: Success
SP -> SP: Redirigir a /dashboard
SP --> Usuario: Mostrar dashboard

alt Email ya existe
  API --> AC: Error 409
  AC --> AS: Error response
  AS --> SP: Error
  SP --> Usuario: Mostrar "Email ya registrado"
end

@enduml
```

### CU-01: Cerrar Sesión

```
@startuml
actor Usuario
participant "Header" as H
participant "Auth Store" as AS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> H: Click "Cerrar Sesión"
H -> AS: logout()
AS -> AC: POST /auth/logout
AC -> API: {token}
API -> API: Invalidar refreshToken
API --> AC: Success
AC --> AS: Response
AS -> AS: Limpiar token
AS -> AS: Limpiar usuario
AS -> AS: Establecer isAuthenticated = false
AS -> AS: Limpiar localStorage
AS --> H: Success
H -> H: Redirigir a /login
H --> Usuario: Mostrar página de login

@enduml
```

### CU-02: Crear Transacción

```
@startuml
actor Usuario
participant "New Transaction Page" as NTP
participant "Transaction Form" as TF
participant "Transaction Store" as TS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> NTP: Click "Nueva Transacción"
NTP --> Usuario: Mostrar formulario vacío

Usuario -> TF: Completar campos
Usuario -> TF: - Monto: 50
Usuario -> TF: - Descripción: "Comida"
Usuario -> TF: - Categoría: "Alimentación"
Usuario -> TF: - Tipo: EXPENSE
Usuario -> TF: - Fecha: hoy

Usuario -> TF: Click "Guardar"
TF -> TF: Validar campos con React Hook Form
TF -> TS: addTransaction(data)

TS -> TS: Generar ID temporal (temp-123)
TS -> TS: Crear objeto transacción temporal
TS -> TS: Agregar al array en estado (optimistic update)
TS --> NTP: Actualizar UI inmediatamente

TS -> AC: POST /transactions
AC -> AC: Agregar Authorization header
AC -> AC: Agregar userId del token
AC -> API: {amount, description, categoryId, type, date, userId}

API -> API: Validar datos
API -> API: INSERT INTO transactions
API -> API: Obtener ID generado
API --> AC: {id: 456, ...transactionData}

AC --> TS: response.data

TS -> TS: Encontrar transacción temporal (temp-123)
TS -> TS: Reemplazar con ID real (456)
TS -> TS: Actualizar estado
TS --> NTP: Success

NTP -> NTP: Mostrar toast "Transacción agregada"
NTP -> NTP: Redirigir a /transactions
NTP --> Usuario: Mostrar lista con nueva transacción

alt Validación fallida
  TF -> TF: Detectar errores
  TF --> Usuario: Mostrar errores en campos
end

alt Error de red (offline)
  AC --> TS: Error de red
  TS -> TS: Detectar navigator.onLine === false
  TS -> TS: Mover a outboxTransactions
  TS --> NTP: "Guardado offline"
  NTP --> Usuario: Mostrar mensaje offline
end

alt Error del servidor
  API --> AC: Error 500
  AC --> TS: Error response
  TS -> TS: Eliminar transacción temporal
  TS -> TS: Revertir cambio UI
  TS --> NTP: Error
  NTP --> Usuario: Mostrar "Error al guardar"
end

@enduml
```

### CU-02: Editar Transacción

```
@startuml
actor Usuario
participant "Transactions Page" as TP
participant "Transaction Form" as TF
participant "Transaction Store" as TS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> TP: Click icono editar en transacción
TP -> TF: Abrir modal con datos
TF --> Usuario: Mostrar formulario pre-llenado

Usuario -> TF: Modificar campos
Usuario -> TF: Cambiar monto a 75
Usuario -> TF: Click "Guardar"

TF -> TF: Validar campos
TF -> TS: updateTransaction(id, data)

TS -> TS: Actualizar en estado (optimistic)
TS --> TP: Actualizar UI inmediatamente

TS -> AC: PUT /transactions/:id
AC -> AC: Agregar Authorization header
AC -> API: {amount, description, ...}

API -> API: Verificar pertenencia a usuario
API -> API: UPDATE transactions SET ...
API --> AC: Success

AC --> TS: response.data
TS --> TF: Success
TF --> Usuario: Cerrar modal
TF -> TP: Actualizar lista
TP --> Usuario: Mostrar transacción actualizada

alt Error del servidor
  API --> AC: Error
  AC --> TS: Error response
  TS -> TS: Llamar fetchTransactions()
  TS -> TS: Recargar desde servidor
  TS --> TP: Datos originales restaurados
  TP --> Usuario: Mostrar error
end

@enduml
```

### CU-02: Eliminar Transacción

```
@startuml
actor Usuario
participant "Transactions Page" as TP
participant "Transaction Store" as TS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> TP: Click icono eliminar
TP -> TP: Mostrar confirmación
TP --> Usuario: "¿Seguro de eliminar?"

Usuario -> TP: Confirmar eliminación
TP -> TS: deleteTransaction(id)

TS -> TS: Eliminar de estado (optimistic)
TS --> TP: Actualizar UI inmediatamente

TS -> AC: DELETE /transactions/:id
AC -> AC: Agregar Authorization header
AC -> API: DELETE request con id

API -> API: Verificar pertenencia a usuario
API -> API: DELETE FROM transactions WHERE id = X
API --> AC: Success

AC --> TS: response.data
TS --> TP: Success
TP -> TP: Mostrar toast "Transacción eliminada"
TP --> Usuario: Lista actualizada sin la transacción

alt Usuario cancela
  Usuario -> TP: Click "Cancelar"
  TP --> Usuario: Cerrar modal, no hacer nada
end

alt Error del servidor
  API --> AC: Error
  AC --> TS: Error response
  TS -> TS: Llamar fetchTransactions()
  TS -> TS: Recargar desde servidor
  TS --> TP: Restaurar transacción en lista
  TP --> Usuario: Mostrar "Error al eliminar"
end

@enduml
```

### CU-02: Filtrar Transacciones

```
@startuml
actor Usuario
participant "Transactions Page" as TP
participant "Transaction Store" as TS

Usuario -> TP: Click "Filtrar"
TP --> Usuario: Mostrar panel de filtros

Usuario -> TP: Seleccionar filtros
Usuario -> TP: - Tipo: EXPENSE
Usuario -> TP: - Categoría: "Alimentación"
Usuario -> TP: - Fecha desde: 2025-01-01
Usuario -> TP: - Fecha hasta: 2025-01-31

TP -> TP: Aplicar filtros en cliente
TP -> TP: filteredTransactions = transactions.filter(...)

loop Para cada transacción
  TP -> TP: Verificar si cumple tipo
  TP -> TP: Verificar si cumple categoría
  TP -> TP: Verificar si cumple rango de fechas
  TP -> TP: Si cumple todo, agregar a resultado
end

TP --> Usuario: Mostrar transacciones filtradas

alt Usuario limpia filtros
  Usuario -> TP: Click "Restablecer"
  TP -> TP: Limpiar todos los filtros
  TP --> Usuario: Mostrar todas las transacciones
end

@enduml
```

### CU-02: Exportar Datos (Ver CU-09)

---

### CU-03: Crear Transacción con Voz

```
@startuml
actor Usuario
participant "New Transaction Page" as NTP
participant "Speech Recognition Hook" as SRH
participant "Web Speech API" as WSA
participant "Transaction Store" as TS
participant "Backend API" as API

Usuario -> NTP: Acceder a nueva transacción
NTP --> Usuario: Mostrar formulario

Usuario -> NTP: Click botón de micrófono
NTP -> SRH: startListening()

SRH -> SRH: Verificar soporte de navegador
SRH -> WSA: Solicitar permiso de micrófono

alt Permiso concedido
  WSA --> SRH: Permiso otorgado
  SRH -> WSA: Crear SpeechRecognition instance
  SRH -> WSA: Configurar lang = 'es-ES'
  SRH -> WSA: startRecognition()

  WSA --> SRH: Evento 'start'
  SRH --> NTP: Estado: listening = true
  NTP --> Usuario: Mostrar icono animado "Escuchando..."

  Usuario -> WSA: Habla: "Gasto de 50 bolivianos en comida"

  WSA -> WSA: Procesar audio
  WSA -> WSA: Reconocer palabras
  WSA --> SRH: Evento 'result' con transcript

  SRH -> SRH: Extraer transcript del evento
  SRH -> SRH: Parsear comando de voz
  SRH -> SRH: Detectar tipo: "gasto" → EXPENSE
  SRH -> SRH: Extraer monto: "50"
  SRH -> SRH: Extraer descripción: "comida"
  SRH -> SRH: Buscar categoría relacionada

  SRH --> NTP: {type: EXPENSE, amount: 50, description: "comida", category: "Alimentación"}

  NTP -> NTP: Pre-llenar campos del formulario
  NTP -> NTP: Detener animación de micrófono
  NTP --> Usuario: Mostrar campos pre-llenados

  Usuario -> NTP: Revisar datos

  alt Usuario confirma datos
    Usuario -> NTP: Click "Guardar"
    NTP -> TS: addTransaction(data)
    note right: Continúa con flujo normal de CU-02
    TS -> API: POST /transactions
    API --> TS: Success
    TS --> NTP: Success
    NTP --> Usuario: "Transacción creada exitosamente"
  end

  alt Usuario ajusta datos
    Usuario -> NTP: Modificar campos
    Usuario -> NTP: Click "Guardar"
    NTP -> TS: addTransaction(data modificado)
    TS -> API: POST /transactions
    API --> TS: Success
    TS --> NTP: Success
    NTP --> Usuario: "Transacción creada"
  end

else Permiso denegado
  WSA --> SRH: Error: Permiso denegado
  SRH --> NTP: Error
  NTP --> Usuario: "Permiso de micrófono requerido"
  NTP -> NTP: Deshabilitar botón de voz
end

alt Error de reconocimiento
  WSA --> SRH: Evento 'error'
  SRH --> NTP: Error: no se reconoció comando
  NTP --> Usuario: "No se pudo reconocer. Intenta de nuevo"
  NTP --> Usuario: Mantener formulario vacío para input manual
end

alt API no soportada
  SRH -> SRH: Verificar window.webkitSpeechRecognition
  SRH --> NTP: API no disponible
  NTP -> NTP: Ocultar botón de micrófono
  NTP --> Usuario: Solo mostrar formulario manual
end

@enduml
```

---

### CU-04: Crear Presupuesto

```
@startuml
actor Usuario
participant "Budgets Page" as BP
participant "Budget Form" as BF
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> BP: Click "Nuevo Presupuesto"
BP -> BF: Mostrar formulario
BF --> Usuario: Formulario vacío

Usuario -> BF: Completar campos
Usuario -> BF: - Nombre: "Vacaciones 2025"
Usuario -> BF: - Tipo: VACATION
Usuario -> BF: - Monto objetivo: 5000
Usuario -> BF: - Fecha objetivo: 2025-12-01
Usuario -> BF: - Descripción: "Viaje a Europa"

Usuario -> BF: Click "Crear Presupuesto"
BF -> BF: Validar con React Hook Form
BF -> BS: addBudget(data)

BS -> BS: Preparar datos con currentAmount = 0
BS -> AC: POST /budgets
AC -> AC: Agregar Authorization header
AC -> AC: Agregar userId
AC -> API: {name, type, targetAmount, targetDate, description, userId, currentAmount: 0}

API -> API: Validar datos
API -> API: INSERT INTO budgets
API --> AC: {id, status: 'ACTIVE', ...budgetData}

AC --> BS: response.data
BS -> BS: Mapear respuesta
BS -> BS: Agregar a array de budgets en estado
BS -> BS: Recalcular getTotalBudgetAllocations()
BS --> BP: Success

BP -> BP: Cerrar formulario
BP -> BP: Mostrar toast "Presupuesto creado"
BP -> BP: Agregar tarjeta de presupuesto a lista
BP --> Usuario: Mostrar nuevo presupuesto con progreso 0%

@enduml
```

### CU-04: Agregar Dinero a Presupuesto

```
@startuml
actor Usuario
participant "Budgets Page" as BP
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> BP: Click "Agregar Dinero" en presupuesto
BP --> Usuario: Mostrar input de monto

Usuario -> BP: Ingresar 500
Usuario -> BP: Click "Agregar"

BP -> BP: Validar monto > 0
BP -> BS: addToBudget(budgetId, 500)

BS -> BS: Actualizar currentAmount en estado (optimistic)
BS -> BS: currentAmount = 1000 + 500 = 1500
BS --> BP: Actualizar UI inmediatamente

BS -> AC: POST /budgets/:id/add
AC -> AC: Agregar Authorization header
AC -> API: {amount: 500}

API -> API: Verificar presupuesto pertenece a usuario
API -> API: Obtener presupuesto actual
API -> API: currentAmount = currentAmount + 500
API -> API: UPDATE budgets SET currentAmount
API -> API: Verificar si currentAmount >= targetAmount

alt Presupuesto completado
  API -> API: currentAmount >= targetAmount
  API -> API: UPDATE budgets SET status = 'COMPLETED'
  API --> AC: {status: 'COMPLETED', currentAmount: 5000}
  AC --> BS: Budget completado
  BS -> BS: Actualizar status en estado
  BS --> BP: Budget completado
  BP --> Usuario: Mostrar badge "COMPLETED"
  BP --> Usuario: Mostrar animación de celebración
end

alt Presupuesto aún activo
  API --> AC: {status: 'ACTIVE', currentAmount: 1500}
  AC --> BS: Success
  BS -> BS: Recalcular progreso: (1500/5000) * 100 = 30%
  BS --> BP: Success
  BP -> BP: Actualizar barra de progreso
  BP --> Usuario: Mostrar progreso 30%
end

BP -> BP: Cerrar input de monto
BP -> BP: Mostrar toast "Monto agregado"
BP -> BS: Recalcular getTotalBudgetAllocations()
BS --> BP: totalAllocations actualizado
BP --> Usuario: Actualizar métricas superiores

@enduml
```

### CU-04: Editar Presupuesto

```
@startuml
actor Usuario
participant "Budgets Page" as BP
participant "Budget Form" as BF
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> BP: Click icono editar en presupuesto
BP -> BF: Cargar datos del presupuesto
BF -> BF: Pre-llenar formulario con datos
BF --> Usuario: Mostrar formulario con datos actuales

Usuario -> BF: Modificar campos
Usuario -> BF: Cambiar targetAmount a 6000
Usuario -> BF: Click "Actualizar"

BF -> BF: Validar campos
BF -> BS: updateBudget(budgetId, data)

BS -> BS: Actualizar en estado (optimistic)
BS --> BP: Actualizar UI

BS -> AC: PUT /budgets/:id
AC -> AC: Agregar Authorization header
AC -> API: {targetAmount: 6000, ...}

API -> API: Verificar pertenencia
API -> API: UPDATE budgets SET targetAmount = 6000
API --> AC: Success

AC --> BS: response.data
BS -> BS: Recalcular progreso con nuevo target
BS --> BF: Success
BF -> BF: Cerrar formulario
BF -> BP: Actualizar presupuesto
BP --> Usuario: Mostrar presupuesto actualizado

@enduml
```

### CU-04: Eliminar Presupuesto

```
@startuml
actor Usuario
participant "Budgets Page" as BP
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> BP: Click icono eliminar
BP -> BP: Mostrar confirmación
BP --> Usuario: "¿Eliminar presupuesto?"

Usuario -> BP: Confirmar
BP -> BS: deleteBudget(budgetId)

BS -> BS: Eliminar de estado (optimistic)
BS --> BP: Actualizar UI

BS -> AC: DELETE /budgets/:id
AC -> AC: Agregar Authorization header
AC -> API: DELETE request

API -> API: Verificar pertenencia
API -> API: DELETE FROM budgets WHERE id = X
API --> AC: Success

AC --> BS: response.data
BS -> BS: Recalcular getTotalBudgetAllocations()
BS --> BP: Success
BP -> BP: Mostrar toast "Presupuesto eliminado"
BP --> Usuario: Lista actualizada

@enduml
```

---

### CU-05: Crear Pago Recurrente

```
@startuml
actor Usuario
participant "Recurring Payments Page" as RPP
participant "Payment Form" as PF
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> RPP: Click "Nuevo Pago Recurrente"
RPP -> PF: Mostrar formulario
PF -> AC: GET /categories
AC -> API: Solicitar categorías de EXPENSE
API --> AC: categories[]
AC --> PF: categories[]
PF --> Usuario: Formulario con categorías

Usuario -> PF: Completar campos
Usuario -> PF: - Nombre: "Netflix"
Usuario -> PF: - Categoría: "Entretenimiento"
Usuario -> PF: - Monto: 50
Usuario -> PF: - Frecuencia: MONTHLY
Usuario -> PF: - Próxima fecha: 2025-02-01

Usuario -> PF: Click "Crear"
PF -> PF: Validar campos
PF -> BS: addRecurringPayment(data)

BS -> AC: POST /recurring-payments
AC -> AC: Agregar Authorization header
AC -> AC: Agregar userId
AC -> API: {name, categoryId, amount, frequency, nextPaymentDate, userId}

API -> API: Validar datos
API -> API: INSERT INTO recurring_payments
API -> API: status = 'ACTIVE' por defecto
API --> AC: {id, status: 'ACTIVE', category: {name: 'Entretenimiento'}, ...}

AC --> BS: response.data
BS -> BS: Mapear respuesta
BS -> BS: Agregar a recurringPayments array
BS -> BS: Recalcular getTotalRecurringPayments()
BS --> RPP: Success

RPP -> RPP: Cerrar formulario
RPP -> RPP: Mostrar toast "Pago recurrente creado"
RPP --> Usuario: Mostrar nuevo pago en lista

@enduml
```

### CU-05: Editar Pago Recurrente

```
@startuml
actor Usuario
participant "Recurring Payments Page" as RPP
participant "Payment Form" as PF
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> RPP: Click editar en pago
RPP -> PF: Cargar datos del pago
PF --> Usuario: Formulario pre-llenado

Usuario -> PF: Modificar campos
Usuario -> PF: Cambiar monto a 60
Usuario -> PF: Cambiar frecuencia a YEARLY
Usuario -> PF: Click "Actualizar"

PF -> PF: Validar campos
PF -> BS: updateRecurringPayment(id, data)

BS -> BS: Actualizar en estado
BS --> RPP: Actualizar UI

BS -> AC: PUT /recurring-payments/:id
AC -> API: {amount: 60, frequency: 'YEARLY'}

API -> API: Verificar pertenencia
API -> API: UPDATE recurring_payments
API -> API: Recalcular nextPaymentDate si cambió frecuencia
API --> AC: Success

AC --> BS: response.data
BS -> BS: Recalcular getTotalRecurringPayments()
BS --> PF: Success
PF --> Usuario: Cerrar formulario
RPP --> Usuario: Mostrar pago actualizado

@enduml
```

### CU-05: Eliminar Pago Recurrente

```
@startuml
actor Usuario
participant "Recurring Payments Page" as RPP
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> RPP: Click eliminar
RPP -> RPP: Mostrar confirmación
RPP --> Usuario: "¿Eliminar pago recurrente?"

Usuario -> RPP: Confirmar
RPP -> BS: deleteRecurringPayment(id)

BS -> BS: Eliminar de estado
BS --> RPP: Actualizar UI

BS -> AC: DELETE /recurring-payments/:id
AC -> API: DELETE request

API -> API: Verificar pertenencia
API -> API: DELETE FROM recurring_payments
API --> AC: Success

AC --> BS: response.data
BS -> BS: Recalcular getTotalRecurringPayments()
BS --> RPP: Success
RPP --> Usuario: Mostrar toast y lista actualizada

@enduml
```

---

### CU-06: Visualizar Dashboard

```
@startuml
actor Usuario
participant "Dashboard Page" as DP
participant "Transaction Store" as TS
participant "Budget Store" as BS
participant "AI Store" as AIS
participant "Backend API" as API

Usuario -> DP: Accede al dashboard (/dashboard)
DP -> DP: useEffect ejecuta al montar

par Carga paralela de datos
  DP -> TS: fetchTransactions()
  TS -> API: GET /transactions?page=1&limit=10
  API --> TS: {transactions[], pagination}
  TS -> TS: Guardar en estado
  TS --> DP: transactions[]

  DP -> BS: fetchBudgets()
  BS -> API: GET /budgets
  API --> BS: budgets[]
  BS -> BS: Guardar en estado
  BS --> DP: budgets[]

  DP -> BS: fetchRecurringPayments()
  BS -> API: GET /recurring-payments
  API --> BS: recurringPayments[]
  BS -> BS: Guardar en estado
  BS --> DP: recurringPayments[]

  DP -> AIS: fetchRecommendations()
  note right: Ver CU-08 para detalle
  AIS -> AIS: Verificar cache
  alt Cache válido
    AIS --> DP: recommendations[] (desde cache)
  else Cache expirado
    AIS -> API: GET /ai/recommendations
    API --> AIS: recommendations[]
    AIS -> AIS: Actualizar cache
    AIS --> DP: recommendations[]
  end
end

DP -> TS: getTodaysSummary()
TS -> TS: Filtrar transactions de hoy
TS -> TS: Sumar INCOME → income
TS -> TS: Sumar EXPENSE → expense
TS -> TS: Calcular net = income - expense
TS --> DP: {income, expense, net}

DP -> BS: getTotalBudgetAllocations()
BS -> BS: Filtrar budgets ACTIVE
BS -> BS: Para cada budget calcular asignación mensual
BS -> BS: Sumar todas las asignaciones
BS --> DP: totalBudgetAllocations

DP -> BS: getTotalRecurringPayments()
BS -> BS: Filtrar recurringPayments ACTIVE
BS -> BS: Convertir cada frecuencia a monto mensual
BS -> BS: Sumar todos los montos mensuales
BS --> DP: totalRecurringPayments

DP -> BS: getAvailableBalance(income, expense)
BS -> BS: balance = income - expense
BS -> BS: balance = balance - budgetAllocations
BS -> BS: balance = balance - recurringPayments
BS --> DP: availableBalance

DP -> TS: getWeeklyData()
TS -> TS: Generar últimos 7 días
TS -> TS: Inicializar arrays income[7], expense[7]
TS -> TS: Iterar transactions y llenar arrays
TS --> DP: {labels[], income[], expense[]}

DP -> DP: Renderizar 3 tarjetas principales
DP --> Usuario: Mostrar "Ingresos de Hoy"
DP --> Usuario: Mostrar "Gastos de Hoy"
DP --> Usuario: Mostrar "Balance Disponible"

alt Hay presupuestos o pagos
  DP -> DP: Renderizar tarjetas adicionales
  DP --> Usuario: Mostrar "Asignación a Presupuestos"
  DP --> Usuario: Mostrar "Pagos Recurrentes"
end

DP -> DP: Renderizar ChartWrapper con datos semanales
DP --> Usuario: Mostrar gráfico de línea (7 días)

DP -> DP: Renderizar recomendaciones IA
DP -> DP: Mapear recommendations a tarjetas
DP --> Usuario: Mostrar 3 recomendaciones con iconos

DP -> DP: Renderizar tabla de transacciones recientes
DP -> DP: Tomar primeras 5 transacciones
DP --> Usuario: Mostrar tabla con link "Ver Todas"

DP --> Usuario: Dashboard completo renderizado

@enduml
```

---

### CU-07: Generar Reportes

```
@startuml
actor Usuario
participant "Reports Page" as RP
participant "Transaction Store" as TS
participant "Backend API" as API

Usuario -> RP: Accede a /reports
RP -> RP: useEffect al montar
RP -> TS: fetchTransactions()
TS -> API: GET /transactions
API --> TS: transactions[]
TS --> RP: transactions[]

RP -> RP: Establecer dateRange = 'thisMonth'
RP -> RP: Calcular fromDate y toDate
RP -> RP: fromDate = primer día del mes
RP -> RP: toDate = último día del mes

RP -> RP: filteredTransactions = transactions.filter()
loop Para cada transaction
  RP -> RP: Verificar si date está en rango
  RP -> RP: Si sí, agregar a filteredTransactions
end

RP -> RP: Calcular métricas
RP -> RP: totalIncome = sum(INCOME)
RP -> RP: totalExpenses = sum(EXPENSE)
RP -> RP: netCashflow = totalIncome - totalExpenses

RP -> RP: Agrupar por categoría
RP -> RP: expensesByCategory = {}
loop Para cada EXPENSE
  RP -> RP: expensesByCategory[category] += amount
end

RP -> RP: Generar datos mensuales
RP -> RP: monthlyData = {}
loop Para cada transaction
  RP -> RP: Obtener monthYear (YYYY-MM)
  RP -> RP: monthlyData[monthYear].income += ...
  RP -> RP: monthlyData[monthYear].expense += ...
end

RP -> RP: Preparar pieChartData
RP -> RP: labels = Object.keys(expensesByCategory)
RP -> RP: data = Object.values(expensesByCategory)
RP -> RP: Asignar colores

RP -> RP: Preparar barChartData
RP -> RP: labels = meses ordenados
RP -> RP: datasets = [{income}, {expense}]

RP -> RP: Renderizar 3 tarjetas de métricas
RP --> Usuario: Mostrar "Ingresos Totales"
RP --> Usuario: Mostrar "Gastos Totales"
RP --> Usuario: Mostrar "Balance Neto"

RP -> RP: Renderizar selectores de rango
RP --> Usuario: Mostrar botones de período

RP -> RP: Renderizar gráficos
RP --> Usuario: Mostrar Pie Chart (categorías)
RP --> Usuario: Mostrar Bar Chart (mensual)

RP -> RP: Renderizar top categorías
RP -> RP: Ordenar por monto DESC
RP -> RP: Tomar top 5
loop Para cada categoría
  RP -> RP: Calcular % del total
  RP -> RP: Renderizar barra de progreso
end
RP --> Usuario: Mostrar top 5 categorías

alt Usuario cambia rango
  Usuario -> RP: Click "Últimos 7 días"
  RP -> RP: Establecer dateRange = 'last7days'
  RP -> RP: Recalcular fromDate y toDate
  RP -> RP: Filtrar transactions nuevamente
  RP -> RP: Recalcular todas las métricas
  RP -> RP: Actualizar gráficos
  RP --> Usuario: Visualizaciones actualizadas
end

alt Usuario selecciona rango personalizado
  Usuario -> RP: Click "Personalizado"
  RP --> Usuario: Mostrar inputs de fecha
  Usuario -> RP: Seleccionar desde: 2025-01-01
  Usuario -> RP: Seleccionar hasta: 2025-01-15
  RP -> RP: Establecer customRange
  RP -> RP: Filtrar por customRange
  RP -> RP: Recalcular métricas
  RP -> RP: Actualizar visualizaciones
  RP --> Usuario: Datos actualizados
end

alt Usuario actualiza datos
  Usuario -> RP: Click "Actualizar Datos"
  RP -> RP: Establecer isRefreshing = true
  RP -> TS: fetchTransactions()
  TS -> API: GET /transactions
  API --> TS: transactions[] (actualizadas)
  TS --> RP: transactions[]
  RP -> RP: Recalcular todo
  RP -> RP: Establecer isRefreshing = false
  RP --> Usuario: Datos actualizados
end

@enduml
```

---

### CU-08: Obtener Recomendaciones IA

```
@startuml
actor Usuario
participant "Dashboard Page" as DP
participant "AI Store" as AIS
participant "API Client" as AC
participant "Backend API" as API
participant "AI Service" as AI_SVC

Usuario -> DP: Visualiza dashboard
DP -> AIS: fetchRecommendations()

AIS -> AIS: Obtener cache actual
AIS -> AIS: cache = getCachedRecommendations()
AIS -> AIS: Verificar timestamp

alt Cache válido (< 15 minutos)
  AIS -> AIS: currentTime - cacheTime < 15 min
  AIS --> DP: recommendations[] (desde cache)
  DP --> Usuario: Mostrar recomendaciones cacheadas

else Cache expirado o vacío
  AIS -> AIS: Establecer isLoading = true
  AIS -> AC: GET /ai/recommendations
  AC -> AC: Agregar Authorization header
  AC -> AC: Obtener userId del token
  AC -> API: {userId}

  API -> AI_SVC: Analizar usuario

  AI_SVC -> AI_SVC: Obtener transacciones del usuario
  AI_SVC -> AI_SVC: Obtener presupuestos del usuario
  AI_SVC -> AI_SVC: Obtener pagos recurrentes

  AI_SVC -> AI_SVC: Calcular patrones de gasto
  AI_SVC -> AI_SVC: Identificar categoría con mayor gasto
  AI_SVC -> AI_SVC: Calcular tendencias (aumenta/disminuye)
  AI_SVC -> AI_SVC: Comparar con presupuestos
  AI_SVC -> AI_SVC: Identificar oportunidades de ahorro

  AI_SVC -> AI_SVC: Generar recomendaciones[]

  alt Gasto alto en categoría
    AI_SVC -> AI_SVC: Crear recomendación tipo WARNING
    AI_SVC -> AI_SVC: title: "Alto gasto en X"
    AI_SVC -> AI_SVC: description: "Has gastado Y en X este mes"
  end

  alt Presupuesto por completarse
    AI_SVC -> AI_SVC: Crear recomendación tipo SUCCESS
    AI_SVC -> AI_SVC: title: "Cerca de tu meta"
    AI_SVC -> AI_SVC: description: "Solo faltan Z para tu meta de X"
  end

  alt Oportunidad de ahorro
    AI_SVC -> AI_SVC: Crear recomendación tipo INFO
    AI_SVC -> AI_SVC: title: "Oportunidad de ahorro"
    AI_SVC -> AI_SVC: description: "Podrías ahorrar X reduciendo Y"
  end

  AI_SVC --> API: recommendations[]

  API -> API: Ordenar por prioridad
  API --> AC: {recommendations: [...]}

  AC --> AIS: response.data

  AIS -> AIS: Guardar en cache local
  AIS -> AIS: Establecer timestamp actual
  AIS -> AIS: Establecer isLoading = false
  AIS --> DP: recommendations[]

  DP -> DP: Mapear recommendations a componentes
  loop Para cada recommendation
    DP -> DP: Determinar color por tipo
    DP -> DP: Determinar icono por tipo
    DP -> DP: Renderizar Card con estilos
  end

  DP --> Usuario: Mostrar recomendaciones con estilos
end

@enduml
```

---

### CU-09: Exportar Datos

```
@startuml
actor Usuario
participant "Transactions Page" as TP
participant "Browser" as BR

Usuario -> TP: Accede a /transactions
TP --> Usuario: Mostrar lista de transacciones

alt Usuario aplica filtros
  Usuario -> TP: Seleccionar tipo: EXPENSE
  Usuario -> TP: Seleccionar categoría: "Alimentación"
  Usuario -> TP: Seleccionar rango de fechas
  TP -> TP: Aplicar filtros
  TP -> TP: filteredTransactions = transactions.filter(...)
  TP --> Usuario: Mostrar transacciones filtradas
end

Usuario -> TP: Click botón "Exportar"

TP -> TP: Verificar filteredTransactions.length > 0

alt Hay transacciones para exportar
  TP -> TP: Crear headers CSV
  TP -> TP: headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']
  TP -> TP: csvRows = [headers.join(',')]

  loop Para cada transaction en filteredTransactions
    TP -> TP: Formatear fecha: transaction.date
    TP -> TP: Escapar descripción: replace('"', '""')
    TP -> TP: Encerrar descripción en comillas
    TP -> TP: Obtener categoría
    TP -> TP: Traducir tipo: INCOME → 'Ingreso', EXPENSE → 'Gasto'
    TP -> TP: Formatear monto
    TP -> TP: row = [date, description, category, type, amount].join(',')
    TP -> TP: csvRows.push(row)
  end

  TP -> TP: csvContent = csvRows.join('\\n')
  TP -> TP: Crear Blob
  TP -> TP: blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'})
  TP -> TP: Crear URL temporal
  TP -> TP: url = URL.createObjectURL(blob)

  TP -> TP: Generar nombre de archivo
  TP -> TP: today = new Date().toISOString().slice(0, 10)
  TP -> TP: filename = `transacciones-${today}.csv`

  TP -> TP: Crear elemento <a>
  TP -> TP: link = document.createElement('a')
  TP -> TP: link.href = url
  TP -> TP: link.setAttribute('download', filename)

  TP -> BR: document.body.appendChild(link)
  TP -> BR: link.click()

  BR -> BR: Abrir diálogo de descarga
  BR --> Usuario: Solicitar ubicación de guardado
  Usuario -> BR: Confirmar descarga
  BR -> BR: Descargar archivo
  BR --> Usuario: Archivo descargado

  TP -> BR: document.body.removeChild(link)
  TP -> TP: URL.revokeObjectURL(url)
  TP -> TP: Limpiar recursos

else Sin transacciones
  TP --> Usuario: Mostrar mensaje "No hay transacciones para exportar"
end

@enduml
```

---

### CU-10: Actualizar Perfil

```
@startuml
actor Usuario
participant "Profile Page" as PP
participant "Auth Store" as AS
participant "API Client" as AC
participant "Backend API" as API

Usuario -> PP: Accede a /profile
PP -> AS: Obtener usuario actual
AS --> PP: user {id, email, displayName}
PP --> Usuario: Mostrar formulario con datos actuales

Usuario -> PP: Modificar campos
Usuario -> PP: Cambiar name: "Juan Pérez"
Usuario -> PP: Cambiar email: "juan.nuevo@email.com"

Usuario -> PP: Click "Guardar Cambios"
PP -> PP: Validar campos
PP -> PP: Verificar email en formato válido
PP -> PP: Verificar name no vacío

PP -> AS: updateProfile({displayName, email})
AS -> AS: Establecer isLoading = true
AS -> AC: PUT /auth/profile
AC -> AC: Agregar Authorization header
AC -> API: {name: "Juan Pérez", email: "juan.nuevo@email.com"}

API -> API: Obtener userId del token
API -> API: Verificar email único (si cambió)

alt Email ya existe
  API -> API: SELECT FROM users WHERE email = X AND id != userId
  API -> API: Found usuario con ese email
  API --> AC: Error 409 "Email ya existe"
  AC --> AS: Error response
  AS -> AS: isLoading = false
  AS --> PP: Error
  PP --> Usuario: Mostrar "El email ya está en uso"
end

alt Email válido o no cambió
  API -> API: UPDATE users SET name = X, email = Y WHERE id = userId
  API -> API: SELECT usuario actualizado
  API --> AC: {user: {id, email, name}}

  AC --> AS: response.data
  AS -> AS: Actualizar user en estado
  AS -> AS: user.displayName = "Juan Pérez"
  AS -> AS: user.email = "juan.nuevo@email.com"
  AS -> AS: Persistir en localStorage
  AS -> AS: isLoading = false
  AS --> PP: Success

  PP -> PP: Mostrar toast "Perfil actualizado"
  PP --> Usuario: Formulario con datos actualizados
end

@enduml
```

---

## 4. DIAGRAMAS DE ROBUSTEZ

### CU-01: Gestión de Autenticación

```
@startuml
actor Usuario

boundary "Login Page" as LP
boundary "Signup Page" as SP
boundary "Header" as H

control "Auth Store" as AS
control "API Client" as AC

entity "User" as U
entity "Token JWT" as T

Usuario -> LP : Ingresar credenciales
LP -> LP : Validar formato
Usuario -> LP : Submit login
LP -> AS : login(email, password)
AS -> AC : POST /auth/login
AC --> AS : {user, token}
AS -> T : Guardar token
AS -> U : Guardar usuario
AS --> LP : Success
LP --> Usuario : Redirigir a dashboard

Usuario -> SP : Ir a registro
SP -> SP : Mostrar formulario
Usuario -> SP : Completar datos
SP -> AS : signup(email, password, name)
AS -> AC : POST /auth/register
AC --> AS : {user, token}
AS -> T : Guardar token
AS -> U : Crear usuario
AS --> SP : Success
SP --> Usuario : Redirigir a dashboard

Usuario -> H : Click cerrar sesión
H -> AS : logout()
AS -> AC : POST /auth/logout
AC --> AS : Success
AS -> T : Limpiar token
AS -> U : Limpiar usuario
AS --> H : Success
H --> Usuario : Redirigir a login

@enduml
```

### CU-02: Gestionar Transacciones

```
@startuml
actor Usuario

boundary "Transactions Page" as TP
boundary "New Transaction Page" as NTP
boundary "Transaction Form" as TF
boundary "Search & Filters" as SF

control "Transaction Store" as TS
control "API Client" as AC

entity "Transaction" as T
entity "Category" as C

Usuario -> TP : Acceder a transacciones
TP -> TS : fetchTransactions()
TS -> AC : GET /transactions?page=1
AC --> TS : {transactions[], pagination}
TS -> T : Mapear transacciones
TS --> TP : Display list
TP --> Usuario : Mostrar tabla

Usuario -> SF : Aplicar filtros
SF -> SF : Filtrar en cliente
SF -> T : filteredTransactions
SF --> TP : Actualizar lista
TP --> Usuario : Mostrar filtradas

Usuario -> TP : Click "Nueva Transacción"
TP -> NTP : Navigate
NTP --> Usuario : Show form

Usuario -> TF : Completar datos
TF -> TF : Validar con React Hook Form
Usuario -> TF : Submit
TF -> TS : addTransaction(data)
TS -> T : Crear transacción temporal
TS -> AC : POST /transactions
AC --> TS : {id, ...data}
TS -> T : Actualizar con ID real
TS --> NTP : Success
NTP --> Usuario : Confirmation & redirect

Usuario -> TP : Click editar
TP -> TF : Load transaction data
TF --> Usuario : Show edit form
Usuario -> TF : Modify & Submit
TF -> TS : updateTransaction(id, data)
TS -> T : Update en estado
TS -> AC : PUT /transactions/:id
AC --> TS : Success
TS --> TP : Refresh list
TP --> Usuario : Show updated

Usuario -> TP : Click eliminar
TP -> TP : Confirmar
Usuario -> TP : Confirmar
TP -> TS : deleteTransaction(id)
TS -> T : Eliminar de estado
TS -> AC : DELETE /transactions/:id
AC --> TS : Success
TS --> TP : Remove from list
TP --> Usuario : Confirmation

@enduml
```

### CU-03: Crear Transacción con Voz

```
@startuml
actor Usuario
actor "Web Speech API" as WSA

boundary "New Transaction Page" as NTP
boundary "Microphone Button" as MB
boundary "Transaction Form" as TF

control "Speech Recognition Hook" as SRH
control "Voice Parser" as VP
control "Transaction Store" as TS

entity "Transcript" as TR
entity "Transaction" as T

Usuario -> NTP : Acceder a nueva transacción
NTP --> Usuario : Mostrar formulario

Usuario -> MB : Click micrófono
MB -> SRH : startListening()
SRH -> SRH : Verificar soporte API
SRH -> WSA : Solicitar permiso

alt Permiso concedido
  WSA --> SRH : Permiso OK
  SRH -> WSA : startRecognition()
  WSA --> SRH : Evento 'start'
  SRH --> NTP : listening = true
  NTP --> Usuario : Indicador "Escuchando..."

  Usuario -> WSA : Hablar comando
  WSA -> WSA : Procesar audio
  WSA --> SRH : Evento 'result'
  SRH -> TR : Extraer transcript

  SRH -> VP : Parsear comando
  VP -> VP : Detectar tipo (ingreso/gasto)
  VP -> VP : Extraer monto
  VP -> VP : Extraer descripción
  VP -> VP : Buscar categoría
  VP --> SRH : Parsed data

  SRH --> TF : Pre-llenar campos
  TF --> Usuario : Mostrar campos prellenados

  Usuario -> TF : Revisar/ajustar
  Usuario -> TF : Confirmar
  TF -> TS : addTransaction(data)
  TS -> T : Crear transacción
  TS --> TF : Success
  TF --> Usuario : Confirmación

else Permiso denegado
  WSA --> SRH : Error permiso
  SRH --> NTP : Error
  NTP --> Usuario : Mensaje error
end

@enduml
```

### CU-04: Gestionar Presupuestos

```
@startuml
actor Usuario

boundary "Budgets Page" as BP
boundary "Budget Form" as BF
boundary "Add Money Input" as AMI
boundary "Summary Cards" as SC

control "Budget Store" as BS
control "API Client" as AC

entity "Budget" as B

Usuario -> BP : Acceder a presupuestos
BP -> BS : fetchBudgets()
BS -> AC : GET /budgets
AC --> BS : budgets[]
BS -> B : Mapear budgets
BS --> BP : Display budgets
BP -> SC : Render metrics
SC -> BS : getTotalBudgetAllocations()
BS --> SC : total allocations
SC --> Usuario : Mostrar métricas

Usuario -> BP : Click "Nuevo Presupuesto"
BP -> BF : Show form
BF --> Usuario : Display form

Usuario -> BF : Completar datos
BF -> BF : Validar con React Hook Form
Usuario -> BF : Submit
BF -> BS : addBudget(data)
BS -> AC : POST /budgets
AC --> BS : {id, currentAmount: 0, ...}
BS -> B : Crear budget en estado
BS --> BP : Update list
BP --> Usuario : Show new budget

Usuario -> BP : Click "Agregar Dinero"
BP -> AMI : Show input
AMI --> Usuario : Input field

Usuario -> AMI : Ingresar monto
Usuario -> AMI : Confirmar
AMI -> BS : addToBudget(budgetId, amount)
BS -> B : Actualizar currentAmount
BS -> AC : POST /budgets/:id/add
AC --> BS : Success
BS -> B : Recalcular progreso
BS --> BP : Update progress
BP --> Usuario : Show updated progress

Usuario -> BP : Click editar
BP -> BF : Load budget data
BF --> Usuario : Show edit form
Usuario -> BF : Modify & Submit
BF -> BS : updateBudget(id, data)
BS -> B : Update en estado
BS -> AC : PUT /budgets/:id
AC --> BS : Success
BS --> BP : Refresh
BP --> Usuario : Show updated

Usuario -> BP : Click eliminar
BP -> BP : Confirmar
Usuario -> BP : Confirmar
BP -> BS : deleteBudget(id)
BS -> B : Eliminar de estado
BS -> AC : DELETE /budgets/:id
AC --> BS : Success
BS --> BP : Remove from list
BP --> Usuario : Confirmation

@enduml
```

### CU-05: Gestionar Pagos Recurrentes

```
@startuml
actor Usuario

boundary "Recurring Payments Page" as RPP
boundary "Payment Form" as PF
boundary "Summary Cards" as SC

control "Budget Store" as BS
control "API Client" as AC

entity "RecurringPayment" as RP
entity "Category" as C

Usuario -> RPP : Acceder a pagos recurrentes
RPP -> BS : fetchRecurringPayments()
BS -> AC : GET /recurring-payments
AC --> BS : recurringPayments[]
BS -> RP : Mapear payments
BS --> RPP : Display payments
RPP -> SC : Render metrics
SC -> BS : getTotalRecurringPayments()
BS --> SC : total monthly
SC --> Usuario : Mostrar métricas

Usuario -> RPP : Click "Nuevo Pago Recurrente"
RPP -> PF : Show form
PF -> AC : GET /categories
AC --> PF : categories[]
PF --> Usuario : Display form con categorías

Usuario -> PF : Completar datos
PF -> PF : Validar campos
Usuario -> PF : Submit
PF -> BS : addRecurringPayment(data)
BS -> AC : POST /recurring-payments
AC --> BS : {id, status: 'ACTIVE', ...}
BS -> RP : Crear payment en estado
BS --> RPP : Update list
RPP --> Usuario : Show new payment

Usuario -> RPP : Click editar
RPP -> PF : Load payment data
PF --> Usuario : Show edit form
Usuario -> PF : Modify & Submit
PF -> BS : updateRecurringPayment(id, data)
BS -> RP : Update en estado
BS -> AC : PUT /recurring-payments/:id
AC --> BS : Success
BS --> RPP : Refresh
RPP --> Usuario : Show updated

Usuario -> RPP : Click eliminar
RPP -> RPP : Confirmar
Usuario -> RPP : Confirmar
RPP -> BS : deleteRecurringPayment(id)
BS -> RP : Eliminar de estado
BS -> AC : DELETE /recurring-payments/:id
AC --> BS : Success
BS --> RPP : Remove from list
RPP --> Usuario : Confirmation

@enduml
```

### CU-06: Visualizar Dashboard

```
@startuml
actor Usuario
actor "Sistema IA" as IA

boundary "Dashboard Page" as DP
boundary "Summary Cards" as SC
boundary "Chart Component" as CC
boundary "Recommendations Panel" as RC
boundary "Recent Transactions" as RT

control "Transaction Store" as TS
control "Budget Store" as BS
control "AI Store" as AIS

entity "Transaction" as T
entity "Budget" as B
entity "RecurringPayment" as RP
entity "Recommendation" as REC

Usuario -> DP : Acceder al dashboard

DP -> TS : fetchTransactions()
TS --> DP : transactions[]

DP -> BS : fetchBudgets()
BS --> DP : budgets[]

DP -> BS : fetchRecurringPayments()
BS --> DP : recurringPayments[]

DP -> AIS : fetchRecommendations()
IA ..> AIS : Analizar patrones
AIS --> DP : recommendations[]

DP -> TS : getTodaysSummary()
TS -> T : Filtrar por hoy
TS -> T : Calcular sumas
TS --> DP : {income, expense, net}

DP -> BS : getTotalBudgetAllocations()
BS -> B : Filtrar activos
BS -> B : Calcular asignaciones
BS --> DP : totalAllocations

DP -> BS : getTotalRecurringPayments()
BS -> RP : Filtrar activos
BS -> RP : Convertir a mensual
BS --> DP : totalPayments

DP -> BS : getAvailableBalance()
BS -> BS : Calcular balance
BS --> DP : availableBalance

DP -> TS : getWeeklyData()
TS -> T : Agrupar por día (7 días)
TS --> DP : {labels[], income[], expense[]}

DP -> SC : Render summary
SC --> Usuario : Mostrar 3 tarjetas principales
SC --> Usuario : Mostrar tarjetas adicionales

DP -> CC : Render chart
CC --> Usuario : Mostrar gráfico semanal

DP -> RC : Render recommendations
RC -> REC : Mapear a componentes
RC --> Usuario : Mostrar recomendaciones IA

DP -> RT : Render recent transactions
RT -> T : Tomar primeras 5
RT --> Usuario : Mostrar tabla

DP --> Usuario : Dashboard completo

@enduml
```

### CU-07: Generar Reportes

```
@startuml
actor Usuario

boundary "Reports Page" as RP
boundary "Date Range Selector" as DRS
boundary "Metrics Cards" as MC
boundary "Pie Chart" as PC
boundary "Bar Chart" as BC
boundary "Top Categories" as TC

control "Transaction Store" as TS
control "Report Calculator" as RC

entity "Transaction" as T
entity "FilteredTransactions" as FT

Usuario -> RP : Acceder a reportes
RP -> TS : fetchTransactions()
TS --> RP : transactions[]

RP -> RC : Apply default filter (thisMonth)
RC -> T : Filter by date range
RC --> FT : filteredTransactions

RP -> RC : Calculate metrics
RC -> RC : Calculate totalIncome
RC -> RC : Calculate totalExpenses
RC -> RC : Calculate netCashflow
RC -> RC : Group by category
RC -> RC : Get monthly data
RC --> RP : All metrics

RP -> MC : Render metrics
MC --> Usuario : Mostrar 3 tarjetas

RP -> DRS : Render date selectors
DRS --> Usuario : Mostrar botones de período

RP -> PC : Render pie chart
PC --> Usuario : Mostrar distribución categorías

RP -> BC : Render bar chart
BC --> Usuario : Mostrar comparativa mensual

RP -> TC : Render top categories
TC -> TC : Sort by amount DESC
TC -> TC : Take top 5
TC --> Usuario : Mostrar barras de progreso

Usuario -> DRS : Seleccionar rango
DRS -> RC : Apply new filter
RC -> T : Filter transactions
RC --> FT : Update filtered data
RC -> RC : Recalculate metrics
RC --> RP : Updated metrics
RP -> MC : Update cards
RP -> PC : Update pie chart
RP -> BC : Update bar chart
RP -> TC : Update top categories
MC --> Usuario : Métricas actualizadas
PC --> Usuario : Gráfico actualizado
BC --> Usuario : Gráfico actualizado
TC --> Usuario : Top actualizado

Usuario -> DRS : Select custom range
DRS --> Usuario : Show date inputs
Usuario -> DRS : Enter dates
DRS -> RC : Apply custom filter
RC --> RP : Updated
RP --> Usuario : Visualizaciones actualizadas

Usuario -> RP : Click "Actualizar"
RP -> TS : fetchTransactions()
TS --> RP : Fresh data
RP -> RC : Recalculate all
RC --> RP : Updated
RP --> Usuario : Datos actualizados

@enduml
```

### CU-08: Obtener Recomendaciones IA

```
@startuml
actor Usuario
actor "Sistema IA" as AI

boundary "Dashboard Page" as DP
boundary "Recommendations Panel" as RC

control "AI Store" as AIS
control "API Client" as AC

entity "Recommendation" as REC
entity "Cache" as CACHE

Usuario -> DP : Visualizar dashboard
DP -> AIS : fetchRecommendations()

AIS -> CACHE : Check cache validity
CACHE --> AIS : Cache status

alt Cache válido
  CACHE --> AIS : recommendations[]
  AIS --> DP : recommendations (cached)
else Cache expirado
  AIS -> AC : GET /ai/recommendations
  AC --> AI : Solicitar análisis
  AI -> AI : Analizar patrones usuario
  AI -> AI : Identificar oportunidades
  AI -> AI : Generar recomendaciones
  AI --> AC : recommendations[]
  AC --> AIS : response.data
  AIS -> CACHE : Update cache
  AIS -> CACHE : Set timestamp
  AIS --> DP : recommendations[]
end

DP -> RC : Render recommendations
RC -> REC : Map to components
RC -> RC : Assign colors by type
RC -> RC : Assign icons by type
RC --> Usuario : Show recommendation cards

@enduml
```

### CU-09: Exportar Datos

```
@startuml
actor Usuario

boundary "Transactions Page" as TP
boundary "Export Button" as EB

control "CSV Generator" as CG
control "Browser Download" as BD

entity "Transaction" as T
entity "CSV File" as CSV

Usuario -> TP : View transactions
TP --> Usuario : Display list

Usuario -> TP : Apply filters (optional)
TP -> T : Filter transactions
TP --> Usuario : Show filtered list

Usuario -> EB : Click "Exportar"
EB -> CG : Generate CSV

CG -> T : Get filteredTransactions
CG -> CG : Create headers array
loop For each transaction
  CG -> CG : Format date
  CG -> CG : Escape description
  CG -> CG : Get category
  CG -> CG : Translate type
  CG -> CG : Format amount
  CG -> CG : Create CSV row
end

CG -> CG : Join all rows with newline
CG -> CSV : Create Blob
CG -> CSV : Generate filename with date

CG -> BD : Create download link
BD -> BD : Set href to Blob URL
BD -> BD : Set download attribute
BD -> BD : Trigger click
BD --> Usuario : Download dialog

Usuario -> BD : Confirm save location
BD --> Usuario : File downloaded

CG -> CG : Clean up Blob URL

@enduml
```

### CU-10: Actualizar Perfil

```
@startuml
actor Usuario

boundary "Profile Page" as PP
boundary "Profile Form" as PF

control "Auth Store" as AS
control "API Client" as AC

entity "User" as U

Usuario -> PP : Acceder a perfil
PP -> AS : Get current user
AS --> PP : user data
PP -> PF : Load data
PF --> Usuario : Show form with current data

Usuario -> PF : Modify fields
Usuario -> PF : Change name
Usuario -> PF : Change email
Usuario -> PF : Submit

PF -> PF : Validate fields
PF -> AS : updateProfile(data)

AS -> AC : PUT /auth/profile
AC --> AS : Updated user

AS -> U : Update user in state
AS -> U : Persist to localStorage
AS --> PP : Success

PP --> Usuario : Show success message
PP --> Usuario : Display updated data

@enduml
```

---

## 5. DIAGRAMA DE DOMINIO

```
@startuml
skinparam classAttributeIconSize 0

class User {
  - id: string
  - email: string
  - displayName: string
  - name: string
  - createdAt: date
  - updatedAt: date
  --
  + login()
  + logout()
  + updateProfile()
}

class Transaction {
  - id: string
  - amount: decimal
  - description: string
  - type: TransactionType
  - date: date
  - createdAt: date
  --
  + create()
  + update()
  + delete()
  + export()
}

class Category {
  - id: integer
  - name: string
  - type: CategoryType
  --
}

class Budget {
  - id: string
  - name: string
  - description: string
  - type: BudgetType
  - targetAmount: decimal
  - currentAmount: decimal
  - targetDate: date
  - status: BudgetStatus
  - createdAt: date
  - updatedAt: date
  --
  + create()
  + update()
  + delete()
  + addMoney()
  + calculateProgress()
}

class RecurringPayment {
  - id: string
  - name: string
  - description: string
  - amount: decimal
  - frequency: RecurringFrequency
  - nextPaymentDate: date
  - lastPaymentDate: date
  - status: RecurringStatus
  - createdAt: date
  - updatedAt: date
  --
  + create()
  + update()
  + delete()
  + calculateNextPayment()
}

class Recommendation {
  - id: string
  - title: string
  - description: string
  - type: RecommendationType
  - priority: integer
  - createdAt: date
  --
  + generate()
  + cache()
}

class Report {
  - dateRange: DateRange
  - totalIncome: decimal
  - totalExpenses: decimal
  - netCashflow: decimal
  --
  + generate()
  + filterByDate()
  + groupByCategory()
  + calculateMonthlyData()
  + export()
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum CategoryType {
  INCOME
  EXPENSE
}

enum BudgetType {
  SAVINGS_GOAL
  PURCHASE_GOAL
  EMERGENCY_FUND
  VACATION
  OTHER
}

enum BudgetStatus {
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

enum RecurringFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  CANCELLED
}

enum RecommendationType {
  WARNING
  SUCCESS
  INFO
}

User "1" -- "0..*" Transaction : creates >
User "1" -- "0..*" Budget : manages >
User "1" -- "0..*" RecurringPayment : manages >
User "1" -- "0..*" Recommendation : receives >

Transaction "*" -- "1" Category : belongs to >
Transaction "*" -- "1" User : owned by >
Transaction "type" -- TransactionType

RecurringPayment "*" -- "1" Category : belongs to >
RecurringPayment "*" -- "1" User : owned by >
RecurringPayment "frequency" -- RecurringFrequency
RecurringPayment "status" -- RecurringStatus

Budget "*" -- "1" User : owned by >
Budget "type" -- BudgetType
Budget "status" -- BudgetStatus

Category "type" -- CategoryType

Report "1" -- "0..*" Transaction : analyzes >
Report "1" -- "1" User : generated for >

Recommendation "type" -- RecommendationType
Recommendation "*" -- "1" User : generated for >

@enduml
```

---

## 6. DIAGRAMA ENTIDAD-RELACIÓN (Modelo de Datos)

```
@startuml
!define table(x) class x << (T,#FFAAAA) >>
!define primary_key(x) <u>x</u>
!define foreign_key(x) <i>x</i>

hide methods
hide stereotypes

table(users) {
  primary_key(id): INTEGER
  email: VARCHAR(255) UNIQUE NOT NULL
  name: VARCHAR(255)
  password_hash: VARCHAR(255) NOT NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

table(categories) {
  primary_key(id): INTEGER
  name: VARCHAR(100) NOT NULL
  type: ENUM('INCOME', 'EXPENSE') NOT NULL
  icon: VARCHAR(50)
}

table(transactions) {
  primary_key(id): INTEGER
  foreign_key(user_id): INTEGER NOT NULL
  foreign_key(category_id): INTEGER NOT NULL
  amount: DECIMAL(10,2) NOT NULL
  description: VARCHAR(255)
  type: ENUM('INCOME', 'EXPENSE') NOT NULL
  date: DATE NOT NULL
  created_at: TIMESTAMP
}

table(budgets) {
  primary_key(id): INTEGER
  foreign_key(user_id): INTEGER NOT NULL
  name: VARCHAR(255) NOT NULL
  description: TEXT
  type: ENUM('SAVINGS_GOAL', 'PURCHASE_GOAL', 'EMERGENCY_FUND', 'VACATION', 'OTHER')
  target_amount: DECIMAL(10,2) NOT NULL
  current_amount: DECIMAL(10,2) DEFAULT 0
  target_date: DATE
  status: ENUM('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED') DEFAULT 'ACTIVE'
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

table(recurring_payments) {
  primary_key(id): INTEGER
  foreign_key(user_id): INTEGER NOT NULL
  foreign_key(category_id): INTEGER NOT NULL
  name: VARCHAR(255) NOT NULL
  description: TEXT
  amount: DECIMAL(10,2) NOT NULL
  frequency: ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL
  next_payment_date: DATE NOT NULL
  last_payment_date: DATE
  status: ENUM('ACTIVE', 'PAUSED', 'CANCELLED') DEFAULT 'ACTIVE'
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

table(ai_recommendations) {
  primary_key(id): INTEGER
  foreign_key(user_id): INTEGER NOT NULL
  title: VARCHAR(255) NOT NULL
  description: TEXT NOT NULL
  type: ENUM('WARNING', 'SUCCESS', 'INFO') NOT NULL
  priority: INTEGER DEFAULT 0
  is_read: BOOLEAN DEFAULT FALSE
  created_at: TIMESTAMP
  expires_at: TIMESTAMP
}

table(budget_transactions) {
  primary_key(id): INTEGER
  foreign_key(budget_id): INTEGER NOT NULL
  amount: DECIMAL(10,2) NOT NULL
  description: VARCHAR(255)
  created_at: TIMESTAMP
}

users "1" -- "0..*" transactions : owns
users "1" -- "0..*" budgets : manages
users "1" -- "0..*" recurring_payments : manages
users "1" -- "0..*" ai_recommendations : receives

categories "1" -- "0..*" transactions : categorizes
categories "1" -- "0..*" recurring_payments : categorizes

budgets "1" -- "0..*" budget_transactions : tracks

@enduml
```

---

## 7. DIAGRAMAS ADICIONALES

### 7.1 Diagrama de Estados - Budget

```
@startuml
[*] --> ACTIVE : create()

ACTIVE --> COMPLETED : currentAmount >= targetAmount
ACTIVE --> PAUSED : pause()
ACTIVE --> CANCELLED : cancel()

PAUSED --> ACTIVE : resume()
PAUSED --> CANCELLED : cancel()

COMPLETED --> [*]
CANCELLED --> [*]

ACTIVE : currentAmount < targetAmount
ACTIVE : Usuario puede agregar dinero
COMPLETED : Meta alcanzada
COMPLETED : currentAmount >= targetAmount
PAUSED : Temporalmente inactivo
PAUSED : No se permiten depósitos
CANCELLED : Permanentemente inactivo
CANCELLED : No se puede reactivar

@enduml
```

### 7.2 Diagrama de Estados - Recurring Payment

```
@startuml
[*] --> ACTIVE : create()

ACTIVE --> PAUSED : pause()
ACTIVE --> CANCELLED : cancel()

PAUSED --> ACTIVE : resume()
PAUSED --> CANCELLED : cancel()

CANCELLED --> [*]

ACTIVE : Se calcula en gasto mensual
ACTIVE : nextPaymentDate se actualiza
PAUSED : No se calcula en gasto mensual
PAUSED : nextPaymentDate congelado
CANCELLED : Eliminado de cálculos
CANCELLED : No se puede reactivar

@enduml
```

### 7.3 Diagrama de Actividad - Crear Transacción con Voz

```
@startuml
start

:Usuario abre página de nueva transacción;

:Usuario hace clic en botón de micrófono;

if (¿Navegador soporta Web Speech API?) then (sí)
  if (¿Permiso de micrófono concedido?) then (no)
    :Solicitar permiso de micrófono;
    if (¿Usuario concede permiso?) then (sí)
      :Iniciar reconocimiento de voz;
    else (no)
      :Mostrar mensaje de error;
      :Deshabilitar botón de voz;
      stop
    endif
  else (sí)
    :Iniciar reconocimiento de voz;
  endif

  :Sistema escucha y muestra indicador;

  :Usuario habla comando;

  :API procesa audio;

  if (¿Comando reconocido?) then (sí)
    :Parsear comando de voz;
    :Extraer tipo (ingreso/gasto);
    :Extraer monto;
    :Extraer descripción;
    :Buscar categoría relacionada;
    :Pre-llenar campos del formulario;

    if (¿Usuario confirma datos?) then (sí)
      :Enviar transacción a API;

      if (¿Guardado exitoso?) then (sí)
        :Mostrar mensaje de éxito;
        :Redirigir a lista de transacciones;
        stop
      else (no)
        if (¿Usuario está offline?) then (sí)
          :Guardar en outbox local;
          :Mostrar mensaje "Guardado offline";
          stop
        else (no)
          :Mostrar error del servidor;
          :Mantener datos en formulario;
          stop
        endif
      endif

    else (no)
      :Usuario ajusta campos manualmente;
      :Enviar transacción a API;
      stop
    endif

  else (no)
    :Mostrar error de reconocimiento;
    :Usuario puede intentar de nuevo;
    :O ingresar datos manualmente;
    stop
  endif

else (no)
  :Ocultar botón de micrófono;
  :Usuario ingresa datos manualmente;
  stop
endif

@enduml
```

### 7.4 Diagrama de Actividad - Sincronización Offline

```
@startuml
start

:Usuario crea transacción;

if (¿Hay conexión a internet?) then (sí)
  :Crear transacción temporal en UI;
  :Enviar a API;

  if (¿Respuesta exitosa?) then (sí)
    :Actualizar con ID real;
    :Mostrar mensaje de éxito;
  else (no)
    :Eliminar transacción temporal;
    :Mostrar mensaje de error;
  endif

else (no)
  :Detectar modo offline;
  :Crear transacción en UI;
  :Guardar en outboxTransactions;
  :Mostrar mensaje "Guardado offline";
endif

:Continuar usando aplicación;

if (¿Conexión recuperada?) then (sí)
  :Detectar online;
  :Llamar syncOutboxTransactions();

  while (¿Hay transacciones en outbox?) is (sí)
    :Tomar siguiente transacción;
    :Intentar enviar a API;

    if (¿Envío exitoso?) then (sí)
      :Eliminar de outbox;
      :Continuar con siguiente;
    else (no)
      :Mantener en outbox;
      :Continuar con siguiente;
    endif
  endwhile (no)

  if (¿Todas sincronizadas?) then (sí)
    :Mostrar "Sincronización completa";
    :Recargar transacciones desde servidor;
  else (no)
    :Mostrar "Algunas transacciones no se sincronizaron";
  endif
endif

stop
@enduml
```

### 7.5 Diagrama de Componentes - Arquitectura Frontend

```
@startuml
package "Frontend Application" {

  package "Pages" {
    [Dashboard]
    [Transactions]
    [NewTransaction]
    [Budgets]
    [RecurringPayments]
    [Reports]
    [Profile]
    [Login]
    [Signup]
  }

  package "Components" {
    package "Layout" {
      [Header]
      [Sidebar]
      [BottomNavigation]
      [Logo]
    }

    package "UI" {
      [Button]
      [Card]
      [Spinner]
      [ChartWrapper]
    }

    package "Auth" {
      [ProtectedRoute]
    }
  }

  package "State Management (Zustand)" {
    [authStore]
    [transactionStore]
    [budgetStore]
    [aiStore]
    [uiStore]
  }

  package "Hooks" {
    [useSpeechRecognition]
    [useOfflineDetection]
  }

  package "Utils" {
    [apiClient]
    [formatCurrency]
    [serviceWorkerRegistration]
  }

  package "External Libraries" {
    [React Router]
    [React Hook Form]
    [Chart.js]
    [Axios]
    [date-fns]
  }
}

package "External APIs" {
  [Web Speech API]
}

package "Backend Services" {
  [REST API]
  [Authentication Service]
  [AI Service]
  [Supabase]
}

[Pages] --> [Components] : uses
[Pages] --> [State Management (Zustand)] : subscribes
[Pages] --> [Hooks] : uses
[Pages] --> [External Libraries] : uses

[State Management (Zustand)] --> [Utils] : uses
[Utils] --> [Backend Services] : HTTP requests

[Hooks] --> [External APIs] : integrates
[Components] --> [External Libraries] : uses

[apiClient] --> [Axios] : uses
[ChartWrapper] --> [Chart.js] : uses
[Pages] --> [React Router] : routing
[Components] --> [React Hook Form] : form handling

@enduml
```

### 7.6 Diagrama de Despliegue

```
@startuml
node "Client Device" {
  component [Web Browser] as Browser
  component [Service Worker] as SW
  database [IndexedDB] as IDB
  database [localStorage] as LS
}

node "CDN / Static Host" {
  component [React App Bundle] as Bundle
  component [PWA Manifest] as Manifest
  component [Service Worker File] as SWFile
  component [Static Assets] as Assets
}

node "Application Server" {
  component [Node.js Backend] as Backend
  component [REST API] as API
  component [Auth Middleware] as Auth
  component [AI Service] as AI
}

node "Database Server" {
  database "Supabase PostgreSQL" as DB {
    [users]
    [transactions]
    [budgets]
    [recurring_payments]
    [categories]
    [ai_recommendations]
  }
}

cloud "External Services" {
  component [Web Speech API] as WSA
}

Browser --> SW : registers
SW --> IDB : cache responses
Browser --> LS : store auth tokens
Browser --> CDN / Static Host : HTTPS requests
CDN / Static Host --> Bundle : serves
CDN / Static Host --> Manifest : serves
CDN / Static Host --> SWFile : serves
Browser --> Backend : HTTPS/REST API calls
Backend --> API : routes to
API --> Auth : validates with
API --> AI : analyzes with
Backend --> DB : SQL queries
Browser --> WSA : uses directly

@enduml
```

---

## 8. RESUMEN Y CONCLUSIÓN

Este documento proporciona una visión completa y detallada de los casos de uso de **MoneyTalk Finance App**, incluyendo:

### Casos de Uso:
- ✅ **10 Casos de Uso** completamente detallados con flujos principales, alternativos, precondiciones, postcondiciones y excepciones

### Diagramas de Caso de Uso:
- ✅ **1 Diagrama General** del sistema completo
- ✅ **10 Diagramas Individuales** uno para cada caso de uso con subcasos incluidos

### Diagramas de Secuencia:
- ✅ **10 Diagramas de Secuencia** completos (incluyendo CU-01 con 3 variantes: login, signup, logout)
- Todos los flujos principales y alternativos documentados
- Interacciones detalladas entre componentes
- **Base de datos NO aparece como actor** - solo Backend API

### Diagramas de Robustez:
- ✅ **10 Diagramas de Robustez** uno para cada caso de uso
- Boundaries, Controls y Entities claramente identificados
- **Base de datos NO aparece como actor**

### Diagramas Complementarios:
- ✅ Diagrama de Dominio completo
- ✅ Diagrama Entidad-Relación
- ✅ Diagramas de Estados (Budget y RecurringPayment)
- ✅ Diagramas de Actividad (Voz y Sincronización Offline)
- ✅ Diagrama de Componentes
- ✅ Diagrama de Despliegue

### Características del Sistema:
El sistema **MoneyTalk Finance App** es una aplicación financiera moderna que incluye:
- Autenticación con JWT
- Gestión completa de transacciones con modo offline
- Reconocimiento de voz para entrada de datos
- Presupuestos y metas de ahorro
- Pagos recurrentes
- Dashboard con múltiples métricas
- Reportes personalizables con gráficos
- Recomendaciones inteligentes con IA
- Exportación de datos a CSV
- Gestión de perfil de usuario
- PWA con Service Worker
- Sincronización offline/online

### Correcciones Realizadas:
✅ La base de datos ya NO aparece como actor en ningún diagrama
✅ TODOS los 10 casos de uso tienen sus 3 diagramas completos (Caso de Uso, Secuencia y Robustez)
✅ Cada caso de uso tiene descripción detallada con flujos, precondiciones, postcondiciones y excepciones
