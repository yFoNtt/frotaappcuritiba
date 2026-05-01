import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function LocadorMessages() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-sm text-muted-foreground">
            Converse em tempo real com seus motoristas.
          </p>
        </div>
        <ChatWindow role="locador" />
      </div>
    </DashboardLayout>
  );
}
