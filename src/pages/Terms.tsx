import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/layout/PublicLayout";

const LAST_UPDATE = "03 de junho de 2026";

const Terms = () => {
  return (
    <PublicLayout>
      <SEO
        title="Termos de Uso"
        description="Conheça os Termos de Uso do FrotaApp: regras, responsabilidades, pagamentos e limitações para locadores e motoristas."
        canonical="/termos"
      />
      <article className="container max-w-3xl py-10 sm:py-16">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATE}</p>
        </header>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Aceitação</h2>
            <p>
              Ao criar uma conta ou utilizar o FrotaApp você concorda com estes Termos de Uso e
              com a nossa Política de Privacidade. Se não concordar, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Sobre a plataforma</h2>
            <p>
              O FrotaApp conecta locadores e motoristas para a gestão e locação de veículos,
              oferecendo ferramentas para contratos, pagamentos, manutenção, vistoria,
              quilometragem e comunicação.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Cadastro e conta</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Você deve ter 18 anos ou mais e fornecer dados verdadeiros.</li>
              <li>É responsável por manter a confidencialidade de sua senha.</li>
              <li>O perfil (locador ou motorista) determina suas permissões na plataforma.</li>
              <li>Podemos suspender ou encerrar contas que violem estes Termos.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Responsabilidades do locador</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter veículos em condições legais e de segurança.</li>
              <li>Fornecer informações verídicas sobre documentação, valores e regras do contrato.</li>
              <li>Cumprir o contrato firmado com o motorista.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Responsabilidades do motorista</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter CNH válida e regular.</li>
              <li>Usar o veículo conforme o contrato e a legislação de trânsito.</li>
              <li>Comunicar sinistros, manutenções e demais ocorrências.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">6. Pagamentos</h2>
            <p>
              Pagamentos semanais recorrentes, multas, taxas adicionais e excedentes de
              quilometragem seguem o que estiver definido em contrato entre locador e motorista.
              O FrotaApp registra e disponibiliza histórico dessas operações.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">7. Conduta proibida</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a plataforma para fins ilícitos ou fraudulentos.</li>
              <li>Inserir dados falsos, documentos adulterados ou se passar por terceiros.</li>
              <li>Tentar acessar áreas restritas, burlar segurança ou explorar vulnerabilidades.</li>
              <li>Praticar qualquer forma de assédio, discriminação ou abuso.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">8. Assistente de IA</h2>
            <p>
              O assistente interno oferece respostas auxiliares com base em seus dados. As respostas
              são informativas e não substituem aconselhamento jurídico, fiscal ou profissional.
              Você é responsável pelas decisões tomadas a partir delas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">9. Propriedade intelectual</h2>
            <p>
              Marca, logotipo, código e conteúdos do FrotaApp são protegidos por lei. É vedada a
              reprodução total ou parcial sem autorização prévia e por escrito.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">10. Limitação de responsabilidade</h2>
            <p>
              O FrotaApp atua como facilitador tecnológico. Não somos parte dos contratos de
              locação celebrados entre locadores e motoristas, e não respondemos por danos
              decorrentes do uso do veículo, descumprimento contratual ou indisponibilidade
              eventual da plataforma por motivos de força maior.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">11. Encerramento</h2>
            <p>
              Você pode encerrar sua conta a qualquer momento. Podemos suspender o acesso em caso
              de violação destes Termos, com retenção de dados pelos prazos legais descritos na
              Política de Privacidade.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">12. Alterações</h2>
            <p>
              Estes Termos podem ser atualizados. Em caso de mudanças relevantes, comunicaremos
              pelos canais oficiais. O uso contínuo após a atualização representa aceitação.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">13. Foro e contato</h2>
            <p>
              Fica eleito o foro da Comarca de Curitiba/PR para dirimir questões oriundas destes
              Termos.<br />
              <strong>Contato:</strong> contato@frotaapp.com.br
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
};

export default Terms;
