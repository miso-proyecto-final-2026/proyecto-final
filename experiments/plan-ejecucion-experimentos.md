# Plan de Ejecución — Experimentos de Arquitectura Solventa

## Semanas 6–7 · Grupo 10

---

## Visión general

Dos experimentos, una jornada compartida de 4–6 horas. Se ejecutan secuencialmente sobre el mismo namespace de staging en EKS. El Experimento 1 (HA01) va primero porque el Experimento 2 (HA02) reutiliza su infraestructura.

| | Experimento 1 — HA01 | Experimento 2 — HA02 |
|---|---|---|
| **Microservicio** | MS Cotización | MS Perfilamiento |
| **Atributo** | Latencia (RQ-L1) | Throughput (RQ-E1.2) |
| **Meta** | p95 ≤ 250 ms, p99 ≤ 500 ms | ≥ 20.000 perf./hora |
| **Duración estimada** | ~1.5 horas (2 escenarios) | ~1.5 horas (4 fases) |

---

## Fase 0 — Preparación del ambiente (antes de la jornada)

**Responsable:** Esteban Leal + Stiven Cardona
**Duración estimada:** 2–3 horas (puede hacerse el día anterior)

### Tareas

1. **Provisionar namespace de staging en EKS con Terraform**
   - Clonar el repo de infra: `miso-proyecto-final-2026/solventa-experimentos`
   - Ejecutar el script de `./scripts/setup.sh` que corre el `terraform plan` → `terraform apply` para el namespace `solventa-staging`
   - Verificar que los pods de los microservicios estén en `Running`
   - Componentes a levantar: MS Cotización, MS Perfilamiento, Redis, PostgreSQL, Mock Open Finance

2. **Construir y desplegar el Mock de Open Finance**
   - Crear un servicio stub en Python/FastAPI que acepte un parámetro de latencia
   - Endpoints:
     - `POST /open-finance/profile/{client_id}` — retorna perfil con latencia inyectada
     - `POST /open-finance/enrich/{client_id}` — retorna datos enriquecidos (Exp. 2)
     - `PUT /config/latency` — permite cambiar el rango de latencia en caliente sin redesplegar
   - **Perfiles de latencia:**
     - Normal: distribución uniforme 200–500 ms
     - Degradado: distribución uniforme 800–1500 ms
     - Base (Exp. 2): fijo 300 ms

3. **Cargar dataset de perfiles sintéticos**
   - Generar 1.000 perfiles para Exp. 1 (con campos: client_id, nombre, datos financieros mock)
   - Extender a 5.000 cliente_id con consentimientos para Exp. 2
   - Cargar en el mock y verificar que responde correctamente

4. **Configurar MS Cotización**
   - Verificar que el patrón cache-aside esté implementado con redis-py
   - Verificar circuit breaker con pybreaker (timeout: 700 ms, umbral: 5 fallos)
   - Verificar que la tabla Log_Latencia esté creada en PostgreSQL (campos: cotización_id, tiempo_total_ms, tiempo_cache_ms, tiempo_open_finance_ms, tiempo_rating_ms, tiempo_pg_ms, hit_cache, timestamp)
   - Verificar degradación controlada: que ante circuit breaker abierto, se use valor cacheado o default

5. **Configurar MS Perfilamiento**
   - Verificar cache-aside con TTL de 15 min
   - Configurar manifiesto HPA: min 2, max 10, CPU target 70%
   - Instalar kube-metrics-server si no está

6. **Preparar scripts de carga k6**
   - Script 1 — Cotización:
     ```
     Rampa: 500 → 5.000 sol/min en 15 min
     Meseta: 5.000 sol/min durante 10 min
     ```
   - Script 2 — Perfilamiento:
     ```
     Fase 1 (Rampa): 0 → 20.000 perf./hora en 20 min
     Fase 2 (Meseta): 20.000 perf./hora durante 30 min
     Fase 3 (Sobrecarga): 25.000 perf./hora durante 10 min
     Fase 4 (Recuperación): apagar generador, medir recuperación
     ```

7. **Configurar observabilidad**
   - Instrumentar con OpenTelemetry (spans por etapa: cache, open_finance, rating, pg)
   - Crear dashboards en Grafana:
     - Dashboard Exp. 1: percentiles p50/p95/p99 en tiempo real, hit rate, estado circuit breaker
     - Dashboard Exp. 2: throughput vs. objetivo, réplicas HPA, CPU/mem por pod

