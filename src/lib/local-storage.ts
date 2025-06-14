import type { Panel, PanelEvent } from '@/types/piv';

// Configuración de almacenamiento local
const STORAGE_KEYS = {
  PANELS: 'piv_panels_v2',
  EVENTS: 'piv_events_v2',
  BACKUP: 'piv_backup_v2',
  LAST_SAVE: 'piv_last_save',
  VERSION: 'piv_data_version'
} as const;

const CURRENT_VERSION = '2.0.0';

export interface LocalStorageData {
  panels: Panel[];
  events: PanelEvent[];
  version: string;
  timestamp: string;
}

export interface StorageResult {
  success: boolean;
  message: string;
  data?: LocalStorageData;
  error?: string;
}

/**
 * Guarda paneles en localStorage
 */
export const savePanelsToStorage = (panels: Panel[]): StorageResult => {
  try {
    const data = JSON.stringify(panels);
    localStorage.setItem(STORAGE_KEYS.PANELS, data);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    
    return {
      success: true,
      message: `${panels.length} paneles guardados exitosamente`
    };
  } catch (error) {
    console.error('Error guardando paneles:', error);
    return {
      success: false,
      message: 'Error al guardar paneles',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Guarda eventos en localStorage
 */
export const saveEventsToStorage = (events: PanelEvent[]): StorageResult => {
  try {
    const data = JSON.stringify(events);
    localStorage.setItem(STORAGE_KEYS.EVENTS, data);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
    
    return {
      success: true,
      message: `${events.length} eventos guardados exitosamente`
    };
  } catch (error) {
    console.error('Error guardando eventos:', error);
    return {
      success: false,
      message: 'Error al guardar eventos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Carga paneles desde localStorage
 */
export const loadPanelsFromStorage = (): StorageResult => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PANELS);
    if (!data) {
      return {
        success: true,
        message: 'No hay paneles guardados',
        data: { panels: [], events: [], version: CURRENT_VERSION, timestamp: new Date().toISOString() }
      };
    }

    const panels: Panel[] = JSON.parse(data);
    
    // Validar que los datos tengan la estructura correcta
    if (!Array.isArray(panels)) {
      throw new Error('Los datos de paneles no tienen el formato correcto');
    }

    return {
      success: true,
      message: `${panels.length} paneles cargados exitosamente`,
      data: { panels, events: [], version: CURRENT_VERSION, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    console.error('Error cargando paneles:', error);
    return {
      success: false,
      message: 'Error al cargar paneles',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Carga eventos desde localStorage
 */
export const loadEventsFromStorage = (): StorageResult => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!data) {
      return {
        success: true,
        message: 'No hay eventos guardados',
        data: { panels: [], events: [], version: CURRENT_VERSION, timestamp: new Date().toISOString() }
      };
    }

    const events: PanelEvent[] = JSON.parse(data);
    
    // Validar que los datos tengan la estructura correcta
    if (!Array.isArray(events)) {
      throw new Error('Los datos de eventos no tienen el formato correcto');
    }

    return {
      success: true,
      message: `${events.length} eventos cargados exitosamente`,
      data: { panels: [], events, version: CURRENT_VERSION, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    console.error('Error cargando eventos:', error);
    return {
      success: false,
      message: 'Error al cargar eventos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Carga todos los datos (paneles y eventos) desde localStorage
 */
export const loadAllDataFromStorage = (): StorageResult => {
  try {
    const panelsResult = loadPanelsFromStorage();
    const eventsResult = loadEventsFromStorage();

    if (!panelsResult.success) return panelsResult;
    if (!eventsResult.success) return eventsResult;

    const panels = panelsResult.data?.panels || [];
    const events = eventsResult.data?.events || [];

    return {
      success: true,
      message: `Datos cargados: ${panels.length} paneles, ${events.length} eventos`,
      data: {
        panels,
        events,
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error cargando todos los datos:', error);
    return {
      success: false,
      message: 'Error al cargar los datos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Guarda un backup completo de todos los datos
 */
export const createBackup = (panels: Panel[], events: PanelEvent[]): StorageResult => {
  try {
    const backupData: LocalStorageData = {
      panels,
      events,
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString()
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    localStorage.setItem(STORAGE_KEYS.BACKUP, backupJson);

    return {
      success: true,
      message: 'Backup creado exitosamente',
      data: backupData
    };
  } catch (error) {
    console.error('Error creando backup:', error);
    return {
      success: false,
      message: 'Error al crear backup',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Restaura desde un backup
 */
export const restoreFromBackup = (): StorageResult => {
  try {
    const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
    if (!backupData) {
      return {
        success: false,
        message: 'No hay backup disponible',
        error: 'No se encontró backup en localStorage'
      };
    }

    const parsed: LocalStorageData = JSON.parse(backupData);
    
    // Validar estructura del backup
    if (!parsed.panels || !parsed.events || !Array.isArray(parsed.panels) || !Array.isArray(parsed.events)) {
      throw new Error('El backup no tiene la estructura correcta');
    }

    // Restaurar los datos
    const panelsResult = savePanelsToStorage(parsed.panels);
    const eventsResult = saveEventsToStorage(parsed.events);

    if (!panelsResult.success || !eventsResult.success) {
      throw new Error('Error al restaurar algunos datos del backup');
    }

    return {
      success: true,
      message: `Backup restaurado: ${parsed.panels.length} paneles, ${parsed.events.length} eventos`,
      data: parsed
    };
  } catch (error) {
    console.error('Error restaurando backup:', error);
    return {
      success: false,
      message: 'Error al restaurar backup',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Exporta todos los datos como un archivo JSON para descarga
 */
export const exportDataAsFile = (panels: Panel[], events: PanelEvent[]): void => {
  try {
    const exportData: LocalStorageData = {
      panels,
      events,
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `piv-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando datos:', error);
    throw new Error('Error al exportar los datos');
  }
};

/**
 * Importa datos desde un archivo JSON
 */
export const importDataFromFile = (file: File): Promise<StorageResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const importedData: LocalStorageData = JSON.parse(jsonData);
        
        // Validar estructura
        if (!importedData.panels || !importedData.events || 
            !Array.isArray(importedData.panels) || !Array.isArray(importedData.events)) {
          throw new Error('El archivo no tiene la estructura correcta');
        }

        // Guardar los datos importados
        const panelsResult = savePanelsToStorage(importedData.panels);
        const eventsResult = saveEventsToStorage(importedData.events);

        if (!panelsResult.success || !eventsResult.success) {
          throw new Error('Error al guardar los datos importados');
        }

        resolve({
          success: true,
          message: `Datos importados: ${importedData.panels.length} paneles, ${importedData.events.length} eventos`,
          data: importedData
        });
      } catch (error) {
        console.error('Error importando datos:', error);
        resolve({
          success: false,
          message: 'Error al importar datos',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Error al leer el archivo',
        error: 'No se pudo leer el archivo seleccionado'
      });
    };

    reader.readAsText(file);
  });
};

/**
 * Limpia todos los datos del localStorage
 */
export const clearAllStorageData = (): StorageResult => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    return {
      success: true,
      message: 'Todos los datos han sido eliminados del almacenamiento local'
    };
  } catch (error) {
    console.error('Error limpiando datos:', error);
    return {
      success: false,
      message: 'Error al limpiar los datos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Obtiene información sobre el almacenamiento local
 */
export const getStorageInfo = (): {
  hasData: boolean;
  panelsCount: number;
  eventsCount: number;
  lastSave: string | null;
  version: string | null;
  backupAvailable: boolean;
} => {
  try {
    const panelsData = localStorage.getItem(STORAGE_KEYS.PANELS);
    const eventsData = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);

    const panels = panelsData ? JSON.parse(panelsData) : [];
    const events = eventsData ? JSON.parse(eventsData) : [];

    return {
      hasData: panels.length > 0 || events.length > 0,
      panelsCount: Array.isArray(panels) ? panels.length : 0,
      eventsCount: Array.isArray(events) ? events.length : 0,
      lastSave,
      version,
      backupAvailable: !!backupData
    };
  } catch (error) {
    console.error('Error obteniendo información del almacenamiento:', error);
    return {
      hasData: false,
      panelsCount: 0,
      eventsCount: 0,
      lastSave: null,
      version: null,
      backupAvailable: false
    };
  }
}; 