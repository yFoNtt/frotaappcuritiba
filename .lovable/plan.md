## Problema

As fotos dos veículos continuam aparecendo cortadas em alguns pontos do app. As correções anteriores cobriram `VehicleCard` e a imagem principal do `ImageGallery`, mas ainda existem superfícies usando `object-cover` (ou recortes implícitos) que precisam ser ajustadas para mostrar a foto inteira, com letterbox sobre `bg-muted` quando necessário.

## Mudanças

### 1) `src/components/vehicles/ImageGallery.tsx`
- **Imagem principal (card)**: trocar `aspect-video` por `aspect-[4/3]` para reduzir letterbox em fotos típicas de veículo (horizontais), mantendo `object-contain p-2 bg-muted` e o fallback `/placeholder.svg`.
- **Thumbnails (strip inferior do lightbox)**: trocar `object-cover` por `object-contain` em fundo `bg-muted` para que a miniatura mostre a foto inteira.
- **Lightbox fullscreen**: já está com `object-contain`. Garantir que clicar no overlay (área fora da imagem) fecha o modal — `onClick` no wrapper que setamos `setIsFullscreen(false)` e `e.stopPropagation()` nos botões/imagem.
- **Imagem principal do lightbox**: confirmar `max-h-full max-w-full object-contain` (já está) e remover qualquer `p-8` que esteja apertando demais — manter padding generoso mas sem cortar.

### 2) `src/components/vehicles/VehicleCard.tsx`
- Já usa `object-contain p-2 bg-muted` com `aspect-[16/10]`. Trocar para `aspect-[4/3]` para reduzir a faixa preta lateral em fotos verticais e dar mais altura à imagem no card, especialmente no mobile (390px).
- Manter `onError` para `/placeholder.svg` e a animação `group-hover:scale-105`.

### 3) `src/pages/VehicleDetails.tsx`
- Skeleton da imagem principal: trocar `aspect-video` por `aspect-[4/3]` para combinar com o novo `ImageGallery` e evitar "salto" de layout ao carregar.

### 4) Conferência rápida (sem alterações esperadas, apenas validar)
- `src/components/home/FeaturedVehicles.tsx` — usa `VehicleCard`, herda a correção.
- `src/pages/Vehicles.tsx` — usa `VehicleCard`, herda a correção.
- `src/pages/locador/Vehicles.tsx` e `src/pages/admin/Vehicles.tsx` — verificar se usam thumbnail próprio com `object-cover`; se sim, trocar pelo mesmo padrão (`object-contain bg-muted`). Ajustes só se realmente existirem.

## Fora de escopo
- Upload, Storage, lógica de negócio, mudanças em RLS, novas dependências.
- Recorte automático/CDN de imagens (fora do escopo de UI).

## Resultado esperado
Em qualquer lugar onde a foto do veículo aparece (card do marketplace, página de detalhes, lightbox e thumbnails), a imagem é exibida **inteira**, centralizada, com fundo `bg-muted` preenchendo as áreas vazias quando o aspect ratio da foto não bater com o container. Sem mais recortes nas laterais ou no topo/base.