8. **Checklist de verificación pre-ejecución**
   - [ ] Namespace levantado y pods en Running
   - [ ] Mock responde en latencia esperada (probar con curl)
   - [ ] Dataset cargado (verificar con request de prueba)
   - [ ] Log_Latencia registra correctamente (ejecutar 1 cotización manual)
   - [ ] k6 conecta al endpoint (dry run con 10 requests)
   - [ ] Grafana muestra métricas (verificar que los dashboards muestran datos)
   - [ ] Circuit breaker configurado (verificar en logs con 1 request con timeout forzado)
   - [ ] HPA configurado (verificar con `kubectl get hpa`)

---

## Fase 1 — Ejecución del Experimento 1 (HA01 — Latencia)

**Responsable principal:** Esteban Leal
**Apoyo:** Stiven (mock), Andrés (observabilidad), Juan Manuel (análisis)
**Duración estimada:** 1.5 horas

### Paso 1.1 — Escenario A: Operación normal (~40 min)

1. Verificar que Redis esté limpio (`FLUSHALL` en el namespace de staging)
2. Configurar mock en latencia normal: `PUT /config/latency {"min_ms": 200, "max_ms": 500}`
3. Iniciar captura en Grafana (anotar timestamp de inicio)
4. Ejecutar script k6 del Escenario A:
   - Rampa: 15 min (500 → 5.000 sol/min)
   - Meseta: 10 min (5.000 sol/min)
5. Al terminar k6, anotar timestamp de fin
6. **Capturar evidencia inmediatamente:**
   - Screenshot del dashboard de Grafana (p50/p95/p99)
   - Exportar resumen de k6 (`k6 run --out json=exp1-esc-a.json`)
   - Query al Log_Latencia: `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY tiempo_total_ms) as p50, percentile_cont(0.95) ... FROM log_latencia WHERE timestamp BETWEEN ...`

### Paso 1.2 — Escenario B: Operación degradada (~40 min)

1. Limpiar caché de Redis (`FLUSHALL`)
2. Reconfigurar mock: `PUT /config/latency {"min_ms": 800, "max_ms": 1500}`
3. Anotar timestamp de inicio
4. Ejecutar mismo script k6 (rampa + meseta)
5. **Observar en tiempo real:**
   - ¿Cuándo se abre el circuit breaker? (anotar timestamp exacto)
   - ¿Se activa la degradación? (verificar en logs de MS Cotización)
   - ¿Hay cotizaciones fallidas? (debería ser 0%)
6. Al terminar k6, anotar timestamp
7. **Capturar evidencia:**
   - Screenshot Grafana (p50/p95/p99 + estado circuit breaker)
   - Exportar k6 (`exp1-esc-b.json`)
   - Query al Log_Latencia para el período del Escenario B

### Paso 1.3 — Recopilar datos para el informe (~15 min)

1. Exportar datos brutos del Log_Latencia (CSV)
2. Calcular la descomposición de latencia por etapa:
   - Promediar tiempo_cache_ms, tiempo_open_finance_ms, tiempo_rating_ms, tiempo_pg_ms
   - Calcular percentiles por etapa
3. Calcular hit rate de caché (COUNT WHERE hit_cache = true / COUNT total)
4. Guardar todos los screenshots y exports en la carpeta del equipo en Drive

---

## Fase 2 — Ejecución del Experimento 2 (HA02 — Throughput)

**Responsable principal:** Juan Manuel Domínguez
**Apoyo:** Esteban (mock), Andrés (observabilidad), Stiven (ADR)
**Duración estimada:** 1.5 horas

### Paso 2.1 — Verificar ambiente incremental (~10 min)

1. Verificar que MS Perfilamiento esté desplegado con HPA configurado
2. Verificar kube-metrics-server: `kubectl top pods -n solventa-staging`
3. Verificar HPA: `kubectl get hpa -n solventa-staging`
4. Reconfigurar mock a latencia base para Exp. 2: `PUT /config/latency {"min_ms": 300, "max_ms": 300}`
5. Extender endpoints del mock para `/open-finance/enrich/` si no se hizo en Fase 0
6. Limpiar caché de Redis

### Paso 2.2 — Ejecutar las 4 fases (~80 min)

1. Anotar timestamp de inicio, iniciar captura en Grafana
2. **Fase 1 — Rampa (20 min):** ejecutar k6 con ramp-up de 0 → 333 req/min (~20.000/hora)
   - Observar: ¿cuántas réplicas crea el HPA durante la rampa?
   - Anotar p95 al final de la rampa como **línea base**
