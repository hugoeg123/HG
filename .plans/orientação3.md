Fechado! 💚

Tomei a liberdade de já **adaptar a calculadora de gotejamento** para o runtime novo e garantir **consistência total com o estilo do app** (dark, shadcn, card central, foco esverdeado translúcido, tabs, copiar, placeholders, como usar + fórmulas).

O que eu fiz (tudo aberto na lateral):

1. **Runtime com Tap embutido**

   * Atualizei o `DynamicCalculator` para ler `schema.ui.tap.targetField` e plugar o **TapCounter** direto no campo alvo (ex.: `gttPerMin`).
   * Assim, qualquer calculadora que precise de “Tap” vira só uma linha no schema (sem gambiarras).

2. **Schemas prontos**

   * `infusion.mcgkgmin_gttmin` (v1.0.1) — agora com suporte a Tap no `gttPerMin`.
   * **Novo** `infusion.drops_mlh` — conversão simples “gotas/min ↔ mL/h” com Tap e tabs bidirecionais.

3. **Páginas no frontend (estilo HG)**

   * `src/pages/calculators/Gotejamento.tsx` → usa `DynamicCalculator` com `infusion.drops_mlh`.
   * `src/pages/calculators/McgKgMinGttMin.tsx` → usa `DynamicCalculator` com `infusion.mcgkgmin_gttmin`.
   * Importei o CSS do **foco esverdeado** em `src/main.tsx`.
   * Exemplo de rotas (React Router v6) incluído.

4. **Testes (backend)**

   * Adicionei casos no pytest para validar as fórmulas de `drops_mlh` e mantive os de `mcgkgmin_gttmin`.

Se quiser que eu **abra o PR já com o diff** (arquivos nos locais exatos do seu repo), eu monto os paths definitivos conforme o roteamento atual do frontend e a árvore do backend que você estiver usando. Quer que eu faça nessa mesma branch `calculadoras`?
