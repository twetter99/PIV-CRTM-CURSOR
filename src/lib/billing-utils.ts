/*
 * LÓGICA DE CÁLCULO DE FACTURACIÓN MENSUAL POR PANEL
 * 
 * 1. Fechas de referencia del archivo Excel:
 *    - fechaInstalacion: Fecha de instalación inicial (requerida)
 *    - fechaDesinstalacion: Fecha de desinstalación (23:59) - opcional
 *    - fechaReinstalacion: Fecha de reinstalación (00:01) - opcional
 * 
 * 2. Casos de cálculo manejados explícitamente:
 * 
 *    CASO 1 - Solo fechaReinstalacion (sin fechaDesinstalacion):
 *    - Panel vandalizado o reubicado directamente
 *    - Facturación: Solo desde fechaReinstalacion hasta fin de mes
 *    - La reinstalación REEMPLAZA la instalación original
 * 
 *    CASO 2 - Solo fechaDesinstalacion (sin fechaReinstalacion):
 *    - Panel desinstalado permanentemente
 *    - Facturación: Desde fechaInstalacion hasta fechaDesinstalacion (INCLUSIVE)
 *    - Desinstalación a las 23:59 = día completo facturable
 * 
 *    CASO 3 - Ambas fechas (fechaDesinstalacion Y fechaReinstalacion):
 *    - Panel desinstalado y luego reinstalado
 *    - Facturación: (fechaInstalacion → fechaDesinstalacion) + (fechaReinstalacion → fin mes)
 *    - Días entre desinstalación y reinstalación NO son facturables
 * 
 *    CASO 4 - Ninguna fecha especial (solo fechaInstalacion):
 *    - Panel normal instalado todo el mes
 *    - Facturación: Desde fechaInstalacion hasta fin de mes
 * 
 * 3. Protecciones implementadas:
 *    - Validación de datos de entrada (panelId, year, month, arrays)
 *    - Manejo de paneles no encontrados
 *    - Validación de fechas con parseAndValidateDate
 *    - Valores por defecto para evitar undefined/null
 *    - Normalización a máximo 30 días base para facturación
 * 
 * 4. Cálculo final:
 *    - Se suman todos los días activos del mes según las condiciones
 *    - La facturación se calcula proporcionalmente, con máximo de 30 días de referencia
 *    - Retorna siempre un BillingRecord completo y válido
 */

import type { Panel, PanelEvent, PanelStatus as PivPanelStatus } from "@/types/piv";
import { format as formatDateFns, parseISO, isValid, getDaysInMonth as getDaysInActualMonthFns } from 'date-fns';
import { es } from 'date-fns/locale';

const MAX_MONTHLY_RATE = 37.70;
const DAYS_IN_STANDARD_MONTH = 30;

export const isValidDateString = (dateStr: unknown): dateStr is string => {
    if (typeof dateStr !== 'string' || !dateStr.trim()) return false;
    const datePart = dateStr.trim().substring(0, 10); 
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) { 
        return false;
    }
    const dateObj = parseISO(datePart);
    const isValidDate = isValid(dateObj);
    const isSameWhenFormatted = isValidDate && formatDateFns(dateObj, 'yyyy-MM-dd', { locale: es }) === datePart;
    return isSameWhenFormatted;
};

export const parseAndValidateDate = (dateStr: unknown): Date | null => {
  if (!isValidDateString(dateStr)) { 
    return null;
  }
  try {
    const datePart = (dateStr as string).trim().substring(0, 10); 
    const [year, month, day] = datePart.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }
    const date = new Date(Date.UTC(year, month - 1, day)); 
    if (isValid(date) && 
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 && 
        date.getUTCDate() === day) {
      return date;
    } else {
      return null;
    }
  } catch {
    return null;
  }
};


export interface BillingRecord {
  panelId: string;
  year: number;
  month: number;
  billedDays: number;
  totalDaysInMonth: number;
  amount: number;
  panelDetails?: Panel;
}

