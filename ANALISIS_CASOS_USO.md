# Análisis de Casos de Uso - MoneyTalk Finance App

## 1. CASOS DE USO IDENTIFICADOS

### CU-01: Gestión de Autenticación
**Actores:** Usuario
**Descripción:** Permite al usuario registrarse, iniciar sesión y cerrar sesión en la aplicación.

### CU-02: Gestionar Transacciones
**Actores:** Usuario, Sistema
**Descripción:** Crear, editar, eliminar y visualizar transacciones financieras (ingresos y gastos).

### CU-03: Crear Transacción con Voz
**Actores:** Usuario, Sistema de Reconocimiento de Voz
**Descripción:** Permite al usuario crear transacciones usando comandos de voz.

### CU-04: Gestionar Presupuestos
**Actores:** Usuario
**Descripción:** Crear, editar, eliminar y monitorear presupuestos y metas de ahorro.

### CU-05: Gestionar Pagos Recurrentes
**Actores:** Usuario, Sistema
**Descripción:** Administrar suscripciones y pagos automáticos recurrentes.

### CU-06: Visualizar Dashboard
**Actores:** Usuario, Sistema
**Descripción:** Ver resumen financiero del día, saldos y recomendaciones.

### CU-07: Generar Reportes
**Actores:** Usuario
**Descripción:** Visualizar gráficos y análisis de patrones financieros por períodos.

### CU-08: Obtener Recomendaciones IA
**Actores:** Usuario, Sistema de IA
**Descripción:** Recibir recomendaciones inteligentes basadas en patrones de gasto.

### CU-09: Exportar Datos
**Actores:** Usuario
**Descripción:** Exportar transacciones a formato CSV.

### CU-10: Actualizar Perfil
**Actores:** Usuario
**Descripción:** Modificar información personal del usuario.

---

## 2. DIAGRAMAS DE CASO DE USO

### Diagrama General del Sistema

