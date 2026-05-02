import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  component: TermosPage,
  head: () => ({
    meta: [
      { title: "Termos e Condições de Uso — Central T.A.F" },
      { name: "description", content: "Termos de Uso e Condições da Plataforma Central T.A.F." },
    ],
  }),
});

function TermosPage() {
  return (
    <div className="min-h-screen text-foreground bg-background">
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <a
          href="/"
          className="inline-block mb-6 text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground hover:text-neon transition-colors"
        >
          ← Voltar ao Painel
        </a>

        <h1 className="text-2xl font-mono-tac font-bold uppercase tracking-widest text-neon text-glow mb-8">
          Termos de Uso e Condições da Plataforma
        </h1>

        <div className="prose-tactical space-y-6 text-sm leading-relaxed text-muted-foreground font-mono-tac">
          <p>
            Este documento estabelece as regras e condições de uso do aplicativo, incluindo as diretrizes de privacidade, responsabilidades clínicas e o uso de tecnologias de automação, em conformidade com as legislações vigentes e o Código de Ética do Nutricionista (Resolução CFN Nº 856/2026).
          </p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 1: Da Natureza do Serviço e Escopo de Atuação</h2>
          <p><strong className="text-foreground">1.1. Objeto:</strong> O presente aplicativo, integrado aos projetos N.T.O (Nutrição e Treinamento Tático Operacional) e Central T.A.F., consiste em uma plataforma digital de monitoramento de métricas, educação em saúde e suporte técnico direcionado ao aprimoramento do desempenho físico e cognitivo de agentes de segurança pública e operadores táticos.</p>
          <p><strong className="text-foreground">1.2. Caráter Educativo e de Monitoramento:</strong> Todos os recursos, painéis de controle, algoritmos de rastreamento de flexibilidade metabólica e protocolos educacionais de gut training disponibilizados nesta plataforma possuem caráter exclusivamente informativo e de acompanhamento de performance operacional.</p>
          <p><strong className="text-foreground">1.3. Não Substituição da Prática Clínica:</strong> Fica expressamente estabelecido que o uso desta plataforma não substitui a avaliação clínica presencial ou por teleconsulta, tampouco caracteriza prescrição dietoterápica isolada. A aplicação das estratégias nutricionais e o manejo de parâmetros operacionais em campo devem ocorrer em estrita conformidade com o plano alimentar e as diretrizes clínicas previamente estabelecidas e individualizadas em consulta.</p>
          <p><strong className="text-foreground">1.4. Vedação à Instrumentalização Técnica:</strong> Os conteúdos técnicos e informativos fornecidos pelo sistema destinam-se à educação em saúde do "atleta operacional". É estritamente vedada a utilização, replicação ou adaptação destes materiais por usuários leigos com a finalidade de prescrever condutas, atuar na dietoterapia de terceiros ou exercer atividades privativas do nutricionista.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 2: Da Transparência Tecnológica e Uso de Automação</h2>
          <p><strong className="text-foreground">2.1. Declaração de Uso de Inteligência Artificial:</strong> Em conformidade com as diretrizes éticas de transparência tecnológica, o usuário é formalmente informado de que esta plataforma emprega algoritmos de inteligência artificial e fluxos de automação de dados em sua arquitetura e funcionamento. Tais tecnologias são utilizadas para otimizar o processamento de métricas operacionais, consolidar painéis de desempenho e formatar guias de educação em saúde.</p>
          <p><strong className="text-foreground">2.2. Automação de Rastreamento:</strong> O sistema utiliza integrações e lógicas automatizadas para o cruzamento e a consolidação de dados relacionados à composição corporal, nível de estresse e flexibilidade metabólica. O processamento estruturado dessas informações visa gerar insights de performance técnica, não configurando, em nenhuma hipótese, diagnóstico, conduta dietoterápica ou prescrição autônoma gerada por máquina.</p>
          <p><strong className="text-foreground">2.3. Supervisão Profissional e Curadoria:</strong> Todo o arcabouço lógico, científico e literário que orienta os algoritmos, bancos de dados e eventuais agentes interativos da plataforma foi desenvolvido, curado e permanece sob contínua supervisão técnica de nutricionista devidamente registrado e habilitado. A infraestrutura tecnológica atua estritamente como um vetor de facilitação e apoio ao monitoramento.</p>
          <p><strong className="text-foreground">2.4. Limitação de Precisão de Algoritmos:</strong> Embora a plataforma utilize sistemas modernos para o processamento de dados e elaboração de relatórios de desempenho tático, o usuário reconhece que recursos baseados em inteligência artificial e processamento em lote podem, eventualmente, apresentar imprecisões ou necessitar de calibração de contexto. Qualquer métrica ou insight gerado pelo aplicativo que levante dúvidas quanto à sua aplicabilidade prática em campo deverá ser imediatamente validado junto ao profissional responsável.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 3: Da Proteção de Dados, Privacidade e Sigilo Operacional</h2>
          <p><strong className="text-foreground">3.1. Sigilo e Proteção Funcional:</strong> A plataforma adota protocolos rigorosos de segurança da informação para garantir o sigilo absoluto de todos os dados fisiológicos, métricas de desempenho tático, histórico de saúde e, especialmente, a identidade funcional e a lotação dos operadores cadastrados, em total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).</p>
          <p><strong className="text-foreground">3.2. Vedação Expressa ao Uso Promocional e Simulações (IA Generativa):</strong> É expressamente vedada, por parte da administração do aplicativo, a extração, manipulação ou utilização de fotografias, relatos ou métricas de evolução inseridas pelo usuário na plataforma para a criação de peças publicitárias, publicações de "antes e depois" ou qualquer formato de marketing de resultados. Adicionalmente, nenhum dado pessoal ou biométrico será utilizado para alimentar sistemas de inteligência artificial generativa com o intuito de criar, alterar ou simular imagens, vídeos ou áudios de resultados clínicos.</p>
          <p><strong className="text-foreground">3.3. Finalidade Estrita da Coleta de Dados:</strong> As informações trafegadas e armazenadas no banco de dados do sistema possuem a finalidade única e exclusiva de subsidiar o monitoramento de performance, o cálculo de flexibilidade metabólica e o acompanhamento nutricional do próprio usuário titular da conta.</p>
          <p><strong className="text-foreground">3.4. Infraestrutura e Hospedagem:</strong> Os dados são processados em infraestrutura de servidores em nuvem com criptografia, sendo o acesso ao painel de controle restrito exclusivamente ao usuário (mediante credenciais de autenticação) e ao nutricionista desenvolvedor e administrador do sistema, sob o rigor do sigilo profissional.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 4: Das Condições Comerciais, Assinaturas e Honorários</h2>
          <p><strong className="text-foreground">4.1. Transparência de Valores:</strong> Em alinhamento com as diretrizes éticas de divulgação de honorários, a plataforma disponibiliza, de forma clara, ostensiva e prévia à contratação, a tabela vigente com os valores de todos os procedimentos, serviços de monitoramento e acessos aos recursos do aplicativo.</p>
          <p><strong className="text-foreground">4.2. Estrutura de Planos:</strong> O acesso aos recursos de monitoramento contínuo e aos guias de performance do sistema é comercializado sob o modelo de assinaturas, com opções de planos mensais, trimestrais e anuais. O usuário possui total clareza sobre o ciclo de faturamento e as funcionalidades atreladas ao plano escolhido no momento da adesão.</p>
          <p><strong className="text-foreground">4.3. Política de Valores Diferenciados para Segurança Pública:</strong> A administração do sistema adota uma política de precificação escalonada, oferecendo honorários e taxas de assinatura com valores distintos para agentes das forças de segurança pública e operadores táticos, em comparação ao público em geral (clientes civis). A concessão desta tabela diferenciada possui caráter estritamente administrativo e institucional, condicionada à comprovação de vínculo funcional no momento do cadastro, não configurando prática promocional, concorrência desleal ou mercantilização da saúde.</p>
          <p><strong className="text-foreground">4.4. Renovação e Cancelamento:</strong> As renovações dos planos de assinatura (mensais, trimestrais ou anuais) são processadas conforme as diretrizes do gateway de pagamento integrado à plataforma. O usuário possui o direito de solicitar o cancelamento da renovação automática a qualquer momento, acessando o painel de faturamento no seu perfil, sem aplicação de multas ou retenção abusiva de dados após o fim do ciclo vigente.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 5: Da Responsabilidade sobre a Inserção de Dados e Precisão Metabólica</h2>
          <p><strong className="text-foreground">5.1. Veracidade das Informações:</strong> A precisão dos cálculos de flexibilidade metabólica, rastreamento de estresse e protocolos de gut training gerados pela plataforma depende integralmente da exatidão dos dados inseridos pelo usuário. O usuário declara ser o único responsável pela veracidade, atualização e precisão das métricas de composição corporal, rotina de treinos e sintomas reportados no sistema.</p>
          <p><strong className="text-foreground">5.2. Isenção por Dados Incorretos:</strong> A administração do aplicativo e o nutricionista responsável eximem-se de qualquer responsabilidade sobre o insucesso de estratégias de performance, flutuações de rendimento ou desvios de planejamento que decorram da inserção de dados falsos, incompletos ou desatualizados por parte do usuário nos formulários e painéis de automação.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 6: Da Limitação de Responsabilidade em Operações Táticas</h2>
          <p><strong className="text-foreground">6.1. Contexto Operacional Extremo:</strong> O aplicativo é uma ferramenta de preparação, monitoramento e recuperação. Fica expressamente estabelecido que o sistema não é um dispositivo médico de emergência e não deve ser utilizado como única fonte de tomada de decisão para intervenções de saúde durante o transcurso de operações policiais, missões táticas reais ou situações de sobrevivência.</p>
          <p><strong className="text-foreground">6.2. Autonomia em Campo:</strong> Em cenários de alto estresse físico e cognitivo no terreno, a percepção subjetiva de esforço, a integridade física e os protocolos operacionais padrão (POP) da corporação devem sempre prevalecer sobre qualquer métrica, alerta ou guia automatizado emitido por esta plataforma.</p>

          <h2 className="text-foreground text-base font-bold uppercase tracking-widest mt-8">Cláusula 7: Da Evolução Contínua da Plataforma e Disponibilidade</h2>
          <p><strong className="text-foreground">7.1. Atualizações e Funcionalidades (Beta):</strong> A plataforma encontra-se em constante desenvolvimento técnico. A disponibilização semanal de novas ferramentas, painéis de monitoramento ou integrações de dados pode ocorrer em caráter experimental (versão Beta). O sistema reserva-se o direito de modificar, suspender ou descontinuar funcionalidades específicas para fins de manutenção ou aprimoramento algorítmico, mediante aviso prévio razoável na interface do usuário.</p>
          <p><strong className="text-foreground">7.2. Estabilidade do Sistema:</strong> Embora sejam adotadas as melhores práticas de engenharia de software para garantir a alta disponibilidade do sistema, o acesso contínuo pode sofrer interrupções temporárias devido a manutenções programadas, atualizações de banco de dados ou fatores externos imprevisíveis associados a provedores de hospedagem em nuvem.</p>
        </div>

        <footer className="mt-12 pt-6 border-t border-border text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
          // Central T.A.F — Sistema de Comando Operacional //
        </footer>
      </main>
    </div>
  );
}
