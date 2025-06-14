"use client";
import { useParams } from 'next/navigation';
import { useData } from '@/contexts/data-provider';
import PageHeader from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Panel, PanelEvent, PanelStatus } from '@/types/piv';
import PanelForm from '@/components/panels/panel-form';
import EventForm from '@/components/panels/event-form';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Building, Euro, Clock, AlertCircle, CheckCircle2, Package } from 'lucide-react';

// Lista de campos a mostrar con etiquetas personalizadas y claves camelCase del objeto panel.
const explicitFieldsToDisplay: Array<{ label: string; panelKey: keyof Panel | string }> = [
  { label: 'Código Parada', panelKey: 'codigoParada' },
  { label: 'Municipio Marquesina', panelKey: 'municipioMarquesina' },
  { label: 'Código Marquesina', panelKey: 'codigoMarquesina' },
  { label: 'Vigencia', panelKey: 'vigencia' },
  { label: 'Fecha Instalación', panelKey: 'fechaInstalacion' }, // Valor crudo del Excel
  { label: 'Fecha Desinstalación', panelKey: 'fechaDesinstalacion' }, // Valor crudo
  { label: 'Fecha Reinstalación', panelKey: 'fechaReinstalacion' }, // Valor crudo
  { label: 'Tipo PIV', panelKey: 'tipoPiv' },
  { label: 'Industrial', panelKey: 'industrial' },
  { label: 'Empresa Concesionaria', panelKey: 'empresaConcesionaria' }, // O 'cliente'
  { label: 'Opción 1', panelKey: 'op1' },
  { label: 'Opción 2', panelKey: 'op2' },
  { label: 'Marquesina CCE', panelKey: 'marquesinaCce' },
  { label: 'Dirección CCE', panelKey: 'direccionCce' }, // O 'direccion'
  { label: 'Última Instalación/Reinstalación', panelKey: 'ultimaInstalacionOReinstalacion' }, // Valor crudo
  { label: 'Cambio Ubicación / Reinstalaciones Contrato 2024-2025', panelKey: 'cambioUbicacionReinstalacionesContrato2024_2025' },
  { label: 'Reinstalación Vandalizados', panelKey: 'reinstalacionVandalizados' },
  { label: 'Garantía Caducada', panelKey: 'garantiaCaducada' },
  { label: 'Observaciones', panelKey: 'observaciones' },
  { label: 'Descripción Corta', panelKey: 'descripcionCorta'},
  { label: 'Código PIV Asignado', panelKey: 'codigoPivAsignado'},
  { label: 'Importe Mensual (Excel)', panelKey: 'importeMensualOriginal'}, // Muestra el valor original del Excel
];


