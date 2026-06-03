import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/layout/PublicLayout";

const LAST_UPDATE = "03 de junho de 2026";

const Privacy = () => {
  return (
    <PublicLayout>
      <SEO
        title="Política de Privacidade"
        description="Saiba como o FrotaApp coleta, utiliza, armazena e protege seus dados pessoais em conformidade com a LGPD."
        canonical="/privacidade"
      />
      <article className="container max-w-3xl py-10 sm:py-16">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATE}</p>
        </header>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Quem somos</h2>
            <p>
              O FrotaApp é uma plataforma de gestão e locação de veículos voltada a locadores,
              motoristas e administradores de frota. Esta Política descreve como tratamos dados
              pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cadastro:</strong> nome, e-mail, telefone, senha (criptografada) e perfil (locador/motorista).</li>
              <li><strong>Documentos:</strong> CPF, CNPJ, CNH, comprovantes e fotos enviados para validação.</li>
              <li><strong>Veículos e contratos:</strong> dados da frota, contratos, pagamentos, quilometragem, manutenções e vistorias.</li>
              <li><strong>Uso da plataforma:</strong> logs de acesso, IP, dispositivo e ações de auditoria.</li>
              <li><strong>Comunicações:</strong> mensagens trocadas no chat interno e interações com o assistente de IA.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Finalidades do tratamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Permitir cadastro, autenticação e uso das funcionalidades do FrotaApp.</li>
              <li>Gerenciar contratos de locação, pagamentos, manutenções e vistorias.</li>
              <li>Atender obrigações legais e regulatórias (fiscais, contratuais e de trânsito).</li>
              <li>Prevenir fraudes, garantir segurança e manter trilhas de auditoria.</li>
              <li>Oferecer suporte e melhorar a experiência por meio do assistente de IA.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Base legal</h2>
            <p>
              Tratamos seus dados com base em: execução de contrato, cumprimento de obrigação legal,
              legítimo interesse (segurança e prevenção a fraudes) e consentimento, quando aplicável.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Compartilhamento</h2>
            <p>
              Compartilhamos dados estritamente necessários com: locadores e motoristas envolvidos
              no contrato, provedores de infraestrutura (hospedagem em nuvem), provedores de IA
              utilizados pelo assistente interno e autoridades quando exigido por lei. Não vendemos
              dados pessoais.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">6. Retenção</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados de cadastro: enquanto a conta estiver ativa.</li>
              <li>Contratos, pagamentos e documentos fiscais: até 5 anos após o término do contrato.</li>
              <li>Logs de auditoria e segurança: até 6 meses.</li>
              <li>Mensagens do assistente de IA: sessão efêmera, não persistidas.</li>
            </ul>
            <p>Após esses prazos, os dados são anonimizados ou eliminados de forma segura.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais como criptografia em trânsito (HTTPS),
              senhas com hash, controle de acesso por papel (RLS), buckets privados com URLs
              assinadas, logs de auditoria e limites de tentativas de login.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">8. Seus direitos (LGPD)</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação e acesso aos seus dados.</li>
              <li>Correção de dados incompletos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados.</li>
              <li>Revogação do consentimento.</li>
              <li>Informação sobre compartilhamentos realizados.</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo e-mail abaixo. Responderemos em até
              15 dias.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">9. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para autenticação e preferências (como tema). Não
              utilizamos cookies de publicidade de terceiros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">10. Encarregado de Dados (DPO) e contato</h2>
            <p>
              <strong>Responsável pelo tratamento:</strong> FrotaApp<br />
              <strong>E-mail do encarregado:</strong> privacidade@frotaapp.com.br<br />
              <strong>Endereço:</strong> Curitiba/PR, Brasil
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">11. Alterações</h2>
            <p>
              Podemos atualizar esta Política periodicamente. A data da última atualização é
              indicada no topo desta página. Mudanças relevantes serão comunicadas pelos canais
              oficiais.
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
};

export default Privacy;
