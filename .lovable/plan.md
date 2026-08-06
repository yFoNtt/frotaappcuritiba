# Botão do Assistente IA arrastável na vertical

Hoje o botão flutuante do Assistente IA fica travado no canto inferior direito (`fixed bottom-6 right-6`) e pode cobrir conteúdo ou controles da tela.

## O que muda

- O botão passa a ser arrastável para cima e para baixo, mantendo-se sempre grudado na lateral direita.
- Funciona com mouse (arrastar e soltar) e com toque no celular.
- O botão fica limitado à área visível: não sai para fora do topo nem do rodapé da janela.
- A posição escolhida é salva no navegador (localStorage), então ele continua no mesmo lugar ao trocar de página ou recarregar.
- Um clique simples continua abrindo o assistente; um arrasto de verdade (movimento acima de ~5px) não dispara a abertura.
- Ao arrastar, o cursor muda para indicar movimento e a animação de hover é suspensa.
- Acessibilidade preservada: o botão continua focável, com `aria-label`, e passa a aceitar setas Cima/Baixo com o teclado para reposicionar.

## Detalhes técnicos

- Arquivo alterado: `src/components/locador/LocadorAssistant.tsx` (apenas o bloco do botão flutuante, linhas ~185-199).
- Estado local `offsetY` (px) controlando `style={{ bottom: offsetY }}`, com clamp entre 16px e `window.innerHeight - 72px`.
- Handlers `onPointerDown` / `onPointerMove` / `onPointerUp` com `setPointerCapture`, usando `useRef` para o ponto inicial e um flag `didDrag`.
- Persistência em `localStorage` sob a chave `frotaapp:assistant-btn-y`, lida na inicialização do estado (lazy initializer, sem `useEffect`).
- Reclamp em `resize` com cleanup do listener no `useEffect`.
- Sem mudança de cores cruas: continua usando os tokens semânticos atuais.