export function calculateBillableDaysFromPanelPivDates(
  panel: Panel,
  year: number,
  month: number 
): number {
  const actualDaysInBillingMonth = getDaysInActualMonthFns(new Date(Date.UTC(year, month - 1, 1)));
  
  // Usar los nombres de campo camelCase de la interfaz Panel actualizada
  const installDate = parseAndValidateDate(panel.fechaInstalacion);
  const desinstallDate = parseAndValidateDate(panel.fechaDesinstalacion);
  const reinstallDate = parseAndValidateDate(panel.fechaReinstalacion);

  if (!installDate) {
    return 0;
  }

  let billableDays = 0;

  for (let day = 1; day <= actualDaysInBillingMonth; day++) {
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    let isActiveToday = false;

    if (currentDate < installDate) {
        isActiveToday = false;
    } else {
        isActiveToday = true; 
        
        // Manejar casos de desinstalación
        if (desinstallDate) {
            if (reinstallDate && reinstallDate > desinstallDate) {
                // Caso: Desinstalado y luego Reinstalado
                // Desinstalación a las 23:59: día de desinstalación es activo
                // Reinstalación a las 00:01: día de reinstalación es activo
                // Solo los días ENTRE desinstalación y reinstalación (exclusivos) son inactivos
                if (currentDate > desinstallDate && currentDate < reinstallDate) {
                    isActiveToday = false;
                }
            } else {
                // Caso: Solo desinstalado (sin reinstalación válida)
                // Desinstalación a las 23:59: día de desinstalación es activo
                // Solo los días DESPUÉS de la desinstalación son inactivos
                if (currentDate > desinstallDate) {
                    isActiveToday = false;
                }
            }
        } 
        // Manejar caso de reinstalación sin desinstalación previa
        else if (reinstallDate) {
            // Caso: Solo reinstalación (panel vandalizado o movido)
            // El panel solo es activo desde la fecha de reinstalación
            // La reinstalación reemplaza la instalación original
            if (currentDate < reinstallDate) {
                isActiveToday = false;
            }
        }
    }

    if (isActiveToday) {
      billableDays++;
    }
  }
  return billableDays;
}

