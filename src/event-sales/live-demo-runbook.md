# Live demo runbook T4

**Local-only rehearsal · datos sintéticos · sin red, CRM, Railway ni servicios.** No es una afirmación de producción.

## Preparación y reset

Desde `trabajo/monoga/proyectos/monoga-erp`, ejecutar la prueba local (`npm test -- event-sales.test.ts`) o importar `createLocalDemoHarness` desde `src/event-sales/demo-harness.ts`. Crear el harness con un reloj fijo cuando se necesite una salida idéntica. `seed()` siempre hace `reset()` y carga dos fixtures sintéticos; `reset()` deja cero prospectos y reinicia IDs en `summit-1`. No editar fixtures compartidos.

## Cuatro recorridos (3 minutos cada uno)

1. **Diagnóstico de crecimiento / sistema comercial — prototype.** Ejecutar `runProspectPipelineDemo()`, mostrar el primer prospecto pasando de `new` a `follow-up`, y explicar dolor → impacto → siguiente acción. No afirmar resultados ni sincronización CRM.
2. **Automatización comercial / CRM — prototype.** Abrir únicamente el código/pruebas locales de 09 revenue automation y mostrar una preparación sintética `pending review`. No enviar correo, WhatsApp ni ejecutar integraciones; mantenerlo separado de 13 sales engine.
3. **Web funnel — prototype.** Abrir el HTML local indicado en el catálogo, recorrer titular, explicación y CTA con texto sintético. No enviar formularios ni afirmar tráfico, analítica o conversión.
4. **Sistema operativo inspirado en ReferenceCo — blocked.** Mostrar el mapa documental local y declarar el bloqueo. Si no se puede mostrar una interfaz segura, usar captura de pantalla o HTML estático local preparado previamente; etiquetarlo como referencia, no instancia funcional.

## Fallbacks

Para los demos 2–4, el fallback seguro es una captura local o HTML estático sin formularios activos, secretos, datos personales, llamadas `fetch` ni recursos remotos. Si falta el artefacto, mostrar el catálogo y detenerse: no sustituirlo con una afirmación de capacidad.