export default function PanelDetailPage() {
  const params = useParams();
  const { getPanelById, getEventsForPanel, deletePanelEvent } = useData(); // updatePanelEvent no se usa aquí directamente
  const { toast } = useToast();
  const panelId = params.id as string;

  const [panel, setPanel] = useState<Panel | null | undefined>(undefined);
  const [events, setEvents] = useState<PanelEvent[]>([]);
  
  const [isPanelFormOpen, setIsPanelFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PanelEvent | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<PanelEvent | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panelId) {
      const currentPanel = getPanelById(panelId);
      setPanel(currentPanel);
      if (currentPanel) {
        // Log para depuración
        console.log("Panel Data Received in Detail Page:", JSON.stringify(currentPanel, null, 2));
        setEvents(getEventsForPanel(panelId).sort((a,b) => {
          const dateA = a.fecha ? parseISO(a.fecha).getTime() : 0;
          const dateB = b.fecha ? parseISO(b.fecha).getTime() : 0;
          return dateB - dateA; // Más reciente primero
        }));
      }
    }
  }, [panelId, getPanelById, getEventsForPanel]);

  useEffect(() => {
    const fetchPanelData = async () => {
      try {
        setIsLoading(true);
        // Refresh panel and events data
        if (panelId) {
          const currentPanel = getPanelById(panelId);
          setPanel(currentPanel);
          if (currentPanel) {
            setEvents(getEventsForPanel(panelId).sort((a,b) => {
              const dateA = a.fecha ? parseISO(a.fecha).getTime() : 0;
              const dateB = b.fecha ? parseISO(b.fecha).getTime() : 0;
              return dateB - dateA; // Más reciente primero
            }));
          }
        }
      } catch {
        setError('Error al cargar los datos del panel');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPanelData();
  }, [panelId, getPanelById, getEventsForPanel]);

  const handlePanelFormClose = () => {
    setIsPanelFormOpen(false);
    if (panelId) setPanel(getPanelById(panelId)); // Recargar panel por si se actualizó
  };

  const handleEventFormOpen = (event: PanelEvent | null = null) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };
  
  const handleEventFormClose = () => {
    setIsEventFormOpen(false);
    setEditingEvent(null);
    if (panelId && panel) setEvents(getEventsForPanel(panelId).sort((a,b) => {
        const dateA = a.fecha ? parseISO(a.fecha).getTime() : 0;
        const dateB = b.fecha ? parseISO(b.fecha).getTime() : 0;
        return dateB - dateA;
      }));
  };

  const confirmDeleteEvent = (event: PanelEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const handleDeleteEvent = async () => {
    if (eventToDelete && deletePanelEvent) { // Asegurarse que deletePanelEvent existe
       const result = await deletePanelEvent(eventToDelete.id);
       if (result.success) {
        toast({ title: "Evento Eliminado", description: `El evento para el panel ${eventToDelete.panelId} ha sido eliminado.` });
        if (panelId && panel) setEvents(getEventsForPanel(panelId).sort((a,b) => { 
            const dateA = a.fecha ? parseISO(a.fecha).getTime() : 0;
            const dateB = b.fecha ? parseISO(b.fecha).getTime() : 0;
            return dateB - dateA;
          }));
       } else {
        toast({ title: "Error al Eliminar", description: result.message || "No se pudo eliminar el evento.", variant: "destructive" });
       }
    }
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  };

  const formatDateForEventTable = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      // Asumimos que dateString ya es YYYY-MM-DD de la lógica interna de eventos
      const parsedDate = parseISO(dateString); 
      if (isValidDate(parsedDate)) {
          return format(parsedDate, 'dd/MM/yyyy', { locale: es });
      }
      return dateString; // Si no es parseable como YYYY-MM-DD, mostrar tal cual
    } catch (error) {
      return dateString; // En caso de error, mostrar el string original
    }
  };

  const formatStatusForEventBadge = (status: string | null | undefined): string => {
    if (status === null || status === undefined) {
      return 'Desconocido';
    }
    const statusMap: { [key: string]: string } = {
        'installed': 'Instalado',
        'removed': 'Eliminado',
        'maintenance': 'Mantenimiento',
        'pending_installation': 'Pendiente Instalación',
        'pending_removal': 'Pendiente Eliminación',
        'unknown': 'Desconocido'
    };
    return statusMap[status as PanelStatus] || status.toString().replace(/_/g, ' ');
  };

  if (panel === undefined) { // Cargando
    return (
      <div className="space-y-6">
        <PageHeader title="Cargando Panel..." actions={<Skeleton className="h-10 w-24" />} />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!panel) { // No encontrado
    return (
      <div>
        <PageHeader title="Panel No Encontrado" />
        <p>El panel con ID "{panelId}" no pudo ser encontrado.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/panels"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Paneles</Link>
        </Button>
      </div>
    );
  }
  
  // panel.direccion ahora es el campo general, panel.direccionCce es específico
  const pageDescription = panel.direccion || panel.direccionCce || panel.municipioMarquesina || `Información detallada del panel ${panel.codigoParada || ''}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Panel: ${panel.codigoParada || 'N/A'}`}
        description={pageDescription}
        actions={
          <Button variant="outline" asChild>
            <Link href="/panels"><ArrowLeft className="mr-2 h-4 w-4" />Volver al Listado</Link>
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Detalles del Panel</CardTitle>
             <div className="text-sm text-muted-foreground">
               Estado actual: <Badge variant={panel.status === 'installed' ? 'default' : (panel.status === 'removed' ? 'destructive' : 'secondary')}>{formatStatusForEventBadge(panel.status)}</Badge> 
               (Últ. act.: {panel.lastStatusUpdate ? formatDateForEventTable(panel.lastStatusUpdate) : 'N/A'})
             </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsPanelFormOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Editar Panel (Principal)
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          {explicitFieldsToDisplay.map((field) => {
            const rawValue = panel[field.panelKey as keyof Panel];
            const displayValue = (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') ? String(rawValue) : 'N/A';
            
            return (
              <div key={field.panelKey} className="lg:col-span-1 break-words">
                <strong>{field.label}:</strong> {displayValue}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl">Historial de Eventos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleEventFormOpen()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Evento
          </Button>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado Anterior</TableHead>
                    <TableHead>Estado Nuevo</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDateForEventTable(event.fecha)}</TableCell>
                      <TableCell><Badge variant="secondary">{event.oldStatus ? formatStatusForEventBadge(event.oldStatus) : 'Inicial'}</Badge></TableCell>
                      <TableCell><Badge variant={event.newStatus === 'installed' ? 'default' : (event.newStatus === 'removed' ? 'destructive' : 'secondary')}>{formatStatusForEventBadge(event.newStatus)}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{event.notes || '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEventFormOpen(event)} title="Editar Evento">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteEvent(event)} title="Eliminar Evento">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay eventos registrados para este panel.</p>
          )}
        </CardContent>
      </Card>

      {isPanelFormOpen && panel && <PanelForm panel={panel} onClose={handlePanelFormClose} />}
      {isEventFormOpen && panel && <EventForm event={editingEvent} panelId={panel.codigoParada} onClose={handleEventFormClose} />}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el evento para el panel
              "{eventToDelete?.panelId}" del {eventToDelete?.fecha ? formatDateForEventTable(eventToDelete.fecha) : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteEvent}>Eliminar Evento</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fechas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {panel.fechaInstalacion && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fecha de Instalación:</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(panel.fechaInstalacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
          {panel.fechaDesinstalacion && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fecha de Desinstalación:</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(panel.fechaDesinstalacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
          {panel.fechaReinstalacion && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fecha de Reinstalación:</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(panel.fechaReinstalacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
