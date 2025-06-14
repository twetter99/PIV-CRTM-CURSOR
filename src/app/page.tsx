"use client";
import { KeyMetrics } from '@/components/dashboard/key-metrics';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useData } from '@/contexts/data-provider';

export default function DashboardPage() {
  const { getStorageInformation } = useData();
  const storageInfo = getStorageInformation();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Panel de Control" 
        description="Resumen de métricas y actividad de los paneles PIV." 
      />
      
      {/* Banner de información sobre persistencia */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  Persistencia de datos activada
                </p>
                <p className="text-sm text-blue-700">
                  {storageInfo.hasData 
                    ? `${storageInfo.panelsCount} paneles y ${storageInfo.eventsCount} eventos guardados automáticamente`
                    : 'Los datos se guardarán automáticamente mientras trabajas'
                  }
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link href="/storage" className="flex items-center gap-2">
                Gestionar datos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <KeyMetrics />
    </div>
  );
}
