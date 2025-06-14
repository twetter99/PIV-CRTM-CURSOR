"use client";

import React, { useState, useRef } from 'react';
import { useData } from '@/contexts/data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Upload, 
  Download, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Database, 
  Clock,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StorageManager() {
  const {
    saveDataToStorage,
    loadDataFromStorage,
    createDataBackup,
    restoreDataFromBackup,
    exportDataToFile,
    importDataFromFile,
    clearStorageData,
    getStorageInformation
  } = useData();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState(getStorageInformation());

  // Actualizar información del almacenamiento
  const refreshStorageInfo = () => {
    setStorageInfo(getStorageInformation());
  };

  const handleSaveData = async () => {
    setIsLoading(true);
    try {
      const result = await saveDataToStorage();
      if (result.success) {
        toast({
          title: "Datos guardados",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al guardar",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron guardar los datos",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadData = async () => {
    setIsLoading(true);
    try {
      const result = await loadDataFromStorage();
      if (result.success) {
        toast({
          title: "Datos cargados",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al cargar",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await createDataBackup();
      if (result.success) {
        toast({
          title: "Backup creado",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al crear backup",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudo crear el backup",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsLoading(true);
    try {
      const result = await restoreDataFromBackup();
      if (result.success) {
        toast({
          title: "Backup restaurado",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al restaurar backup",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudo restaurar el backup",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      exportDataToFile();
      toast({
        title: "Datos exportados",
        description: "El archivo se ha descargado exitosamente",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los datos",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await importDataFromFile(file);
      if (result.success) {
        toast({
          title: "Datos importados",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al importar",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron importar los datos",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = async () => {
    setIsLoading(true);
    try {
      const result = await clearStorageData();
      if (result.success) {
        toast({
          title: "Datos eliminados",
          description: result.message,
          duration: 3000,
        });
        refreshStorageInfo();
      } else {
        toast({
          title: "Error al eliminar",
          description: result.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron eliminar los datos",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSave = (lastSave: string | null) => {
    if (!lastSave) return 'Nunca';
    try {
      return format(new Date(lastSave), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gestión de Datos PIV
        </CardTitle>
        <CardDescription>
          Administra la persistencia local de tus datos de paneles PIV
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estado del almacenamiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{storageInfo.panelsCount}</div>
            <div className="text-sm text-muted-foreground">Paneles guardados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{storageInfo.eventsCount}</div>
            <div className="text-sm text-muted-foreground">Eventos guardados</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatLastSave(storageInfo.lastSave)}</span>
            </div>
            <div className="text-sm text-muted-foreground">Último guardado</div>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={storageInfo.hasData ? "default" : "secondary"} className="flex items-center gap-1">
            {storageInfo.hasData ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {storageInfo.hasData ? 'Datos disponibles' : 'Sin datos guardados'}
          </Badge>
          <Badge variant={storageInfo.backupAvailable ? "default" : "secondary"} className="flex items-center gap-1">
            {storageInfo.backupAvailable ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {storageInfo.backupAvailable ? 'Backup disponible' : 'Sin backup'}
          </Badge>
          {storageInfo.version && (
            <Badge variant="outline">
              Versión {storageInfo.version}
            </Badge>
          )}
        </div>

        {/* Operaciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guardado y carga */}
          <div className="space-y-2">
            <h4 className="font-medium">Operaciones básicas</h4>
            <div className="space-y-2">
              <Button 
                onClick={handleSaveData} 
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar datos actuales
              </Button>
              
              <Button 
                onClick={handleLoadData} 
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Cargar datos guardados
              </Button>
            </div>
          </div>

          {/* Backup y restore */}
          <div className="space-y-2">
            <h4 className="font-medium">Backup y restauración</h4>
            <div className="space-y-2">
              <Button 
                onClick={handleCreateBackup} 
                disabled={isLoading}
                className="w-full"
                variant="secondary"
              >
                <Archive className="mr-2 h-4 w-4" />
                Crear backup
              </Button>
              
              <Button 
                onClick={handleRestoreBackup} 
                disabled={isLoading || !storageInfo.backupAvailable}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar backup
              </Button>
            </div>
          </div>
        </div>

        {/* Importar y exportar */}
        <div className="space-y-2">
          <h4 className="font-medium">Importación y exportación</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button 
              onClick={handleExportData} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar a archivo
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar desde archivo
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </div>
        </div>

        {/* Operaciones peligrosas */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-destructive mb-2">Zona peligrosa</h4>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar todos los datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todos los datos de paneles PIV del almacenamiento local.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, eliminar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
} 