# Luque Business Summit — catálogo demo T3

**Uso interno · evidencia local únicamente · datos sintéticos.** Este catálogo selecciona exactamente cuatro candidatos. “Funcional” significa que la evidencia local permite ejecutar o inspeccionar el flujo sin depender de un servicio externo; “prototype” significa que hay artefactos demostrables, pero no una verificación de producto vigente; “blocked” significa que la evidencia no permite una demo segura localmente.

## 1. Diagnóstico de crecimiento y sistema comercial

- **Fuente:** `trabajo/monoga/proyectos/sales-engine/01_EMBUDO_VENTAS/Etapa_01_Problema_Verificable/criterios_verificacion.md`; `trabajo/monoga/proyectos/sales-engine/01_EMBUDO_VENTAS/Etapa_02_Diagnostico_Consultivo/guion_diagnostico_15min.md`; `trabajo/monoga/proyectos/sales-engine/03_CRM_Y_OPERACIONES/GUIA_JOHN_VENTAS.md`.
- **Estado:** `prototype` — guías y material local; no se verificó un sistema productivo durante esta auditoría.
- **Se puede mostrar:** una pregunta de diagnóstico, el mapa problema → impacto → siguiente acción y cómo registrar el prospecto sintético en el pipeline local de T1.
- **No se puede afirmar:** clientes, conversiones, ROI, precios vigentes, disponibilidad, sincronización con CRM remoto ni resultados históricos como resultados reproducibles.
- **Prerrequisitos:** usar un prospecto sintético; explicar que es un diagnóstico guiado, no una auditoría concluida; mantenerlo separado de la automatización de ingresos de 09.
- **Ruta de 3 minutos:** 0:00 permiso y dolor; 0:45 mostrar criterios/guion; 1:30 capturar `pain`, urgencia y próxima acción en el store local; 2:30 mover a `diagnosis` y cerrar con pregunta de validación.

## 2. Automatización comercial / CRM

- **Fuente:** `trabajo/monoga/proyectos/revenue-automation/sales_engine/src/SalesOutreachService.ts`; `trabajo/monoga/proyectos/revenue-automation/sales_engine/src/EmailCopywriter.ts`; `trabajo/monoga/proyectos/revenue-automation/sales_engine/tests/sales_engine.test.ts`.
- **Estado:** `prototype` — hay código y pruebas locales históricas; no se ejecuta ni se presenta como conexión CRM activa.
- **Se puede mostrar:** inspección estática del flujo de preparación de outreach y sus pruebas, con un registro sintético y revisión humana antes de cualquier envío.
- **No se puede afirmar:** envío real, integración con Twenty/WhatsApp, automatización continua, entregabilidad, respuesta, ventas o rendimiento.
- **Prerrequisitos:** datos sintéticos; no leer secretos ni ejecutar servicios; mostrar únicamente salida de preparación/revisión, nunca un envío.
- **Ruta de 3 minutos:** 0:00 explicar que es 09 revenue automation y no 13 sales engine; 0:45 abrir el servicio/caso de prueba; 1:30 seguir un registro sintético hasta `pending review`; 2:30 señalar manualmente los controles y la ausencia de conexión externa.

## 3. Web funnel

- **Fuente:** `trabajo/monoga/proyectos/sales-engine/01_EMBUDO_VENTAS/web_conversion/index.html`; `trabajo/monoga/proyectos/growth-studio/01_GENERADOR_LOTES_LA/output_demos/bucaramanga/servicar-s-la-23.html`.
- **Estado:** `prototype` — HTML local inspeccionable; no se ha verificado publicación, analítica ni conversión.
- **Se puede mostrar:** jerarquía de propuesta, CTA y recorrido visual de una landing con contenido de ejemplo; identificar qué pregunta del diagnóstico debe responder cada sección.
- **No se puede afirmar:** tráfico, conversiones, SEO, disponibilidad pública, integración de formularios/pagos, clientes o resultados.
- **Prerrequisitos:** abrir el archivo local sin enviar formularios; sustituir cualquier contenido identificable por texto sintético; presentar la pieza como maqueta.
- **Ruta de 3 minutos:** 0:00 decir qué dolor del prospecto se está probando; 0:30 recorrer titular, prueba/explicación y CTA; 1:45 marcar el punto de captura que aún requiere validación; 2:30 acordar una hipótesis medible, sin prometer conversión.

## 4. Sistema operativo empresarial inspirado en ReferenceCo

- **Fuente:** `trabajo/monoga/proyectos/usa-expansion/portfolio/case-study-referenceco-os.md`; `trabajo/monoga/proyectos/usa-expansion/portfolio/project-inventory.md`.
- **Estado:** `blocked` — la evidencia es documentación/caso de estudio y referencia de repositorio; no hay una instancia local autorizada para demostrarla.
- **Se puede mostrar:** el mapa conceptual de módulos descritos (CRM, cotizaciones, pedidos, producción, inventario, compras, cartera y reportes) y separar el alcance candidato de la evidencia.
- **No se puede afirmar:** que Monoga tenga el sistema disponible, que el repositorio externo esté operativo, integración con WhatsApp/IA, clientes, resultados o entrega/plazo.
- **Prerrequisitos:** usar únicamente el caso de estudio local; no abrir repositorios externos, no desplegar ni ejecutar servicios; etiquetar cualquier futuro MVP como aislado y nuevo.
- **Ruta de 3 minutos:** 0:00 declarar el bloqueo; 0:30 mostrar el mapa de módulos documentado; 1:30 elegir un flujo hipotético con datos sintéticos; 2:15 listar dependencias y cerrar como conversación de alcance, no demo funcional.

## Regla de claims

Los cuatro recorridos son demostraciones de evidencia local, no promesas comerciales. El catálogo no autoriza contacto, sincronización, despliegue, envío ni modificación de CRM. Las cifras, testimonios, clientes, resultados y estados de producción requieren evidencia fechada y verificable antes de usarse.