3. **Fase 2 — Meseta (30 min):** k6 a 333 req/min sostenidos
   - Observar: ¿se estabiliza el HPA? ¿En cuántos pods?
   - Observar: ¿el hit de caché supera 40%?
   - Observar: ¿CPU/mem por pod se mantiene estable?
4. **Fase 3 — Sobrecarga (10 min):** k6 sube a 417 req/min (~25.000/hora)
   - Observar: ¿cuántas réplicas nuevas crea el HPA?
   - Observar: ¿hay cola creciente o requests que se pierden?
5. **Fase 4 — Recuperación:** apagar k6
   - Medir: ¿cuánto tarda el p95 en volver a la línea base?
   - Medir: ¿cuánto tarda el HPA en reducir réplicas?

### Paso 2.3 — Recopilar datos para el informe (~15 min)

1. Screenshot de Grafana para cada fase (throughput, réplicas, CPU/mem)
2. Exportar resumen de k6 (`exp2.json`)
3. Registro del HPA: `kubectl describe hpa -n solventa-staging` (guardar output)
4. Verificar si hubo OOMKilled: `kubectl get events -n solventa-staging --field-selector reason=OOMKilled`
5. Guardar todo en Drive

---

## Fase 3 — Análisis y llenado del informe (post-jornada)

**Responsable:** Todo el equipo
**Duración estimada:** 2–3 horas

### Tareas

1. **Llenar la plantilla del informe** con los datos reales capturados
2. **Para cada experimento, responder:**
   - ¿Se cumplieron las metas? (llenar la columna "Veredicto" en cada tabla)
   - ¿Por qué sí o por qué no? (sección de análisis — no solo números, explicar las causas)
   - ¿Qué observaciones ameritan atención? (puntos de atención)
   - ¿Se valida o refuta la hipótesis? (veredicto final)
3. **Completar la síntesis consolidada (Sección 4):**
   - ¿Los modelos de arquitectura necesitan ajuste?
   - ¿Qué acciones concretas van para la Semana 7?
4. **Insertar evidencias:** capturas de Grafana, referencias a exports de k6

---

## Fase 4 — Apagado y limpieza

1. Apagar el namespace de staging: `terraform destroy`
2. Verificar que no queden recursos huérfanos en AWS
3. Actualizar el tablero de GitHub:
   - Cerrar/actualizar issues HA01 y HA02 con enlace a las evidencias
   - Mover stories al estado correspondiente

---

## Distribución de responsabilidades

| Integrante | Fase 0 (Prep) | Fase 1 (Exp. 1) | Fase 2 (Exp. 2) | Fase 3 (Análisis) |
|---|---|---|---|---|
| **Esteban Leal** | Infra Terraform + cache/CB | Responsable principal | Apoyo mock | Análisis Exp. 1 |
| **Stiven Cardona** | Mock Open Finance + ADR | Apoyo mock | Apoyo ADR | Síntesis + informe |
| **Andrés E. Gómez** | OpenTelemetry + Grafana | Dashboards | Dashboards | Gráficas + evidencias |
| **Juan Manuel D.** | Scripts k6 + dataset | Apoyo análisis | Responsable principal | Análisis Exp. 2 |

---

## Timeline sugerido

### Día 1 (preparación) — Jueves
- 14:00–17:00: Fase 0 completa (todos)
- 17:00: Checklist de verificación pre-ejecución completado

### Día 2 (ejecución) — Viernes
- 14:00–14:15: Último check del ambiente
- 14:15–15:45: Fase 1 — Experimento 1 (Esteban lidera)
- 15:45–16:00: Break + reconfigurar mock
- 16:00–17:30: Fase 2 — Experimento 2 (Juan Manuel lidera)
- 17:30–18:00: Fase 4 — Apagado + respaldo de evidencias

### Día 3 (análisis) — Sábado/Domingo
- Fase 3 — Cada responsable llena su sección del informe
- Stiven consolida la síntesis y sube a Drive

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Namespace no levanta | Baja | Alto | Preparar en Día 1; tener plan B con Docker Compose local |
| Mock no inyecta latencia correctamente | Media | Alto | Probar con curl antes de k6; tener script de verificación |
| k6 no genera la carga esperada | Baja | Medio | Dry run con 10 requests; verificar que la máquina de k6 tenga recursos |
| Grafana no captura métricas | Media | Medio | Verificar instrumentación OpenTelemetry con request manual |
| Créditos AWS insuficientes | Baja | Alto | Calcular costo estimado antes; usar instancias mínimas en staging |
| HPA no escala (Exp. 2) | Media | Alto | Verificar kube-metrics-server + manifiesto HPA antes de ejecutar |