\`\`\`
@startuml
left to right direction
skinparam packageStyle rectangle

actor Usuario as U
actor "Sistema IA" as IA
actor "API Reconocimiento Voz" as VR

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
    (Filtrar Transacciones) as FILTER_T
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
    (CU-08: Obtener Recomendaciones IA) as AI_REC

    DASH ..> DAILY : <<include>>
    DASH ..> WEEKLY : <<include>>
    DASH ..> AI_REC : <<include>>
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

VR --> VOICE
IA --> AI_REC

@enduml
\`\`\`

---

## 3. DIAGRAMAS DE SECUENCIA

### CU-01: Iniciar Sesión

\`\`\`
@startuml
actor Usuario
participant "Login Page" as LP
participant "Auth Store" as AS
participant "API Client" as AC
participant "Backend API" as API
database "Database" as DB

Usuario -> LP: Ingresa credenciales
LP -> AS: login(email, password)
AS -> AC: POST /auth/login
AC -> API: {email, password}
API -> DB: Verificar credenciales
DB --> API: Usuario válido
API --> AC: {user, accessToken, refreshToken}
AC --> AS: response.data
AS -> AS: Guardar token y usuario
AS --> LP: isAuthenticated = true
LP --> Usuario: Redirigir a /dashboard

@enduml
\`\`\`

### CU-02: Crear Transacción

\`\`\`
@startuml
actor Usuario
participant "New Transaction Page" as NTP
participant "Transaction Store" as TS
participant "API Client" as AC
participant "Backend API" as API
database "Database" as DB

Usuario -> NTP: Completa formulario
Usuario -> NTP: Click "Guardar"
NTP -> TS: addTransaction(data)
TS -> TS: Crear transacción temporal
TS -> AC: POST /transactions
AC -> API: {amount, description, category, type, date}
API -> DB: INSERT INTO transactions
DB --> API: Transaction created (id: 123)
API --> AC: response.data
AC --> TS: {id, ...data}
TS -> TS: Actualizar transacción temporal con ID real
TS --> NTP: Success
NTP --> Usuario: Mostrar mensaje "Transacción agregada"
NTP --> Usuario: Redirigir a /transactions

@enduml
\`\`\`

### CU-03: Crear Transacción con Voz

\`\`\`
@startuml
actor Usuario
participant "New Transaction Page" as NTP
participant "Speech Recognition Hook" as SRH
participant "Web Speech API" as WSA
participant "Transaction Store" as TS
participant "Backend API" as API

Usuario -> NTP: Click botón de micrófono
NTP -> SRH: startListening()
SRH -> WSA: startRecognition()
WSA --> SRH: Listening...
Usuario -> WSA: Habla: "Compré comida por 50 bolivianos"
WSA -> SRH: onResult(transcript)
SRH -> SRH: Parsear comando de voz
SRH -> NTP: Llenar campos automáticamente
NTP --> Usuario: Mostrar campos prellenados
Usuario -> NTP: Confirma o ajusta datos
NTP -> TS: addTransaction(data)
TS -> API: POST /transactions
API --> TS: Success
TS --> NTP: Transaction added
NTP --> Usuario: "Transacción creada exitosamente"

@enduml
\`\`\`

### CU-04: Gestionar Presupuestos

\`\`\`
@startuml
actor Usuario
participant "Budgets Page" as BP
participant "Budget Store" as BS
participant "API Client" as AC
participant "Backend API" as API
database "Database" as DB

Usuario -> BP: Click "Nuevo Presupuesto"
BP -> Usuario: Mostrar formulario
Usuario -> BP: Completa datos del presupuesto
Usuario -> BP: Click "Crear"
BP -> BS: addBudget(data)
BS -> AC: POST /budgets
AC -> API: {name, type, targetAmount, targetDate}
API -> DB: INSERT INTO budgets
DB --> API: Budget created
API --> AC: response.data
AC --> BS: {id, currentAmount: 0, ...data}
BS -> BS: Agregar a lista de presupuestos
BS --> BP: Success
BP --> Usuario: Mostrar nuevo presupuesto

Usuario -> BP: Click "Agregar Dinero"
BP -> Usuario: Mostrar input de monto
Usuario -> BP: Ingresa cantidad
BP -> BS: addToBudget(budgetId, amount)
BS -> AC: POST /budgets/:id/add
AC -> API: {amount}
API -> DB: UPDATE budgets SET currentAmount
DB --> API: Updated
API --> AC: Success
AC --> BS: Updated budget
BS -> BS: Actualizar currentAmount
BS --> BP: Success
BP --> Usuario: "Monto agregado al presupuesto"

@enduml
\`\`\`

### CU-06: Visualizar Dashboard

\`\`\`
@startuml
actor Usuario
participant "Dashboard Page" as DP
participant "Transaction Store" as TS
participant "Budget Store" as BS
participant "AI Store" as AIS
participant "Backend API" as API

Usuario -> DP: Accede al dashboard
DP -> TS: fetchTransactions()
DP -> BS: fetchBudgets()
DP -> BS: fetchRecurringPayments()
DP -> AIS: fetchRecommendations()

par Llamadas paralelas a API
  TS -> API: GET /transactions
  API --> TS: transactions[]

  BS -> API: GET /budgets
  API --> BS: budgets[]

  BS -> API: GET /recurring-payments
  API --> BS: recurringPayments[]

  AIS -> API: GET /ai/recommendations
  API --> AIS: recommendations[]
end

TS -> TS: getTodaysSummary()
TS --> DP: {income, expense, net}

BS -> BS: getTotalBudgetAllocations()
BS --> DP: totalBudgetAllocations

BS -> BS: getTotalRecurringPayments()
BS --> DP: totalRecurringPayments

BS -> BS: getAvailableBalance()
BS --> DP: availableBalance

TS -> TS: getWeeklyData()
TS --> DP: {labels, income[], expense[]}

DP --> Usuario: Renderizar dashboard completo
DP --> Usuario: Mostrar tarjetas de resumen
DP --> Usuario: Mostrar gráficos
DP --> Usuario: Mostrar recomendaciones IA
DP --> Usuario: Mostrar transacciones recientes

@enduml
\`\`\`

### CU-07: Generar Reportes

\`\`\`
@startuml
actor Usuario
participant "Reports Page" as RP
participant "Transaction Store" as TS

Usuario -> RP: Accede a reportes
RP -> TS: fetchTransactions()
TS --> RP: transactions[]
RP -> RP: Filtrar por rango "thisMonth"
RP --> Usuario: Mostrar reportes mensuales

Usuario -> RP: Selecciona rango "custom"
RP --> Usuario: Mostrar inputs de fecha
Usuario -> RP: Selecciona desde/hasta
RP -> RP: filterTransactions(from, to)
RP -> RP: calculateTotals()
RP -> RP: groupByCategory()
RP -> RP: getMonthlyData()
RP --> Usuario: Actualizar gráficos
RP --> Usuario: Actualizar estadísticas
RP --> Usuario: Mostrar categorías principales

Usuario -> RP: Click "Actualizar Datos"
RP -> TS: fetchTransactions()
TS --> RP: transactions[] actualizadas
RP -> RP: Recalcular métricas
RP --> Usuario: Datos actualizados

@enduml
\`\`\`

### CU-08: Obtener Recomendaciones IA

\`\`\`
@startuml
actor Usuario
participant "Dashboard Page" as DP
participant "AI Store" as AIS
participant "Backend API" as API
participant "AI Service" as AI_SVC
database "Cache" as CACHE

Usuario -> DP: Visualiza dashboard
DP -> AIS: fetchRecommendations()
AIS -> AIS: Verificar cache (15 min)

alt Cache válido
  AIS --> DP: recommendations[] (desde cache)
else Cache expirado o vacío
  AIS -> API: GET /ai/recommendations
  API -> AI_SVC: Analizar patrones de usuario
  AI_SVC -> AI_SVC: Calcular recomendaciones
  AI_SVC --> API: recommendations[]
  API --> AIS: response.data
  AIS -> CACHE: Guardar en cache
  AIS --> DP: recommendations[]
end

DP --> Usuario: Mostrar recomendaciones
note right: Tipos: warning, success, info

@enduml
\`\`\`

### CU-09: Exportar Datos

\`\`\`
@startuml
actor Usuario
participant "Transactions Page" as TP
participant "Browser" as BR

Usuario -> TP: Aplica filtros opcionales
Usuario -> TP: Click "Exportar"
TP -> TP: filteredTransactions
TP -> TP: Crear headers CSV
TP -> TP: Convertir transactions a CSV
TP -> TP: Crear Blob con contenido CSV
TP -> TP: Crear URL temporal
TP -> BR: Crear elemento <a> download
BR -> BR: Trigger click automático
BR --> Usuario: Descargar archivo "transacciones-YYYY-MM-DD.csv"
TP -> TP: Limpiar URL temporal

@enduml
\`\`\`

---

## 4. DIAGRAMAS DE ROBUSTEZ

### CU-02: Gestionar Transacciones

\`\`\`
@startuml
actor Usuario

boundary "Transactions Page" as TP
boundary "New Transaction Page" as NTP
boundary "Transaction Form" as TF

control "Transaction Store" as TS
control "API Client" as AC

entity "Transaction" as T
entity "Category" as C
database "Backend API" as API

Usuario -> TP : Ver lista
TP -> TS : fetchTransactions()
TS -> AC : GET /transactions
AC -> API : Request
API --> AC : transactions[]
AC --> TS : Response
TS --> TP : Display
TP --> Usuario : Mostrar transacciones

Usuario -> TP : Click "Nueva Transacción"
TP -> NTP : Navigate
NTP --> Usuario : Show form

Usuario -> TF : Completar datos
TF -> TF : Validar campos
Usuario -> TF : Submit
TF -> TS : addTransaction(data)
TS -> T : Create temp transaction
TS -> AC : POST /transactions
AC -> API : {data}
API -> T : INSERT
API --> AC : {id, ...data}
AC --> TS : Response
TS -> T : Update with real ID
TS --> NTP : Success
NTP --> Usuario : Confirmation

Usuario -> TP : Click editar
TP -> TF : Load transaction
TF --> Usuario : Show edit form
Usuario -> TF : Modify & Submit
TF -> TS : updateTransaction(id, data)
TS -> AC : PUT /transactions/:id
AC -> API : {data}
API -> T : UPDATE
API --> AC : Success
AC --> TS : Updated
TS --> TP : Refresh
TP --> Usuario : Show updated

Usuario -> TP : Click eliminar
TP -> TS : deleteTransaction(id)
TS -> AC : DELETE /transactions/:id
AC -> API : Delete request
API -> T : DELETE
API --> AC : Success
AC --> TS : Deleted
TS --> TP : Remove from list
TP --> Usuario : Confirmation

@enduml
\`\`\`

### CU-04: Gestionar Presupuestos

\`\`\`
@startuml
actor Usuario

boundary "Budgets Page" as BP
boundary "Budget Form" as BF

control "Budget Store" as BS
control "API Client" as AC

entity "Budget" as B
database "Backend API" as API

Usuario -> BP : Acceder a presupuestos
BP -> BS : fetchBudgets()
BS -> AC : GET /budgets
AC -> API : Request
API --> AC : budgets[]
AC --> BS : Response
BS --> BP : Display
BP --> Usuario : Mostrar presupuestos y métricas

Usuario -> BP : Click "Nuevo Presupuesto"
BP -> BF : Show form
BF --> Usuario : Display form

Usuario -> BF : Ingresar datos
BF -> BF : Validar campos
Usuario -> BF : Submit
BF -> BS : addBudget(data)
BS -> AC : POST /budgets
AC -> API : {name, type, targetAmount, targetDate}
API -> B : INSERT (currentAmount=0)
API --> AC : {id, ...data}
AC --> BS : Response
BS -> B : Add to store
BS --> BP : Update list
BP --> Usuario : Mostrar nuevo presupuesto

Usuario -> BP : Click "Agregar Dinero"
BP --> Usuario : Show input
Usuario -> BP : Ingresar monto
BP -> BS : addToBudget(id, amount)
BS -> AC : POST /budgets/:id/add
AC -> API : {amount}
API -> B : UPDATE currentAmount += amount
API --> AC : Success
AC --> BS : Updated
BS -> B : Update in store
BS --> BP : Refresh progress
BP --> Usuario : Mostrar progreso actualizado

@enduml
\`\`\`

### CU-06: Visualizar Dashboard

\`\`\`
@startuml
actor Usuario

boundary "Dashboard Page" as DP
boundary "Summary Cards" as SC
boundary "Chart Components" as CC
boundary "Recommendations" as RC

control "Transaction Store" as TS
control "Budget Store" as BS
control "AI Store" as AIS

entity "Transaction" as T
entity "Budget" as B
entity "RecurringPayment" as RP
entity "Recommendation" as REC

database "Backend API" as API

Usuario -> DP : Accede al dashboard

DP -> TS : fetchTransactions()
DP -> BS : fetchBudgets()
DP -> BS : fetchRecurringPayments()
DP -> AIS : fetchRecommendations()

TS -> API : GET /transactions
API -> T : SELECT
API --> TS : transactions[]

BS -> API : GET /budgets
API -> B : SELECT
API --> BS : budgets[]

BS -> API : GET /recurring-payments
API -> RP : SELECT
API --> BS : recurringPayments[]

AIS -> API : GET /ai/recommendations
API -> REC : ANALYZE & SELECT
API --> AIS : recommendations[]

TS -> TS : getTodaysSummary()
TS -> TS : getWeeklyData()
BS -> BS : getTotalBudgetAllocations()
BS -> BS : getTotalRecurringPayments()
BS -> BS : getAvailableBalance()

DP -> SC : Render summary
SC --> Usuario : Mostrar métricas diarias

DP -> CC : Render charts
CC --> Usuario : Mostrar gráficos semanales

DP -> RC : Render AI recommendations
RC --> Usuario : Mostrar recomendaciones

DP --> Usuario : Dashboard completo

@enduml
\`\`\`

### CU-07: Generar Reportes

\`\`\`
@startuml
actor Usuario

boundary "Reports Page" as RP
boundary "Date Range Selector" as DRS
boundary "Charts" as CH
boundary "Statistics Cards" as SC

control "Transaction Store" as TS
control "Report Calculator" as RC

entity "Transaction" as T
entity "FilteredTransactions" as FT

Usuario -> RP : Accede a reportes
RP -> TS : fetchTransactions()
TS --> RP : transactions[]
RP -> RC : Filter by default range
RC -> FT : thisMonth
RC --> RP : filteredTransactions
RP -> SC : Display totals
RP -> CH : Display charts
SC --> Usuario : Mostrar métricas
CH --> Usuario : Mostrar gráficos

Usuario -> DRS : Seleccionar rango
DRS -> RC : Apply filter
RC -> T : Filter by date range
RC -> RC : Calculate totals
RC -> RC : Group by category
RC -> RC : Get monthly data
RC -> FT : Update filtered data
RC --> RP : Updated metrics
RP -> SC : Update cards
RP -> CH : Update charts
SC --> Usuario : Métricas actualizadas
CH --> Usuario : Gráficos actualizados

Usuario -> RP : Click "Actualizar"
RP -> TS : fetchTransactions()
TS --> RP : Fresh data
RP -> RC : Recalculate
RC --> RP : Updated
RP --> Usuario : Datos actualizados

@enduml
\`\`\`

---

## 5. DIAGRAMA DE DOMINIO

\`\`\`
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
\`\`\`

---

## 6. DIAGRAMA ENTIDAD-RELACIÓN (Modelo de Datos)

\`\`\`
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
\`\`\`

---

## 7. MODELO CONCEPTUAL ADICIONAL

### 7.1 Diagrama de Estados - Budget

\`\`\`
@startuml
[*] --> ACTIVE : create()

ACTIVE --> COMPLETED : targetAmount reached
ACTIVE --> PAUSED : pause()
ACTIVE --> CANCELLED : cancel()

PAUSED --> ACTIVE : resume()
PAUSED --> CANCELLED : cancel()

COMPLETED --> [*]
CANCELLED --> [*]

ACTIVE : currentAmount < targetAmount
COMPLETED : currentAmount >= targetAmount
PAUSED : Temporarily inactive
CANCELLED : Permanently inactive

@enduml
\`\`\`

### 7.2 Diagrama de Actividad - Crear Transacción con Voz

\`\`\`
@startuml
start

:Usuario abre página de nueva transacción;

:Usuario hace clic en botón de micrófono;

:Iniciar reconocimiento de voz;

:Usuario habla comando;

if (¿Comando reconocido?) then (sí)
  :Parsear comando de voz;
  :Extraer monto, descripción, tipo;
  :Pre-llenar campos del formulario;

  if (¿Usuario confirma datos?) then (sí)
    :Enviar transacción a API;

    if (¿Guardado exitoso?) then (sí)
      :Mostrar mensaje de éxito;
      :Redirigir a lista de transacciones;
    else (no)
      if (¿Usuario está offline?) then (sí)
        :Guardar en outbox;
        :Mostrar mensaje "Guardado offline";
      else (no)
        :Mostrar error;
        :Mantener datos en formulario;
      endif
    endif

  else (no)
    :Usuario ajusta campos manualmente;
    :Enviar transacción a API;
  endif

else (no)
  :Mostrar error de reconocimiento;
  :Usuario ingresa datos manualmente;
endif

stop
@enduml
\`\`\`

### 7.3 Diagrama de Componentes - Arquitectura Frontend

\`\`\`
@startuml
package "Frontend Application" {

  package "Pages" {
    [Dashboard]
    [Transactions]
    [Budgets]
    [Reports]
    [RecurringPayments]
    [Profile]
    [Login/Signup]
  }

  package "Components" {
    [Header]
    [Sidebar]
    [Cards]
    [Charts]
    [Forms]
    [Buttons]
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

  package "External APIs" {
    [Web Speech API]
    [Chart.js]
  }
}

package "Backend API" {
  [REST API Endpoints]
  [Authentication]
  [Database]
}

[Pages] --> [Components] : uses
[Pages] --> [State Management (Zustand)] : subscribes
[State Management (Zustand)] --> [Utils] : uses
[Utils] --> [Backend API] : HTTP requests
[Hooks] --> [External APIs] : integrates
[Pages] --> [Hooks] : uses

@enduml
\`\`\`

### 7.4 Diagrama de Despliegue

\`\`\`
@startuml
node "Client Device" {
  [Web Browser]
  [Service Worker]
  [IndexedDB]
}

node "Web Server" {
  [Vite Dev Server / Static Host]
  [React App Bundle]
  [PWA Manifest]
}

node "Application Server" {
  [Node.js / Express Backend]
  [REST API]
  [Authentication Middleware]
  [AI Service]
}

node "Database Server" {
  database "PostgreSQL / MySQL" {
    [users]
    [transactions]
    [budgets]
    [recurring_payments]
    [categories]
  }
}

node "External Services" {
  [Web Speech API]
}

[Web Browser] --> [Service Worker] : registers
[Service Worker] --> [IndexedDB] : cache
[Web Browser] --> [Vite Dev Server / Static Host] : HTTPS
[Vite Dev Server / Static Host] --> [React App Bundle] : serves
[Web Browser] --> [Node.js / Express Backend] : HTTPS/REST
[Node.js / Express Backend] --> [PostgreSQL / MySQL] : SQL
[Web Browser] --> [Web Speech API] : Browser API

@enduml
\`\`\`

---

## 8. ESPECIFICACIONES TÉCNICAS POR CASO DE USO

### CU-01: Gestión de Autenticación
- **Tecnología:** JWT (JSON Web Tokens)
- **Endpoints:**
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  - PUT /api/auth/profile
- **Almacenamiento:** Zustand persist con localStorage
- **Seguridad:** Tokens almacenados en estado, autoexpiración

### CU-02: Gestionar Transacciones
- **Endpoints:**
  - GET /api/transactions (paginado)
  - POST /api/transactions
  - PUT /api/transactions/:id
  - DELETE /api/transactions/:id
- **Validaciones:** React Hook Form
- **Filtros:** Por tipo, categoría, rango de fechas
- **Paginación:** 10 items por página

### CU-03: Crear Transacción con Voz
- **API:** Web Speech API (window.webkitSpeechRecognition)
- **Idioma:** Español (es-ES)
- **Procesamiento:** Parser de comandos de voz local
- **Fallback:** Input manual si falla reconocimiento

### CU-04: Gestionar Presupuestos
- **Endpoints:**
  - GET /api/budgets
  - POST /api/budgets
  - PUT /api/budgets/:id
  - DELETE /api/budgets/:id
  - POST /api/budgets/:id/add
- **Cálculos:**
  - Progreso porcentual
  - Asignación mensual basada en target date
  - Balance disponible después de presupuestos

### CU-05: Gestionar Pagos Recurrentes
- **Endpoints:**
  - GET /api/recurring-payments
  - POST /api/recurring-payments
  - PUT /api/recurring-payments/:id
  - DELETE /api/recurring-payments/:id
- **Frecuencias:** Diario, Semanal, Mensual, Anual
- **Cálculo:** Conversión a monto mensual equivalente

### CU-06: Visualizar Dashboard
- **Agregaciones:**
  - Resumen diario (ingresos, gastos, neto)
  - Datos semanales (últimos 7 días)
  - Balance disponible
  - Presupuestos activos
- **Gráficos:** Chart.js (Line chart)
- **Actualización:** Automática al cargar

### CU-07: Generar Reportes
- **Rangos:** Últimos 7/30 días, mes actual/anterior, año, personalizado
- **Métricas:**
  - Totales por período
  - Distribución por categoría
  - Comparativa mensual
  - Top 5 categorías de gastos
- **Gráficos:** Pie chart y Bar chart

### CU-08: Obtener Recomendaciones IA
- **Endpoint:** GET /api/ai/recommendations
- **Cache:** 15 minutos en el cliente
- **Tipos:** Warning, Success, Info
- **Generación:** Análisis de patrones de usuario en backend

### CU-09: Exportar Datos
- **Formato:** CSV
- **Encoding:** UTF-8 con BOM
- **Campos:** Fecha, Descripción, Categoría, Tipo, Monto
- **Implementación:** Client-side con Blob API

### CU-10: Actualizar Perfil
- **Endpoint:** PUT /api/auth/profile
- **Campos:** name, email
- **Validación:** Email único

---

## 9. FLUJOS CRÍTICOS

### Flujo de Autenticación
1. Usuario ingresa credenciales
2. Sistema valida contra base de datos
3. Backend genera JWT con expiración
4. Cliente almacena token en Zustand + localStorage
5. Token se incluye en todas las peticiones subsecuentes
6. Si token expira (401), redirigir a login

### Flujo de Sincronización Offline
1. Usuario crea transacción sin conexión
2. Sistema detecta offline
3. Transacción se guarda en outboxTransactions (Zustand)
4. Al recuperar conexión
5. Sistema llama syncOutboxTransactions()
6. Intenta enviar cada transacción pendiente
7. Si éxito, elimina de outbox
8. Si falla, mantiene en outbox

### Flujo de Actualización de Presupuestos
1. Usuario agrega dinero a presupuesto
2. Sistema actualiza currentAmount
3. Si currentAmount >= targetAmount
4. Cambiar status a COMPLETED
5. Disparar notificación al usuario
6. Recalcular balance disponible

---

## 10. CONSIDERACIONES DE SEGURIDAD

### Autenticación y Autorización
- JWT con expiración de 24 horas
- RefreshToken para renovación silenciosa
- Passwords hasheados con bcrypt (backend)
- Validación de usuario en cada endpoint protegido

### Protección de Datos
- HTTPS obligatorio en producción
- Sanitización de inputs en frontend y backend
- Prevención de SQL Injection (prepared statements)
- Rate limiting en endpoints críticos

### Privacidad
- Cada usuario solo accede a sus propios datos
- Validación de user_id en todas las operaciones
- No se comparten datos entre usuarios
- Logs de auditoría en operaciones críticas

---

## CONCLUSIÓN

Este documento proporciona una visión completa de los casos de uso de MoneyTalk Finance App, incluyendo:

- ✅ **10 Casos de Uso** principales identificados
- ✅ **Diagrama de Caso de Uso** general del sistema
- ✅ **9 Diagramas de Secuencia** detallados
- ✅ **4 Diagramas de Robustez** para casos críticos
- ✅ **Diagrama de Dominio** completo
- ✅ **Diagrama Entidad-Relación** (modelo de datos)
- ✅ Diagramas adicionales: Estados, Actividad, Componentes, Despliegue
- ✅ Especificaciones técnicas por caso de uso
- ✅ Flujos críticos del sistema
- ✅ Consideraciones de seguridad

El sistema está diseñado como una aplicación financiera moderna con soporte offline, reconocimiento de voz, y análisis inteligente mediante IA.
