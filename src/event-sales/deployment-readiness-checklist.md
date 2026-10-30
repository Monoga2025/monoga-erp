# Checklist de preparación para despliegue (T8)

**Alcance:** checklist local para revisar cada demo antes de una eventual decisión de despliegue. Este documento no despliega, publica, accede a Railway, usa credenciales, abre red ni muta un CRM externo.

## Regla de autorización

- [ ] Existe un destino, proyecto y entorno explícitamente autorizados por la persona responsable.
- [ ] La autorización identifica qué demo, qué operación y qué sesión/credencial se permitirían.
- [ ] Sin esa autorización, el estado es **NO-GO** y la revisión permanece local.

## Ficha por demo

Completar una ficha separada para cada demo, sin agrupar evidencia:

- Demo y versión/commit local:
- Responsable técnico y responsable de negocio:
- Estado de evidencia: `functional`, `prototype` o `blocked`:
- Alcance que se mostrará y claims permitidos:
- Dependencias y riesgos conocidos:
- [ ] La ruta principal fue ensayada localmente con datos sintéticos.
- [ ] La ruta de error y el reset/reversión fueron ensayados localmente.

## Datos, secretos y consentimiento

- [ ] La validación inicia con datos sintéticos; no se importan CSV históricos, asistentes ni datos de terceros.
- [ ] Existe una puerta explícita para pasar de sintético a real: aprobación del dueño de datos, propósito, campos, retención, acceso y fecha de caducidad.
- [ ] La puerta sintético→real está cerrada si falta cualquiera de esos elementos.
- [ ] No hay secretos en código, documentación, fixtures, logs, capturas ni variables compartidas.
- [ ] Los secretos, si fueran autorizados posteriormente, se gestionarían fuera del repositorio y con acceso mínimo; nunca se copian ni se solicitan aquí.
- [ ] El consentimiento del contacto cubre el propósito, el seguimiento y el canal; `unknown` o `declined` impide activar seguimiento.
- [ ] Hay responsable de atender revocación, eliminación y consultas de datos.

## Salud, rollback y operación

- [ ] Se definieron health checks observables para la demo y sus dependencias, con resultado esperado y umbral.
- [ ] Se definió qué hacer ante fallo, dato inválido, dependencia caída o exposición accidental de secreto.
- [ ] Existe rollback documentado al último estado local conocido, con responsable, tiempo objetivo y criterio de parada.
- [ ] El rollback no borra evidencia ni datos sin autorización y fue probado sin servicios externos.
- [ ] Hay registro local de versión, fecha de revisión, riesgos aceptados y decisión.

## Coste y ownership

- [ ] El dueño de producto acepta alcance, claims, coste estimado y límites de soporte.
- [ ] El dueño técnico acepta operación, alertas, acceso y rollback.
- [ ] Costes variables, límites y responsable de aprobación están documentados antes de cualquier ejecución.
- [ ] No se asume presupuesto, cuenta, dominio, proyecto o recurso de terceros sin autorización explícita.

## Go/no-go explícito

**GO** solo si todas las casillas obligatorias están completas, el destino/proyecto/sesión están autorizados, el gate sintético→real fue aprobado cuando aplique, los health checks y rollback fueron probados, consentimiento y ownership están claros, y no quedan blockers de seguridad o evidencia.

**NO-GO** si falta autorización, hay secretos expuestos, datos reales sin gate, consentimiento ausente, ownership/coste indefinido, health check o rollback sin probar, demo `blocked`, o cualquier claim no respaldado. Registrar el blocker y mantener la demo local hasta corregirlo.

- Decisión: `GO` / `NO-GO`
- Demo revisada:
- Evidencia local:
- Blockers y responsable:
- Fecha y aprobador:

## Límites de esta tarea

Completar esta checklist no equivale a desplegar ni autoriza publicación, acceso a Railway, uso de credenciales, red o CRM externo. Cualquier operación remota requiere autorización humana separada para destino, operación y sesión.