export function calculateMonthlyBillingForPanel(
  panelId: string,
  year: number,
  month: number,
  allEvents: PanelEvent[], 
  allPanels: Panel[]
): BillingRecord {
  // Validaciones iniciales y valores por defecto
  const actualDaysInBillingMonth = getDaysInActualMonthFns(new Date(Date.UTC(year, month - 1, 1)));
  
  // Buscar el panel, con protección ante datos incompletos
  const panel = allPanels?.find(p => p?.codigoParada === panelId);
  
  // Si no existe el panel, devolver registro vacío pero completo
  if (!panel) {
    return { 
      panelId: panelId || '', 
      year: year || 0, 
      month: month || 0, 
      billedDays: 0, 
      totalDaysInMonth: actualDaysInBillingMonth || 30, 
      amount: 0, 
      panelDetails: undefined 
    };
  }

  // Parsear y validar fechas con protección
  const installDate = parseAndValidateDate(panel.fechaInstalacion);
  const desinstallDate = parseAndValidateDate(panel.fechaDesinstalacion);
  const reinstallDate = parseAndValidateDate(panel.fechaReinstalacion);

  // Si no hay fecha de instalación, no se puede facturar
  if (!installDate) {
    return {
      panelId: panelId || '',
      year: year || 0,
      month: month || 0,
      billedDays: 0,
      totalDaysInMonth: actualDaysInBillingMonth || 30,
      amount: 0,
      panelDetails: panel,
    };
  }

  let billableDays = 0;
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month - 1, actualDaysInBillingMonth));

  // CASO 1: Solo fechaReinstalacion (sin fechaDesinstalacion)
  if (reinstallDate && !desinstallDate) {
    // Calcular días desde fechaReinstalacion hasta fin de mes
    for (let day = 1; day <= actualDaysInBillingMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      // El panel es activo solo desde la fecha de reinstalación (reemplaza instalación original)
      if (currentDate >= reinstallDate) {
        billableDays++;
      }
    }
  }
  // CASO 2: Solo fechaDesinstalacion (sin fechaReinstalacion) 
  else if (desinstallDate && !reinstallDate) {
    // Calcular días desde inicio de mes hasta fechaDesinstalacion (inclusive)
    for (let day = 1; day <= actualDaysInBillingMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      // El panel es activo desde instalación hasta desinstalación (inclusive - hasta las 23:59)
      if (currentDate >= installDate && currentDate <= desinstallDate) {
        billableDays++;
      }
    }
  }
  // CASO 3: Ambas fechas existen (fechaDesinstalacion Y fechaReinstalacion)
  else if (desinstallDate && reinstallDate) {
    // Cuando hay desinstalación Y reinstalación, la lógica es:
    // 1. Panel activo desde instalación hasta desinstalación (inclusive)
    // 2. Panel activo desde reinstalación hasta presente
    // 3. Si desinstalación y reinstalación son el mismo día, solo cuenta desde reinstalación
    
    if (desinstallDate.getTime() === reinstallDate.getTime()) {
      // Mismo día: el panel se mantiene activo, usar reinstalación como fecha efectiva
      for (let day = 1; day <= actualDaysInBillingMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        if (currentDate >= reinstallDate) {
          billableDays++;
        }
      }
    } else if (reinstallDate > desinstallDate) {
      // Fechas diferentes: dos períodos activos
      for (let day = 1; day <= actualDaysInBillingMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        
        // Período 1: desde instalación hasta desinstalación (inclusive)
        const activeInFirstPeriod = currentDate >= installDate && currentDate <= desinstallDate;
        
        // Período 2: desde reinstalación hasta presente
        const activeInSecondPeriod = currentDate >= reinstallDate;
        
        if (activeInFirstPeriod || activeInSecondPeriod) {
          billableDays++;
        }
      }
    } else {
      // Error en datos: reinstalación anterior a desinstalación, usar solo hasta desinstalación
      for (let day = 1; day <= actualDaysInBillingMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        if (currentDate >= installDate && currentDate <= desinstallDate) {
          billableDays++;
        }
      }
    }
  }
  // CASO 4: Ninguna fecha especial (solo fechaInstalacion)
  else {
    // Lógica original: panel instalado todo el mes (desde fecha de instalación)
    for (let day = 1; day <= actualDaysInBillingMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      if (currentDate >= installDate) {
        billableDays++;
      }
    }
  }

  // Calcular días para facturación (máximo 30 días base)
  let daysForBillingAndDisplayNumerator = billableDays;
  const daysForBillingAndDisplayDenominator = DAYS_IN_STANDARD_MONTH;

  // Si los días activos superan los días del mes, normalizar a 30 días
  if (billableDays >= actualDaysInBillingMonth) {
    daysForBillingAndDisplayNumerator = DAYS_IN_STANDARD_MONTH;
  }

  // Calcular importe con protección ante datos nulos
  const finalBaseAmount = (panel.importeMensual && panel.importeMensual > 0)
                            ? panel.importeMensual 
                            : MAX_MONTHLY_RATE;
  
  const dailyRate = finalBaseAmount / DAYS_IN_STANDARD_MONTH;
  const calculatedAmount = daysForBillingAndDisplayNumerator * dailyRate;
  const amount = parseFloat(calculatedAmount.toFixed(2)) || 0;
  
  // Devolver registro completo con todas las protecciones
  return {
    panelId: panelId || '',
    year: year || 0,
    month: month || 0,
    billedDays: daysForBillingAndDisplayNumerator || 0,
    totalDaysInMonth: daysForBillingAndDisplayDenominator || 30,
    amount: amount || 0,
    panelDetails: panel,
  };
}


export interface DayStatus {
  date: string; // YYYY-MM-DD
  status: PivPanelStatus;
  isBillable: boolean;
  eventNotes?: string;
}

