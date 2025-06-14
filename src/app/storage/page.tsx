import StorageManager from '@/components/storage/storage-manager';
import PageHeader from '@/components/shared/page-header';

export default function StoragePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestión de Datos" 
        description="Administra la persistencia local de tus datos PIV. Aquí puedes guardar, cargar, hacer backup y restaurar tus paneles y eventos."
      />
      
      <StorageManager />
    </div>
  );
} 