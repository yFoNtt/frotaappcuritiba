import { useLocation } from 'react-router-dom';
import { MotoristaLayout } from '@/components/motorista/MotoristaLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function MotoristaMessages() {
  const location = useLocation();
  const initialConversationId = (location.state as { conversationId?: string } | null)?.conversationId;

  return (
    <MotoristaLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-sm text-muted-foreground">
            Fale com o proprietário do veículo em tempo real.
          </p>
        </div>
        <ChatWindow role="motorista" initialConversationId={initialConversationId} />
      </div>
    </MotoristaLayout>
  );
}
