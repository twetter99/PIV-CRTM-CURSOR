# Persistencia de Datos PIV

## 🔄 Autoguardado Automático

Tu aplicación PIV ahora guarda automáticamente todos los datos en el navegador. **Ya no perderás información al reiniciar el servidor**.

### ✨ Características principales

- **Guardado automático**: Los paneles y eventos se guardan automáticamente cada vez que los modificas
- **Carga automática**: Al abrir la aplicación, se cargan automáticamente los datos guardados
- **Sistema de backup**: Puedes crear y restaurar copias de seguridad
- **Exportación/Importación**: Descarga tus datos como archivo JSON o importa datos desde archivos

## 🗂️ Gestión de Datos

Accede a la nueva sección **"Gestión de Datos"** desde el menú lateral para:

### Operaciones básicas
- **Guardar datos actuales**: Fuerza el guardado inmediato
- **Cargar datos guardados**: Recarga los datos desde el almacenamiento local

### Backup y restauración
- **Crear backup**: Guarda una copia de seguridad completa
- **Restaurar backup**: Recupera la última copia de seguridad

### Importación y exportación
- **Exportar a archivo**: Descarga todos tus datos como archivo JSON
- **Importar desde archivo**: Carga datos desde un archivo JSON previamente exportado

### Gestión avanzada
- **Eliminar todos los datos**: Limpia completamente el almacenamiento local (¡con confirmación!)

## 💾 Tecnología utilizada

- **localStorage**: Los datos se guardan localmente en tu navegador
- **Versionado**: Sistema de versiones para garantizar compatibilidad
- **Validación**: Verificación de integridad de datos al cargar

## 🔒 Seguridad y privacidad

- Los datos permanecen **completamente en tu navegador**
- **No se envían a ningún servidor externo**
- Solo tú tienes acceso a tus datos
- Puedes eliminar todos los datos cuando quieras

## 📊 Estado del almacenamiento

En el dashboard principal verás un banner que muestra:
- Estado de la persistencia
- Número de paneles y eventos guardados
- Acceso rápido a la gestión de datos

## 🚀 Ventajas

1. **Sin pérdida de datos**: Trabaja sin preocuparte por reiniciar la aplicación
2. **Trabajo offline**: Una vez cargados, los datos están disponibles sin conexión
3. **Backup automático**: Sistema robusto de respaldo de información
4. **Portabilidad**: Exporta e importa datos entre diferentes dispositivos

## ⚠️ Consideraciones

- Los datos se almacenan por dominio/puerto
- El almacenamiento tiene límites del navegador (generalmente varios MB)
- Limpiar datos del navegador eliminará la información guardada
- Se recomienda hacer exportaciones periódicas como backup adicional 