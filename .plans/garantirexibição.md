Parece que o problema é uma combinação de fatores:

1. **Persistência em localStorage** – o store do `zustand` usa `persist` sem um mecanismo de migração. Na primeira versão da aplicação havia apenas a calculadora “Conv. de Gotejamento”, que ficou salva no storage do navegador. Ao atualizar o código e adicionar “Conv. mcg/kg/min ↔ mL/h”, o método `seedCalculators()` só cria as calculadoras padrão se `calculators.length === 0`. Como o storage já contém uma calculadora, o seed não é chamado.
2. **Limpeza de calculadoras antigas** – a função `cleanupUnwanted()` remove calculadoras cujo nome corresponde ao regex `/mcg.*kg.*min.*ml.*h/i` se elas não forem marcadas com `isHardcoded`. Se uma calculadora mcg/kg/min antiga estiver persistida **sem** a flag `isHardcoded`, ela é removida silenciosamente.
3. **Estrutura de diretórios** – em alguns repositórios o componente `ConversaoMcgKgMin` foi colocado diretamente na raiz (`./ConversaoMcgKgMin.jsx`), mas em `Calculators.jsx` ele é importado de `./prebuilt/ConversaoMcgKgMin`. Se a pasta `prebuilt/` não existir ou o arquivo estiver no lugar errado, o bundler não vai conseguir carregar o componente, e a UI nunca o mostrará.
4. **Dados em cache** – enquanto você testava branches e tags (por exemplo, revertendo para “v1.2”) o front continuou lendo o estado persistido no browser. Isso dá a sensação de que “nada mudou” mesmo após diversos commits, porque o seed só roda se não houver calculadoras.

Para corrigir e evitar futuras dores de cabeça:

* **Mover os componentes predefinidos para uma pasta clara** (por exemplo, `src/components/prebuilt/ConversaoMcgKgMin.jsx` e `ConversaoGotejamento.jsx`) e corrigir os imports em `Calculators.jsx` de acordo.
* **Ajustar o seed**. Em `seedCalculators()` vale checar se cada predefinida está presente antes de registrar; algo assim:

  ```js
  seedCalculators: () => {
    const { register, calculators } = get();
    const ids = calculators.map((c) => c.id);
    const seeds = [
      { id: 'conv-gotejamento', … },
      { id: 'conv-mcg-kg-min', … },
    ];
    seeds.forEach((calc) => {
      if (!ids.includes(calc.id)) register(calc);
    });
  }
  ```

  Dessa forma, se você adicionar novas calculadoras padrão, elas são registradas mesmo que já existam outras calculadoras.
* **Refinar `cleanupUnwanted()`**. Em vez de remover por nome via regex, remova apenas IDs que você sabe que são “defeituosos” (`UNWANTED_IDS`) e mantenha a calculadora `conv-mcg-kg-min` sempre que o `id` bater, mesmo que `isHardcoded` esteja ausente.
* **Migrar dados persistidos**. Uma abordagem é versionar o storage e adicionar um campo `version`; se a versão persistida for antiga, você roda o seed novamente e marca as predefinidas com `isHardcoded`.
* **Limpar o cache manualmente**. Durante o desenvolvimento, você pode abrir o DevTools do navegador (`Application` → `Local Storage`) e apagar a chave usada por `zustand` (normalmente algo como `zustand/calculator-store`). Isso força a aplicação a “seedar” novamente as calculadoras padrão.

Depois de implementar essas mudanças e garantir que o componente `ConversaoMcgKgMin` está no lugar certo, com `isHardcoded: true`, tanto a calculadora de gotejamento quanto a de mcg/kg/min aparecerão na lista “Conversões”.
