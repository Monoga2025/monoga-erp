# Monoga MVP aislado — límite de event-sales

> **Artefacto de diseño solamente.** Este documento traduce evidencia pública y limitada del caso ReferenceCo a un límite de demostración local para Monoga. No copia ni importa ReferenceCo.

## Propósito y evidencia

La ficha `case-study-referenceco-os.md` verifica una arquitectura empresarial con CRM, cotizaciones, pedidos, producción, inventario, compras, cartera, reportes y una asistencia comercial por WhatsApp/IA con revisión humana. También registra riesgos de secretos, datos de demo y controles pendientes. Esta propuesta usa esas señales como inspiración arquitectónica, no como prueba de que Monoga ya tenga esos módulos.

## Límite del MVP

### Dentro

- Captura local de prospectos del evento, consentimiento, etapa, dolor y próxima acción.
- Diagnóstico comercial resumido y seguimiento de oportunidades.
- Catálogo mínimo de servicios/demos de Monoga, con estado de evidencia (`prototype`, `blocked` o funcional según prueba local).
- Preparación de una propuesta en borrador, sin envío automático.
- Bandeja de revisión humana para aprobar, corregir o descartar un siguiente paso.
- Fixture reproducible y reset local para una demo del flujo prospecto → diagnóstico → demo → propuesta → seguimiento.

### Fuera

- ERP completo: inventario, compras, producción, cartera, pedidos, reportes financieros o PDF comercial.
- WhatsApp, Evolution API, OpenRouter, correo, CRM externo, pagos, multiusuario o despliegue.
- Agentes autónomos, extracción de cotizaciones desde conversaciones reales, scoring automático o escritura irreversible.
- Migración, sincronización o compatibilidad con ReferenceCo OS.

## Datos y propiedad

El módulo `event-sales` es dueño únicamente de sus prospectos, etapas, consentimiento, notas de diagnóstico y próximos pasos locales. Los fixtures pertenecen a la demo y deben ser ficticios (nombres, empresas, teléfonos, mensajes, productos y precios). No copiar datos, capturas, esquemas, código, credenciales, archivos `.env`, repositorios externos ni conversaciones de ReferenceCo. El MVP no lee ni escribe una base externa.

## Fixtures sintéticos mínimos

- `Ana Torres / Café Andino`: dolor de seguimiento manual, consentimiento concedido, etapa nueva.
- `Luis Gómez / Norte Logistics`: demora en cotizaciones, consentimiento desconocido, etapa contactada.

Los fixtures deben declarar explícitamente que son sintéticos, reiniciarse sin conservar estado y no parecer datos de clientes reales. No se agregan teléfonos, direcciones, precios ni mensajes importados.

## Revisión humana

Cada diagnóstico, clasificación, propuesta y cambio de etapa es revisable. La demo debe mostrar una aprobación humana antes de guardar una propuesta como lista para compartir. Si falta consentimiento, coincidencia o información suficiente, el sistema conserva el caso como pendiente y solicita revisión; nunca inventa datos ni ejecuta una acción externa.

## Seguridad y secretos

- Solo almacenamiento local en memoria/fixtures o archivos ya autorizados por el módulo.
- No aceptar secretos en fixtures, logs, documentación, tests o capturas.
- No usar credenciales por defecto, tokens, URLs privadas, API keys o sesiones existentes.
- No conectar servicios remotos ni acceder a repositorios externos.
- Separar datos sintéticos de cualquier dato operacional y eliminar una fixture sin afectar nada fuera del MVP.

## Flujo de demo

1. Reiniciar el harness y cargar dos prospectos sintéticos.
2. Mostrar consentimiento, dolor, etapa y próxima acción de un prospecto.
3. Avanzar a diagnóstico y registrar una hipótesis claramente etiquetada.
4. Seleccionar una demo local cuyo estado de evidencia sea visible.
5. Crear una propuesta en borrador y detenerse en la bandeja de revisión.
6. Aprobar o devolver el borrador; mostrar seguimiento y reset.
7. Declarar qué fue demostrado localmente y qué permanece como hipótesis o fuera de alcance.

## Criterio para llamarlo funcional

Solo puede llamarse **funcional en demo local** si, desde un estado limpio y sin red: (a) carga únicamente fixtures sintéticos; (b) captura y valida consentimiento; (c) recorre prospecto → diagnóstico → demo → propuesta en borrador → revisión; (d) permite corregir o rechazar sin escritura externa; (e) reinicia de forma determinista; y (f) tiene una prueba estructural o de comportamiento que cubre esos límites. “Funcional” aquí no significa producto productivo, integración verificada, despliegue listo ni producción preparada.

## Prohibiciones explícitas

Este MVP no autoriza copiar ReferenceCo, sus datos, credenciales, código, repositorio o configuración; no autoriza remote operations, despliegue o publicación; y no permite afirmar que Monoga sea un ERP, que la IA venda autónomamente o que exista producción readiness. Toda capacidad no comprobada debe permanecer como `prototype`, `blocked` o hipótesis.