export function getPanelHistoryForBillingMonth(
  panelId: string,
  year: number,
  month: number,
  allEvents: PanelEvent[], 
  allPanels: Panel[]
): DayStatus[] {
  const panel = allPanels.find(p => p.codigoParada === panelId); // Usar codigoParada
  if (!panel) return [];

  // Usar los nombres de campo camelCase de la interfaz Panel actualizada
  const installDate = parseAndValidateDate(panel.fechaInstalacion);
  const desinstallDate = parseAndValidateDate(panel.fechaDesinstalacion);
  const reinstallDate = parseAndValidateDate(panel.fechaReinstalacion);

  const actualDaysInMonth = getDaysInActualMonthFns(new Date(Date.UTC(year, month - 1, 1)));
  const dailyHistory: DayStatus[] = [];
  
  const statusTranslations: Record<PivPanelStatus, string> = {
    'installed': 'Instalado',
    'removed': 'Eliminado',
    'maintenance': 'Mantenimiento',
    'pending_installation': 'Pendiente Instalación',
    'pending_removal': 'Pendiente Eliminación',
    'unknown': 'Desconocido'
  };

  for (let day = 1; day <= actualDaysInMonth; day++) {
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const currentDateStr = formatDateFns(currentDate, 'yyyy-MM-dd', { locale: es });

    let isBillableToday = false;
    let effectiveStatusToday: PivPanelStatus = 'unknown';
    let notesForDay = "";

    if (!installDate) {
        isBillableToday = false;
        effectiveStatusToday = 'unknown';
    } else {
        if (currentDate < installDate) {
            isBillableToday = false;
            effectiveStatusToday = 'pending_installation';
        } else {
            isBillableToday = true; 
            
            // Manejar casos de desinstalación
            if (desinstallDate) {
                if (reinstallDate && reinstallDate > desinstallDate) {
                    // Caso: Desinstalado y luego Reinstalado
                    // Desinstalación a las 23:59: día de desinstalación es activo
                    // Reinstalación a las 00:01: día de reinstalación es activo
                    // Solo los días ENTRE desinstalación y reinstalación (exclusivos) son inactivos
                    if (currentDate > desinstallDate && currentDate < reinstallDate) {
                        isBillableToday = false;
                    }
                } else {
                    // Caso: Solo desinstalado (sin reinstalación válida)
                    // Desinstalación a las 23:59: día de desinstalación es activo
                    // Solo los días DESPUÉS de la desinstalación son inactivos
                    if (currentDate > desinstallDate) {
                        isBillableToday = false;
                    }
                }
            }
            // Manejar caso de reinstalación sin desinstalación previa
            else if (reinstallDate) {
                // Caso: Solo reinstalación (panel vandalizado o movido)
                // El panel solo es activo desde la fecha de reinstalación
                // La reinstalación reemplaza la instalación original
                if (currentDate < reinstallDate) {
                    isBillableToday = false;
                }
            }
            
            effectiveStatusToday = isBillableToday ? 'installed' : 'removed';
        }
    }
    
    if (effectiveStatusToday === 'pending_installation' && installDate) {
        notesForDay = `${statusTranslations.pending_installation} (Programada: ${formatDateFns(installDate, 'dd/MM/yyyy', { locale: es })})`;
    } else {
        notesForDay = statusTranslations[effectiveStatusToday] || effectiveStatusToday;
    }
    
    if (currentDate.getTime() === installDate?.getTime()) notesForDay = `PIV Instalado (${notesForDay})`;
    if (currentDate.getTime() === desinstallDate?.getTime()) {
        // Desinstalación a las 23:59: día completo facturable
        notesForDay = `PIV Desinstalado a las 23:59 (${statusTranslations.installed} - Día completo facturable)`;
    }
    if (currentDate.getTime() === reinstallDate?.getTime()) {
        // Reinstalación a las 00:01: día completo facturable
        if (desinstallDate) {
            notesForDay = `PIV Reinstalado a las 00:01 (${statusTranslations.installed} - Día completo facturable)`;
        } else {
            notesForDay = `PIV Reinstalado a las 00:01 - Reemplaza instalación original (${statusTranslations.installed} - Día completo facturable)`;
        }
    }

    dailyHistory.push({
      date: currentDateStr,
      status: effectiveStatusToday,
      isBillable: isBillableToday,
      eventNotes: notesForDay,
    });
  }
  return dailyHistory;
}
