/* Rules shared by character sheets and campaign moderation. Base sheet values
   are never overwritten by this module: active modifiers are calculated anew. */
(function exposeStatusEffects(global) {
  "use strict";

  const normalizeKey = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  let idSequence = 0;
  const newId = () => global.crypto?.randomUUID?.() || `status-${Date.now().toString(36)}-${(++idSequence).toString(36)}-${Math.random().toString(36).slice(2)}`;

  const WOUNDS = [
    ["dor-persistente", "Dor Persistente", "A primeira Ação Padrão que realizar a cada Turno exige +1 PA."],
    ["movimentacao-comprometida", "Movimentação Comprometida", "Seu Deslocamento é reduzido em 2Q enquanto o Ferimento permanecer."],
    ["coordenacao-prejudicada", "Coordenação Prejudicada", "A primeira Rolagem de Luta ou Pontaria que realizar a cada Turno recebe 1 dado de Desvantagem."],
    ["reflexos-abalados", "Reflexos Abalados", "Ao utilizar Esquivar, você não pode aumentar a Margem Necessária caso a Zona do ataque já seja Difícil."],
    ["guarda-comprometida", "Guarda Comprometida", "Seu Bloqueio é reduzido e não soma sua Constituição enquanto o Ferimento permanecer."],
    ["folego-curto", "Fôlego Curto", "Caso utilize mais de uma Ação que possua algum custo em PA durante o mesmo Turno, a segunda e as seguintes custam +1 PA."],
    ["sangramento", "Sangramento", "Você sofre os efeitos de Sangramento até que o Ferimento seja estabilizado ou tratado."],
    ["sensibilidade-ao-impacto", "Sensibilidade ao Impacto", "A primeira vez que sofrer dano a cada Rodada, o ataque causa +1 dado de dano."],
    ["instabilidade", "Instabilidade", "A primeira Rolagem que realizar após sofrer dano recebe 1 dado de Desvantagem."],
    ["ferimento-limitante", "Ferimento Limitante", "Escolha, de acordo com a natureza do Ferimento, Luta, Pontaria, Reflexos, Atletismo ou Fortitude. Enquanto o Ferimento permanecer, Rolagens com essa Perícia sofrem 1 dado de Desvantagem."],
  ].map(([key, name, description], index) => ({ type: "wound", key, name, description, category: "Ferimentos", d10: index + 1 }));

  const FEAR = [
    { key: "assustado", name: "Assustado", min: 1, max: 40, description: "O medo ainda não domina você por completo, mas seu corpo e sua atenção começam a reagir ao perigo antes mesmo de sua vontade.", effects: [
      ["sobressalto", "Sobressalto", "Você recebe -2 no primeiro Teste que realizar em cada Turno."],
      ["tremor", "Tremor", "Você recebe -2 em Testes que dependam de precisão física, como Luta, Pontaria, Crime ou outros semelhantes."],
      ["distracao", "Distração", "Você recebe -2 em Intuição e em Testes de Sentidos."],
      ["hesitacao", "Hesitação", "Na primeira vez em cada Turno que tentar agir diretamente contra a fonte do Medo, recebe -2 no Teste realizado."],
    ] },
    { key: "ansioso", name: "Ansioso", min: 41, max: 70, description: "O medo ocupa espaço demais em sua mente, dificultando concentração, reação e tomada de decisões.", effects: [
      ["agitacao", "Agitação", "Você recebe -2 em todos os Testes."],
      ["hipervigilancia", "Hipervigilância", "Você não pode utilizar Reações de Combate."],
      ["inquietacao", "Inquietação", "Seu Deslocamento é reduzido pela metade, pois seus movimentos se tornam hesitantes e desordenados."],
      ["bloqueio-mental", "Bloqueio Mental", "Sempre que realizar um Teste que dependa de concentração, raciocínio ou controle emocional, recebe -3 no Valor Final da Rolagem."],
    ] },
    { key: "apavorado", name: "Apavorado", min: 71, max: 90, description: "Seu instinto de sobrevivência começa a dominar suas decisões, tornando difícil enfrentar aquilo que provocou o medo.", effects: [
      ["amedrontado", "Amedrontado", "Você recebe a condição Amedrontado em relação à fonte do Medo."],
      ["fuga-instintiva", "Fuga Instintiva", "No início de cada um de seus Turnos, caso perceba a fonte do Medo, deve utilizar sua Ação de Movimento para se afastar dela."],
      ["paralisia", "Paralisia", "Você não pode utilizar sua Ação de Movimento e recebe -2 em todos os Testes."],
      ["incapaz-de-enfrentar", "Incapaz de Enfrentar", "Você não pode voluntariamente se aproximar ou agir contra a fonte do Medo. Para realizar uma ação diretamente contra ela, deve primeiro obter Sucesso Normal ou superior em um Teste de Vontade."],
    ] },
    { key: "desesperado", name: "Desesperado", min: 91, max: 100, description: "O medo rompe sua capacidade de agir racionalmente. Sobreviver se torna mais importante do que qualquer plano, ordem ou intenção anterior.", effects: [
      ["panico", "Pânico", "Enquanto perceber a fonte do Medo, deve utilizar sua Ação de Movimento para se afastar dela e não pode voluntariamente se aproximar."],
      ["colapso", "Colapso", "Você fica Caído, não pode utilizar Reações de Combate e recebe -2 em todos os Testes."],
      ["terror-paralisante", "Terror Paralisante", "Durante seu Turno, você pode realizar apenas uma Ação Padrão, de Movimento ou de Interferência, à sua escolha."],
      ["desespero-absoluto", "Desespero Absoluto", "Você fica Amedrontado, não pode utilizar Reações de Combate e deve se afastar da fonte sempre que possuir meios seguros de fazê-lo."],
    ] },
  ].map((tier) => ({ ...tier, effects: tier.effects.map(([suffix, name, description], index) => ({ type: "fear", key: `${tier.key}-${suffix}`, name, description, category: "Medo", tier: tier.key, tierName: tier.name, tierDescription: tier.description, min: tier.min, max: tier.max, d4: index + 1 })) }));

  const CONDITIONS = [
    ["sangrando", "Sangrando", "Físicas", "Ao final de cada Turno, você sofre 1d6 de Dano de Sangue. Enquanto estiver Sangrando, Regeneração de qualquer fonte é cortada pela metade."],
    ["atordoado", "Atordoado", "Físicas", "Você recebe -2 em todos os Testes."],
    ["caido", "Caído", "Físicas", "Você recebe +3 de Defesa contra projéteis e -5 de Defesa contra ataques corpo a corpo, além de receber -2 em todos os Testes enquanto permanecer Caído. Levantar-se exige normalmente uma Ação de Movimento."],
    ["imobilizado", "Imobilizado", "Físicas", "Você não pode utilizar seu Deslocamento enquanto permanecer Imobilizado. Quando a Condição for provocada diretamente por outro ser, você pode tentar escapar através de um Teste Oposto de Luta ou Crime, conforme a forma como tenta se libertar. Outras fontes de Imobilizado podem determinar seu próprio método de escape."],
    ["lento", "Lento", "Físicas", "Seu Deslocamento é reduzido pela metade enquanto permanecer Lento."],
    ["exausto", "Exausto", "Físicas", "Você fica Lento e recebe -2 em Testes de Fortitude enquanto permanecer Exausto. Ao chegar a 0 PA, você fica Exausto e permanece assim até possuir novamente pelo menos 5 PA."],
    ["envenenado", "Envenenado", "Físicas", "Você fica Lento e Enjoado enquanto permanecer Envenenado. A fonte do Envenenamento pode causar Dano Tóxico."],
    ["enjoado", "Enjoado", "Físicas", "Durante seu Turno, você pode realizar apenas uma Ação Padrão, de Movimento ou de Interferência. Ações Livres e Reações continuam podendo ser utilizadas normalmente."],
    ["desprevenido", "Desprevenido", "Físicas", "Você recebe -3 de Defesa e o próximo ataque realizado contra você reduz em -1 a Margem de Crítico da arma utilizada. Após sofrer esse ataque, a Condição é removida. Caso esteja Desprevenido por não ter percebido um atacante ou ameaça, percebê-lo através de um Teste apropriado de Sentidos também encerra a Condição."],
    ["congelando", "Congelando", "Físicas", "Você fica Lento e perde 1d4 de PA ao final de cada Turno. Normalmente, você pode utilizar uma Ação Completa para se aquecer e encerrar a Condição, caso as circunstâncias permitam."],
    ["queimando", "Queimando", "Físicas", "Ao final de cada Turno, você sofre 1d6 de Dano Flamejante. Normalmente, você pode utilizar uma Ação Completa para apagar as chamas e encerrar a Condição."],
    ["eletrocutado", "Eletrocutado", "Físicas", "No início de cada Turno, role 1d4. Em um resultado 1, você perde aquele Turno."],
    ["cego", "Cego", "Físicas", "Você falha automaticamente em Testes de Ver e fica Desprevenido contra ataques e ameaças que dependam da visão para serem percebidos, salvo quando puder identificá-los adequadamente através de outro Sentido."],
    ["surdo", "Surdo", "Físicas", "Você falha automaticamente em Testes de Ouvir e fica Desprevenido contra ataques, ameaças ou efeitos que só poderiam ser percebidos através da audição."],
    ["silenciado", "Silenciado", "Físicas", "Você é incapaz de falar. Feitiços, Habilidades e outros efeitos que necessitem da fala não podem ser utilizados enquanto permanecer Silenciado."],
    ["petrificado", "Petrificado", "Físicas", "Seu corpo é transformado em matéria rígida. Você fica Silenciado e Imóvel, recebe RD Física 10 e se torna imune às Condições Sangrando e Envenenado."],
    ["imovel", "Imóvel", "Físicas", "Você não pode utilizar seu Deslocamento nem realizar Ações Padrão, de Movimento ou de Interferência, podendo apenas realizar Reações e Ações Livres que ainda sejam possíveis nessa condição."],
    ["fragilizado", "Fragilizado", "Físicas", "Seus PV Máximos são reduzidos em 10 enquanto permanecer Fragilizado. Seus PV atuais não podem permanecer acima do novo máximo."],
    ["debilitado", "Debilitado", "Físicas", "Você recebe -3 em Testes de Acrobacia, Atletismo, Fortitude, Furtividade, Luta, Pontaria e Reflexos."],
    ["vulneravel", "Vulnerável", "Físicas", "O próximo ataque que atingir você recebe +1 Dado de Dano e considera sua Defesa reduzida em 3. Após esse ataque ser resolvido, a Condição é removida."],
    ["machucado", "Machucado", "Físicas", "Um ser fica Machucado enquanto possuir metade ou menos de seus PV Máximos. Machucado, por si só, não aplica penalidades, mas pode ser utilizado como requisito ou gatilho para certos Poderes, Feitiços ou outras coisas. Ao recuperar PV suficientes para ficar acima da metade de seus PV Máximos, o ser deixa de estar Machucado."],
    ["confuso", "Confuso", "Mentais", "Você recebe -2 em Testes de Intuição e Sentidos. Sempre que tentar realizar uma ação que dependa de interpretar corretamente o ambiente ou distinguir ameaças, aliados e intenções, o Mestre pode exigir um Teste de Intuição para determinar se você consegue agir normalmente."],
    ["amedrontado", "Amedrontado", "Mentais", "Você não consegue se aproximar voluntariamente da fonte do medo e recebe -2 em Testes realizados diretamente contra ela, salvo quando algum Poder ou efeito determinar o contrário."],
    ["perturbado", "Perturbado", "Mentais", "Um ser fica Perturbado enquanto possuir metade ou menos de sua SA Máxima. Enquanto estiver Perturbado, recebe -2 em Testes de Vontade. Ao recuperar SA suficiente para ficar acima da metade de sua SA Máxima, deixa de estar Perturbado."],
    ["enlouquecido", "Enlouquecido", "Mentais", "Ao chegar a 0 SA, um ser fica Enlouquecido. Enquanto permanecer nesse estado, passa a sofrer os efeitos das regras de Medo e Insanidade."],
    ["encantado", "Encantado", "Mentais", "Você recebe -2 em Testes Opostos realizados contra o ser ou efeito que o Encantou e encontra maior dificuldade em agir diretamente contra seus interesses."],
    ["desorientado", "Desorientado", "Mentais", "Você recebe -2 em todos os Testes que dependam de percepção, orientação ou semelhantes e não pode utilizar Reações de Combate enquanto permanecer Desorientado."],
    ["frustrado", "Frustrado", "Mentais", "Enquanto permanecer Frustrado, você recebe -2 em Testes de Vontade e, sempre que falhar em um Teste enquanto Frustrado, perde 1 SA."],
    ["energizado", "Energizado", "Mágicas", "Ao final de cada Turno, você recupera 1d6 de PA enquanto permanecer Energizado. Essa recuperação não pode ultrapassar seus PA Máximos, salvo quando algum efeito determinar o contrário."],
    ["drenado", "Drenado", "Mágicas", "Ao final de cada Turno, você perde 1d6 de PA enquanto permanecer Drenado."],
    ["selado", "Selado", "Mágicas", "Você fica incapaz de utilizar Feitiços, Habilidades mágicas ou outros efeitos que dependam diretamente de Magia enquanto permanecer Selado."],
    ["intangivel", "Intangível", "Mágicas", "Você não sofre Dano Físico e não pode interagir fisicamente com matéria, objetos ou obstáculos enquanto permanecer Intangível. Efeitos mágicos, espirituais ou outros capazes de atingir seres intangíveis podem afetá-lo normalmente."],
    ["corrompido-pelo-abismo", "Corrompido pelo Abismo", "Mágicas", "Ao final de cada Turno, você perde 1d6 de SA enquanto permanecer Corrompido pelo Abismo. Caso fique Enlouquecido enquanto estiver sob essa Condição, as consequências sofridas através das regras de Medo e Insanidade podem se tornar permanentes ou especialmente severas, conforme determinado pelo efeito que aplicou a Corrupção."],
  ].map(([key, name, category, description]) => ({ type: "condition", key, name, category, description }));

  const woundByKey = new Map(WOUNDS.map((entry) => [entry.key, entry]));
  const fearByKey = new Map(FEAR.flatMap((tier) => tier.effects.map((entry) => [entry.key, entry])));
  const conditionByKey = new Map(CONDITIONS.map((entry) => [entry.key, entry]));
  const conditionAliases = new Map([["sangramento", "sangrando"], ["corrompido", "corrompido-pelo-abismo"]]);
  const limitedSkills = ["Luta", "Pontaria", "Reflexos", "Atletismo", "Fortitude"];

  function record(definition, rolls = {}) {
    if (!definition) return null;
    return { id: newId(), type: definition.type, key: definition.key, name: definition.name, description: definition.description, category: definition.category, ...(definition.type === "fear" ? { tier: definition.tier, tierName: definition.tierName, tierDescription: definition.tierDescription } : {}), rolls, createdAt: new Date().toISOString() };
  }

  function createWound(d10) {
    const value = Number(d10);
    return Number.isInteger(value) && value >= 1 && value <= 10 ? record(WOUNDS[value - 1], { d10: value }) : null;
  }

  function createFear(d100, d4) {
    const value = Number(d100);
    const subroll = Number(d4);
    if (!Number.isInteger(value) || value < 1 || value > 100 || !Number.isInteger(subroll) || subroll < 1 || subroll > 4) return null;
    const tier = FEAR.find((entry) => value >= entry.min && value <= entry.max);
    return record(tier.effects[subroll - 1], { d100: value, d4: subroll });
  }

  function createCondition(key) {
    const normalized = normalizeKey(key);
    return record(conditionByKey.get(conditionAliases.get(normalized) || normalized));
  }

  function normalizeEffects(values) {
    if (!Array.isArray(values)) return [];
    const results = [];
    const ids = new Set();
    const conditionKeys = new Set();
    for (const value of values) {
      if (!value || typeof value !== "object") continue;
      let canonical;
      const key = normalizeKey(value.key || value.name);
      if (value.type === "wound") canonical = woundByKey.get(key);
      else if (value.type === "fear") canonical = fearByKey.get(key);
      else if (value.type === "condition") canonical = conditionByKey.get(conditionAliases.get(key) || key);
      if (!canonical || (canonical.type === "condition" && conditionKeys.has(canonical.key))) continue;
      const id = typeof value.id === "string" && value.id.trim() ? value.id : newId();
      if (ids.has(id)) continue;
      let rolls = {};
      if (canonical.type === "wound") rolls = { d10: canonical.d10 };
      if (canonical.type === "fear") {
        const percentile = Number(value.rolls?.d100);
        rolls = { d100: Number.isInteger(percentile) && percentile >= canonical.min && percentile <= canonical.max ? percentile : canonical.min, d4: canonical.d4 };
      }
      const effect = { id, type: canonical.type, key: canonical.key, name: canonical.name, description: canonical.description, category: canonical.category, rolls };
      if (canonical.type === "fear") Object.assign(effect, { tier: canonical.tier, tierName: canonical.tierName, tierDescription: canonical.tierDescription });
      if (typeof value.createdAt === "string") effect.createdAt = value.createdAt;
      if (typeof value.sourceCampaignId === "string") effect.sourceCampaignId = value.sourceCampaignId;
      if (typeof value.sourceUid === "string") effect.sourceUid = value.sourceUid;
      if (canonical.key === "ferimento-limitante") {
        const selected = limitedSkills.find((name) => normalizeKey(name) === normalizeKey(value.chosenSkill || value.skillName || value.selectedSkill || value.skill));
        if (selected) { effect.chosenSkill = selected; effect.skillName = selected; }
      }
      if (typeof value.sourceName === "string") effect.sourceName = value.sourceName;
      ids.add(id);
      if (canonical.type === "condition") conditionKeys.add(canonical.key);
      results.push(effect);
    }
    return results;
  }

  function getCatalog() {
    return copy({ wounds: WOUNDS, fear: FEAR, conditions: CONDITIONS, conditionGroups: ["Físicas", "Mentais", "Mágicas"].map((name) => ({ key: normalizeKey(name), name, conditions: CONDITIONS.filter((entry) => entry.category === name) })), limitedSkills });
  }

  function resourceValues(input = {}) {
    return Object.fromEntries(["pv", "pa", "sa"].map((key) => {
      const source = input[key] || {};
      return [key, { current: Math.max(0, finite(source.current ?? source.value)), max: Math.max(0, finite(source.max ?? source.maximum)) }];
    }));
  }

  const woundLimit = (pvMax) => Math.ceil(Math.max(0, finite(pvMax)) / 2);
  const spirit = (saMax) => Math.ceil(Math.max(0, finite(saMax)) / 3);

  function summarize(values, inputResources = {}, context = {}) {
    const effects = normalizeEffects(values);
    const resources = resourceValues(inputResources);
    const runtime = { ...(context.runtime || {}), exhausted: context.runtime?.exhausted === true };
    const derivedEffects = [];
    const suppressedEffects = [];
    const activeEffects = effects.slice();
    const conditionKeys = new Set(effects.filter((entry) => entry.type === "condition").map((entry) => entry.key));
    const petrified = conditionKeys.has("petrificado");
    const immuneKeys = petrified ? ["sangrando", "envenenado"] : [];

    function implyCondition(key, source, automatic = false) {
      if (conditionKeys.has(key) || immuneKeys.includes(key)) return;
      const definition = conditionByKey.get(key);
      const entry = { id: `derived-${source?.id || "health"}-${key}`, ...definition, rolls: {}, derived: true, automatic, sourceId: source?.id || "health", sourceName: source?.name || "Recursos da ficha" };
      conditionKeys.add(key);
      derivedEffects.push(entry);
      activeEffects.push(entry);
    }

    // Lower the effective maximum once; do not repeatedly subtract on reload.
    const maxPVAdjustment = conditionKeys.has("fragilizado") ? -10 : 0;
    resources.pv.max = Math.max(0, resources.pv.max + maxPVAdjustment);
    if (maxPVAdjustment) resources.pv.current = Math.min(resources.pv.current, resources.pv.max);
    const healthActive = {
      machucado: resources.pv.max > 0 && resources.pv.current <= resources.pv.max / 2,
      perturbado: resources.sa.max > 0 && resources.sa.current <= resources.sa.max / 2,
      enlouquecido: resources.sa.max > 0 && resources.sa.current <= 0,
    };
    // These three conditions are defined by resources even if the Mestre added
    // a record manually. Keep the record for moderation, but no healed penalty.
    for (let index = activeEffects.length - 1; index >= 0; index -= 1) {
      const entry = activeEffects[index];
      if (entry.type !== "condition" || !Object.hasOwn(healthActive, entry.key) || healthActive[entry.key]) continue;
      suppressedEffects.unshift({ ...entry, suppressed: true, reason: "Inativa nos recursos atuais." });
      activeEffects.splice(index, 1);
      conditionKeys.delete(entry.key);
    }
    if (resources.pv.max > 0 && resources.pv.current <= resources.pv.max / 2) implyCondition("machucado", null, true);
    if (resources.sa.max > 0 && resources.sa.current <= resources.sa.max / 2) implyCondition("perturbado", null, true);
    if (resources.sa.max > 0 && resources.sa.current <= 0) implyCondition("enlouquecido", null, true);
    if (resources.pa.max > 0 && resources.pa.current <= 0) runtime.exhausted = true;
    else if (resources.pa.current >= 5) runtime.exhausted = false;
    if (resources.pa.max > 0 && runtime.exhausted && resources.pa.current < 5) implyCondition("exausto", null, true);

    for (const entry of activeEffects.slice()) {
      if (entry.type === "wound" && entry.key === "sangramento") implyCondition("sangrando", entry);
      if (entry.type === "fear") {
        if (["apavorado-amedrontado", "desesperado-desespero-absoluto"].includes(entry.key)) implyCondition("amedrontado", entry);
        if (entry.key === "desesperado-colapso") implyCondition("caido", entry);
      }
    }
    // Conditions can imply other conditions; newly appended entries are visited.
    for (let index = 0; index < activeEffects.length; index += 1) {
      const entry = activeEffects[index];
      if (entry.type !== "condition" || immuneKeys.includes(entry.key)) continue;
      if (["exausto", "envenenado", "congelando"].includes(entry.key)) implyCondition("lento", entry);
      if (entry.key === "envenenado") implyCondition("enjoado", entry);
      if (entry.key === "petrificado") { implyCondition("silenciado", entry); implyCondition("imovel", entry); }
      if (entry.key === "cego" && context.attackReliesOnSight && !context.canUseOtherSense) implyCondition("desprevenido", entry);
      if (entry.key === "surdo" && context.attackReliesOnHearing) implyCondition("desprevenido", entry);
    }

    const adjustments = { maxPV: maxPVAdjustment, movementFlat: 0, movementHalf: false, movementBlocked: false, blockConstitution: false, globalTest: 0, skillTests: {}, disadvantage: 0, defense: { global: 0, projectile: 0, melee: 0, nextHit: 0 } };
    const flags = { automaticFailureSenses: [], noCombatReactions: false, evasionCannotRaiseHardMargin: false, physicalRD: 0, frustrated: false, paFirstStandard: 0, paAfterFirstAction: 0, regenerationMultiplier: 1, noSpeech: false, movementActionBlocked: false, standardActionBlocked: false, interferenceActionBlocked: false, oneMainAction: false, magicSealed: false, intangible: false, physicalDamageImmune: false, immuneConditionKeys: immuneKeys, approachFearBlocked: false, mustWithdrawFromFear: false, mustWithdrawFromFearWhenSafe: false, requireWillAgainstFear: false, firstIncomingDamageExtraDice: 0, nextIncomingDamageExtraDice: 0, nextIncomingAttackCriticalMarginDelta: 0, unavailableLimitingSkill: false };
    const modifiers = [];
    const notes = suppressedEffects.map((entry) => ({ ...entry }));
    const skillName = normalizeKey(context.skillName || context.skill);
    const sensesNames = ["sentidos", "ver", "ouvir", "olfato", "tato", "paladar"];
    const perceptionSkills = [...sensesNames, "intuicao"];
    const againstSource = Boolean(context.againstSource || context.againstFearSource);
    const firstTest = context.firstTest ?? runtime.firstTestPending ?? runtime.firstTest;
    const firstFightOrShot = context.firstFightOrShot ?? runtime.firstFightOrShotPending;
    const firstStandardAction = context.firstStandardAction ?? runtime.firstStandardActionPending;
    const firstAgainstSource = context.firstAgainstSource ?? context.firstAgainstFearInTurn ?? runtime.firstAgainstSourcePending;
    const afterDamage = context.afterDamage ?? runtime.afterDamage;
    const paActionsThisTurn = finite(context.paActionsThisTurn ?? runtime.paActionsThisTurn);
    let conditionalTest = 0;
    let disadvantage = 0;

    function addModifier(effect, label, target, value, conditional = false, applies = true) {
      modifiers.push({ sourceId: effect.id, sourceName: effect.name, label, target, value, conditional, applies });
    }
    function allTests(effect, amount) {
      adjustments.globalTest += amount;
      addModifier(effect, "Todos os Testes", "tests", amount);
    }
    function skills(effect, names, amount) {
      for (const name of names) adjustments.skillTests[name] = (adjustments.skillTests[name] || 0) + amount;
      addModifier(effect, names.join(", "), "skills", amount);
    }
    function conditional(effect, label, amount, applies) {
      if (applies) conditionalTest += amount;
      addModifier(effect, label, "tests", amount, true, applies);
    }
    function disadvantageFor(effect, label, applies) {
      if (applies) disadvantage += 1;
      addModifier(effect, label, "disadvantage", 1, true, applies);
    }

    for (const effect of activeEffects) {
      if (effect.type === "condition" && immuneKeys.includes(effect.key)) {
        notes.push({ id: effect.id, name: effect.name, description: effect.description, category: effect.category, suppressed: true, reason: "Petrificado: imunidade a esta Condição." });
        continue;
      }
      notes.push({ id: effect.id, name: effect.name, description: effect.description, category: effect.category, derived: Boolean(effect.derived), automatic: Boolean(effect.automatic), sourceName: effect.sourceName || "", rolls: effect.rolls });
      const key = effect.key;
      if (effect.type === "wound") {
        if (key === "dor-persistente") { flags.paFirstStandard += 1; addModifier(effect, "Primeira Ação Padrão do Turno", "paCost", 1, true, Boolean(context.standardAction && firstStandardAction)); }
        if (key === "movimentacao-comprometida") { adjustments.movementFlat -= 2; addModifier(effect, "Deslocamento", "movement", -2); }
        if (key === "coordenacao-prejudicada") disadvantageFor(effect, "Primeira Rolagem de Luta ou Pontaria do Turno", ["luta", "pontaria"].includes(skillName) && Boolean(firstFightOrShot));
        if (key === "reflexos-abalados") flags.evasionCannotRaiseHardMargin = true;
        if (key === "guarda-comprometida") { adjustments.blockConstitution = true; addModifier(effect, "Bloqueio sem Constituição", "block", -Math.max(0, finite(context.constitution))); }
        if (key === "folego-curto") flags.paAfterFirstAction += 1;
        if (key === "sensibilidade-ao-impacto") flags.firstIncomingDamageExtraDice += 1;
        if (key === "instabilidade") disadvantageFor(effect, "Primeira Rolagem após sofrer dano", Boolean(afterDamage));
        if (key === "ferimento-limitante") {
          const selected = effect.chosenSkill || effect.skillName || context.limitingSkills?.[effect.id] || context.limitingSkill;
          const valid = limitedSkills.find((name) => normalizeKey(name) === normalizeKey(selected));
          if (!valid) flags.unavailableLimitingSkill = true;
          disadvantageFor(effect, valid ? `Rolagens de ${valid}` : "Escolher Luta, Pontaria, Reflexos, Atletismo ou Fortitude", Boolean(valid && skillName === normalizeKey(valid)));
        }
      } else if (effect.type === "fear") {
        if (key === "assustado-sobressalto") conditional(effect, "Primeiro Teste do Turno", -2, Boolean(firstTest));
        if (key === "assustado-tremor") conditional(effect, "Testes de precisão física", -2, Boolean(context.physicalPrecision || context.precision || ["luta", "pontaria", "crime"].includes(skillName)));
        if (key === "assustado-distracao") { skills(effect, ["Intuição", "Sentidos"], -2); if ((sensesNames.includes(skillName) || context.senses) && !["sentidos", "intuicao"].includes(skillName)) conditional(effect, "Testes de Sentidos", -2, true); }
        if (key === "assustado-hesitacao") conditional(effect, "Primeiro Teste contra a fonte do Medo no Turno", -2, againstSource && Boolean(firstAgainstSource));
        if (key === "ansioso-agitacao") allTests(effect, -2);
        if (["ansioso-hipervigilancia", "desesperado-colapso", "desesperado-desespero-absoluto"].includes(key)) flags.noCombatReactions = true;
        if (key === "ansioso-inquietacao") { adjustments.movementHalf = true; addModifier(effect, "Deslocamento pela metade", "movementMultiplier", 0.5); }
        if (key === "ansioso-bloqueio-mental") conditional(effect, "Concentração, raciocínio ou controle emocional", -3, Boolean(context.concentration));
        if (["apavorado-fuga-instintiva", "desesperado-panico"].includes(key)) flags.mustWithdrawFromFear = true;
        if (key === "apavorado-paralisia") { flags.movementActionBlocked = true; allTests(effect, -2); }
        if (["apavorado-incapaz-de-enfrentar", "desesperado-panico"].includes(key)) flags.approachFearBlocked = true;
        if (key === "apavorado-incapaz-de-enfrentar") flags.requireWillAgainstFear = true;
        if (key === "desesperado-terror-paralisante") flags.oneMainAction = true;
        if (key === "desesperado-desespero-absoluto") flags.mustWithdrawFromFearWhenSafe = true;
        // Colapso's -2 is the same penalty described by its implied Caído.
      } else {
        if (key === "sangrando") flags.regenerationMultiplier = 0.5;
        if (["atordoado", "caido"].includes(key)) allTests(effect, -2);
        if (key === "caido") { adjustments.defense.projectile += 3; adjustments.defense.melee -= 5; addModifier(effect, "Defesa contra projéteis", "defenseProjectile", 3); addModifier(effect, "Defesa contra ataques corpo a corpo", "defenseMelee", -5); }
        if (["imobilizado", "imovel"].includes(key)) adjustments.movementBlocked = true;
        if (key === "lento") { adjustments.movementHalf = true; addModifier(effect, "Deslocamento pela metade", "movementMultiplier", 0.5); }
        if (key === "exausto") skills(effect, ["Fortitude"], -2);
        if (key === "enjoado") flags.oneMainAction = true;
        if (key === "desprevenido") { adjustments.defense.global -= 3; flags.nextIncomingAttackCriticalMarginDelta -= 1; addModifier(effect, "Defesa", "defense", -3); addModifier(effect, "Margem de Crítico do próximo ataque recebido", "incomingCriticalMargin", -1, true); }
        if (key === "cego") flags.automaticFailureSenses.push("Ver");
        if (key === "surdo") flags.automaticFailureSenses.push("Ouvir");
        if (key === "silenciado") flags.noSpeech = true;
        if (key === "petrificado") { flags.physicalRD = Math.max(flags.physicalRD, 10); addModifier(effect, "RD Física", "physicalRD", 10); }
        if (key === "imovel") { flags.standardActionBlocked = true; flags.movementActionBlocked = true; flags.interferenceActionBlocked = true; }
        if (key === "fragilizado") addModifier(effect, "PV Máximos", "maxPV", -10);
        if (key === "debilitado") skills(effect, ["Acrobacia", "Atletismo", "Fortitude", "Furtividade", "Luta", "Pontaria", "Reflexos"], -3);
        if (key === "vulneravel") { adjustments.defense.nextHit -= 3; flags.nextIncomingDamageExtraDice += 1; addModifier(effect, "Defesa para o próximo ataque que atingir", "defenseNextHit", -3, true, Boolean(context.incomingAttack)); addModifier(effect, "Próximo ataque que atingir", "incomingDamageDice", 1, true); }
        if (key === "confuso") { skills(effect, ["Intuição", "Sentidos"], -2); if ((sensesNames.includes(skillName) || context.senses) && !["sentidos", "intuicao"].includes(skillName)) conditional(effect, "Testes de Sentidos", -2, true); }
        if (key === "amedrontado") { flags.approachFearBlocked = true; conditional(effect, "Testes contra a fonte do Medo", -2, againstSource); }
        if (key === "perturbado") skills(effect, ["Vontade"], -2);
        if (key === "encantado") conditional(effect, "Testes Opostos contra quem o Encantou", -2, Boolean(context.opposed && (context.againstEnchantingSource || context.againstSource)));
        if (key === "desorientado") { flags.noCombatReactions = true; conditional(effect, "Percepção e orientação", -2, Boolean(context.perception || context.senses || perceptionSkills.includes(skillName))); }
        if (key === "frustrado") { flags.frustrated = true; skills(effect, ["Vontade"], -2); addModifier(effect, "SA perdida ao falhar em um Teste", "failureSA", -1, true); }
        if (key === "selado") flags.magicSealed = true;
        if (key === "intangivel") { flags.intangible = true; flags.physicalDamageImmune = true; }
      }
    }
    const skillAdjustment = Object.entries(adjustments.skillTests).reduce((sum, [name, value]) => sum + (normalizeKey(name) === skillName ? value : 0), 0);
    const constitution = Math.max(0, finite(context.constitution));
    const movement = Math.max(0, finite(context.movement, 6) + adjustments.movementFlat);
    const defenseType = context.attackType === "projectile" ? adjustments.defense.projectile : context.attackType === "melee" ? adjustments.defense.melee : 0;
    const standardSurcharge = context.standardAction && firstStandardAction ? flags.paFirstStandard : 0;
    const hasPACost = finite(context.paCost) > 0 || standardSurcharge > 0;
    const laterActionSurcharge = hasPACost && paActionsThisTurn >= 1 ? flags.paAfterFirstAction : 0;
    for (const effect of activeEffects) if (effect.type === "wound" && effect.key === "folego-curto") addModifier(effect, "Segunda Ação com custo em PA e seguintes", "paCost", 1, true, hasPACost && paActionsThisTurn >= 1);
    adjustments.disadvantage = disadvantage;
    return {
      effects, derivedEffects, activeEffects, suppressedEffects, notes, adjustments, modifiers, flags, resources, runtime,
      limits: { wound: woundLimit(resources.pv.max), spirit: spirit(resources.sa.max) },
      effectiveMovement: adjustments.movementBlocked ? 0 : movement * (adjustments.movementHalf ? 0.5 : 1),
      effectiveBlock: Math.max(0, finite(context.block) - (adjustments.blockConstitution ? constitution : 0)),
      testPenalty: adjustments.globalTest + skillAdjustment + conditionalTest,
      disadvantage,
      defensePenalty: adjustments.defense.global + defenseType + (context.incomingAttack ? adjustments.defense.nextHit : 0),
      paSurcharge: standardSurcharge + laterActionSurcharge,
      incomingDamageDiceBonus: flags.nextIncomingDamageExtraDice + (context.firstDamageThisRound ? flags.firstIncomingDamageExtraDice : 0),
      automaticFailure: flags.automaticFailureSenses.some((name) => normalizeKey(name) === skillName || normalizeKey(name) === normalizeKey(context.sense)),
    };
  }

  function rollDie(sides, rng) {
    const sample = finite((typeof rng === "function" ? rng : Math.random)());
    return Math.min(sides, Math.max(1, Math.floor(Math.min(1, Math.max(0, sample)) * sides) + 1));
  }

  function resolveTurn(values, phase, rng, resourceSnapshot = {}, runtimeSnapshot = {}) {
    const effects = normalizeEffects(values);
    // resources.max remains the base maximum in the returned storage snapshot.
    const resources = resourceValues(resourceSnapshot);
    const before = copy(resources);
    let runtime = { ...runtimeSnapshot };
    const initial = summarize(effects, resources, { runtime });
    runtime = initial.runtime;
    if (initial.adjustments.maxPV) resources.pv.current = initial.resources.pv.current;
    const rolls = [];
    let skipTurn = false;
    let consumedEffectIds = [];
    let resultEffects = effects;
    const active = initial.activeEffects.filter((effect) => !(effect.type === "condition" && initial.flags.immuneConditionKeys.includes(effect.key)));
    function applyPeriodic(effect, die, resource, sign, damageType) {
      const result = rollDie(die, rng);
      const oldValue = resources[resource].current;
      resources[resource].current = sign > 0 ? oldValue + Math.min(result, Math.max(0, resources[resource].max - oldValue)) : Math.max(0, oldValue - result);
      rolls.push({ effectId: effect.id, label: effect.name, die: `1d${die}`, result, resource, delta: resources[resource].current - oldValue, ...(damageType ? { damageType } : {}) });
    }
    if (phase === "start") {
      runtime = { ...runtime, firstTestPending: true, firstFightOrShotPending: true, firstStandardActionPending: true, firstAgainstSourcePending: true, paActionsThisTurn: 0, afterDamage: false };
      for (const effect of active) if (effect.type === "condition" && effect.key === "eletrocutado") {
        const result = rollDie(4, rng);
        skipTurn ||= result === 1;
        rolls.push({ effectId: effect.id, label: effect.name, die: "1d4", result, skipTurn: result === 1 });
      }
      runtime.skipTurn = skipTurn;
    } else if (phase === "end") {
      // Losses precede recovery, so effects that reach 0 PA trigger Exausto even
      // if Energizado restores fewer than 5 PA later in the same resolution.
      for (const effect of active) {
        if (effect.type !== "condition") continue;
        if (effect.key === "sangrando") applyPeriodic(effect, 6, "pv", -1, "Sangue");
        if (effect.key === "queimando") applyPeriodic(effect, 6, "pv", -1, "Flamejante");
        if (effect.key === "congelando") applyPeriodic(effect, 4, "pa", -1);
        if (effect.key === "drenado") applyPeriodic(effect, 6, "pa", -1);
        if (effect.key === "corrompido-pelo-abismo") applyPeriodic(effect, 6, "sa", -1);
        if (resources.pa.max > 0 && resources.pa.current <= 0) runtime.exhausted = true;
      }
      for (const effect of active) if (effect.type === "condition" && effect.key === "energizado") applyPeriodic(effect, 6, "pa", 1);
    } else if (phase === "hit") {
      consumedEffectIds = effects.filter((effect) => effect.type === "condition" && ["desprevenido", "vulneravel"].includes(effect.key)).map((effect) => effect.id);
      resultEffects = effects.filter((effect) => !consumedEffectIds.includes(effect.id));
      runtime.afterDamage = true;
    }
    const summary = summarize(resultEffects, resources, { runtime });
    runtime = summary.runtime;
    return { effects: resultEffects, resources, runtime, rolls, deltas: Object.fromEntries(["pv", "pa", "sa"].map((key) => [key, resources[key].current - before[key].current])), skipTurn, consumedEffectIds, summary };
  }

  function resolveFailure(values, resourceSnapshot = {}, context = {}, runtimeSnapshot = {}) {
    const resources = resourceValues(resourceSnapshot);
    const summary = summarize(values, resources, { ...context, runtime: runtimeSnapshot });
    const oldValue = resources.sa.current;
    if (summary.flags.frustrated && context.failed !== false) resources.sa.current = Math.max(0, resources.sa.current - 1);
    return { effects: summary.effects, resources, runtime: summary.runtime, deltas: { pv: 0, pa: 0, sa: resources.sa.current - oldValue }, summary: summarize(values, resources, { ...context, runtime: summary.runtime }) };
  }

  global.AbyssStatusEffects = Object.freeze({ createWound, createFear, createCondition, normalizeEffects, getCatalog, summarize, woundLimit, spirit, resolveTurn, resolveFailure });
})(typeof window !== "undefined" ? window : globalThis);
