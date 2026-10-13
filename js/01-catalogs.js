
"use strict";

const portugueseCollator = new Intl.Collator("pt-BR", { sensitivity: "base" });
let skillFilterEntries = [];

const ATTRIBUTES = {
  FOR: "Força",
  AGI: "Agilidade",
  INT: "Intelecto",
  CON: "Constituição",
  POD: "Poder",
};

const SKILLS = [
  { name: "Acrobacia", attribute: "AGI" },
  { name: "Adestramento", attribute: "POD" },
  { name: "Alquimia", attribute: "INT" },
  { name: "Arcanismo", attribute: "POD" },
  { name: "Artes", attribute: "POD" },
  { name: "Atletismo", attribute: "FOR" },
  { name: "Ciências", attribute: "INT" },
  { name: "Crime", attribute: "AGI" },
  { name: "Diplomacia", attribute: "POD" },
  { name: "Enganação", attribute: "POD" },
  { name: "Fortitude", attribute: "CON" },
  { name: "Furtividade", attribute: "AGI" },
  { name: "Intimidação", attribute: "POD" },
  { name: "Intuição", attribute: "POD" },
  { name: "Investigação", attribute: "INT" },
  { name: "Linguística", attribute: "INT" },
  { name: "Luta", attribute: "FOR" },
  { name: "Medicina", attribute: "INT" },
  { name: "Monstrologia", attribute: "INT" },
  { name: "Ofício", attribute: "INT" },
  { name: "Pilotagem", attribute: "AGI" },
  { name: "Pontaria", attribute: "AGI" },
  { name: "Reflexos", attribute: "AGI" },
  { name: "Religião", attribute: "INT" },
  { name: "Sobrevivência", attribute: "INT" },
  { name: "Tática", attribute: "INT" },
  { name: "Tecnologia", attribute: "INT" },
  { name: "Vontade", attribute: "POD" },
];

const SKILL_DETAILS = {
  Acrobacia: {
    description: "Acrobacia representa seu equilíbrio, flexibilidade, coordenação corporal e capacidade de realizar movimentos precisos ou incomuns.",
    uses: [
      { name: "Amortecer Queda", text: "Você se posiciona corretamente durante uma queda para reduzir o impacto. Em um Sucesso, você reduz o dano num valor igual ao dobro do seu Bloqueio." },
      { name: "Equilibrar", text: "Você atravessa superfícies estreitas, instáveis, escorregadias ou em movimento sem perder o equilíbrio." },
      { name: "Levantar Rapidamente", text: "Você tenta abandonar a condição Caído utilizando apenas uma ação de Movimento. Em caso de falha, permanece Caído." },
      { name: "Escapar", text: "Você utiliza flexibilidade e movimentação corporal para escapar de amarras, espaços apertados ou outras contenções apropriadas." },
      { name: "Manobra Acrobática", text: "Você realiza um movimento corporal complexo ou incomum, como um giro, rolamento, cambalhota ou outra manobra que exija coordenação e precisão." },
    ],
  },
  Adestramento: {
    description: "Adestramento representa sua capacidade de compreender, acalmar, cuidar e conduzir animais.",
    uses: [
      { name: "Entender Animal", text: "Você observa a postura, vocalizações e comportamento de um animal para compreender aproximadamente seu estado, emoções, necessidades ou intenções." },
      { name: "Acalmar Animal", text: "Você tenta diminuir o medo, hostilidade ou agitação de um animal através da sua postura, aproximação e interação." },
      { name: "Conduzir Animal", text: "Você utiliza uma ação de Movimento para instruir um animal a realizar uma ação que ele já conhece ou foi treinado para fazer. Normalmente, um teste só é necessário quando houver alguma dificuldade, resistência ou circunstância que possa impedir o animal de obedecer." },
      { name: "Cuidar de Animal", text: "Você realiza cuidados básicos necessários ao bem-estar de um animal, podendo alimentá-lo, higienizá-lo, manejá-lo adequadamente ou reconhecer necessidades simples através de seu comportamento e condição." },
    ],
  },
  Alquimia: {
    description: "Alquimia representa sua capacidade de identificar, coletar e manipular substâncias e componentes utilizados na produção de preparos alquímicos.",
    uses: [
      { name: "Identificar", text: "Você analisa uma substância alquímica conhecida ou os efeitos produzidos por ela para reconhecer suas propriedades e riscos gerais. A quantidade e precisão das informações obtidas dependem daquilo que estiver disponível para análise." },
      { name: "Coletar Componentes", text: "Você extrai e preserva materiais de criaturas, plantas ou ambientes para que possam ser utilizados como componentes alquímicos. Esse Uso não permite, por si só, localizar ou reconhecer componentes cuja identificação dependa de outro conhecimento." },
      { name: "Preparar", text: "Você produz uma fórmula alquímica que conheça, desde que possua os componentes, equipamentos e tempo necessários para seu preparo." },
    ],
  },
  Arcanismo: {
    description: "Arcanismo representa sua capacidade de compreender, manipular e utilizar as forças sobrenaturais envolvidas na feitiçaria.",
    uses: [
      { name: "Identificar Afinidade", text: "Você analisa a energia sobrenatural presente em um ser para tentar identificar sua Afinidade com Umbra, Lumen, Caos, Éter ou Ley." },
      { name: "Identificar Feitiço", text: "Você observa uma manifestação mágica ou seus efeitos para compreender sua natureza, função ou efeito geral." },
      { name: "Analisar Artefato", text: "Você examina um objeto sobrenatural para reconhecer a presença de magia e identificar propriedades mágicas evidentes." },
    ],
  },
  Artes: {
    description: "Artes representa sua capacidade de criar, interpretar e executar diferentes formas de expressão artística.",
    uses: [
      { name: "Atuar", text: "Quando estiver interpretando conscientemente um papel, emoção ou personalidade, você pode utilizar Artes no lugar de Enganação quando a mentira depender diretamente da qualidade da sua atuação." },
      { name: "Criar Obra", text: "Você cria uma obra artística utilizando os recursos e o tempo apropriados, como um desenho, pintura, composição, texto, escultura ou outra forma de expressão. A Zona de Dificuldade depende da complexidade, qualidade pretendida e condições disponíveis durante a criação." },
      { name: "Apresentar", text: "Você realiza uma apresentação artística buscando entreter, emocionar ou impressionar aqueles que a presenciam. Quando obtiver a Margem Necessária, recebe +1d4 em testes sociais contra indivíduos positivamente influenciados pela apresentação durante o restante da cena. Apesar disso, falhas podem acarretar no efeito oposto." },
      { name: "Analisar Obra", text: "Você examina uma obra artística para reconhecer características perceptíveis de sua produção, como técnica, estilo, qualidade, materiais utilizados ou possíveis influências." },
    ],
  },
  Atletismo: {
    description: "Atletismo representa sua capacidade de aplicar força, condicionamento e potência corporal em atividades físicas.",
    uses: [
      { name: "Correr", text: "Com uma Ação Completa, percorra seu Deslocamento + FOR + 1d6Q." },
      { name: "Escalar", text: "Com uma Ação de Movimento, tente subir uma superfície escalável.\nParcial: 1/4 do Deslocamento.\nNormal: 1/2 do Deslocamento.\nBom: Deslocamento completo.\nExtremo: Deslocamento + 2Q." },
      { name: "Nadar e Mergulhar", text: "Com uma Ação de Movimento, tente se deslocar pela água.\nParcial: 1/2 do Deslocamento.\nNormal: Deslocamento completo.\nBom: Deslocamento + 2Q.\nExtremo: Deslocamento + 4Q." },
      { name: "Saltar", text: "Com uma Ação de Movimento, realize um salto horizontal ou vertical de FOR + 1d10Q. Em saltos verticais, reduza a distância pela metade. Condições adversas podem exigir um teste." },
      { name: "Levantar", text: "Você tenta erguer, mover ou sustentar um objeto. Faça um teste de [FOR] Atletismo e atinja a Margem Necessária, determinada pelo peso e condições da tentativa. Resultados superiores podem permitir maior peso ou duração. Uma Falha Crítica pode fazê-lo perder o controle do objeto e acarretar em ferimentos." },
      { name: "Arremessar", text: "Você arremessa um objeto que consiga segurar a uma distância de FOR + 1d8Q. Objetos pesados ou difíceis de manejar podem reduzir essa distância ou exigir um teste. [AGI] Pontaria pode ser exigida para determinar a precisão. Arremessar não é um teste de ataque." },
    ],
  },
  Ciências: {
    description: "Ciências representa sua capacidade de compreender fenômenos através de observação, lógica, evidências e aplicação do método científico. Ela não representa domínio absoluto sobre todas as áreas acadêmicas, mas permite interpretar informações científicas gerais, formular hipóteses e reconhecer relações entre causas e efeitos.",
    uses: [
      { name: "Analisar Fenômeno", text: "Você observa um fenômeno, material, ambiente ou acontecimento e utiliza conhecimentos científicos gerais para compreender o que provavelmente está acontecendo. Um sucesso pode revelar propriedades evidentes, comportamentos observáveis ou causas prováveis para aquilo que está sendo analisado." },
      { name: "Método Científico", text: "Você organiza informações, observações e evidências para determinar como uma hipótese poderia ser testada. Um sucesso pode revelar quais dados ainda precisam ser obtidos, quais variáveis devem ser controladas ou quais procedimentos permitiriam validar uma explicação." },
      { name: "Comparar Evidências", text: "Você compara amostras, registros, medições ou fenômenos para identificar padrões, semelhanças, diferenças e possíveis relações entre eles." },
    ],
  },
  Crime: {
    description: "Crime representa sua habilidade com atividades clandestinas, furtos, invasões e técnicas de ladinagem.",
    uses: [
      { name: "Arrombar", text: "Você tenta superar uma fechadura, tranca ou mecanismo de segurança através de ferramentas ou manipulação. A Zona de Dificuldade depende da complexidade e das proteções do mecanismo." },
      { name: "Furtar", text: "Você retira discretamente um objeto da posse de alguém ou de um local observado sem ser percebido. Normalmente é resistido por Sentidos." },
      { name: "Plantar", text: "Você coloca discretamente um objeto em posse de alguém ou em determinado local sem ser percebido. Normalmente é resistido por Sentidos." },
      { name: "Sabotar", text: "Você interfere no funcionamento de um objeto, mecanismo ou equipamento para comprometê-lo ou alterar seu funcionamento. Para realizar a sabotagem sem ser percebido, você deve utilizar [AGI] Crime em conjunto com [AGI] Furtividade." },
    ],
  },
  Diplomacia: {
    description: "Diplomacia representa sua capacidade de persuadir, negociar e estabelecer relações através da comunicação.",
    uses: [
      { name: "Persuadir", text: "Você tenta negociar ou convencer alguém através de argumentos, carisma e boa comunicação. Normalmente é resistido por Vontade. O Mestre pode considerar um argumento suficientemente convincente como um sucesso sem exigir um teste." },
      { name: "Acalmar", text: "Você tenta diminuir tensões, conflitos ou estados emocionais intensos através da comunicação. Pode ser utilizado para retirar alguém da condição Enlouquecendo." },
      { name: "Inspirar Confiança", text: "Você transmite credibilidade e boas intenções para melhorar a atitude de alguém em relação a você. Normalmente é resistido por Vontade." },
    ],
  },
  Enganação: {
    description: "Enganação representa sua capacidade de mentir, blefar, manipular percepções e esconder suas verdadeiras intenções.",
    uses: [
      { name: "Lábia", text: "Você mente, omite ou distorce informações para levar alguém a acreditar em uma versão falsa ou incompleta dos fatos. Normalmente é resistido por Intuição." },
      { name: "Fintar", text: "Com uma Ação de Movimento, você engana um inimigo para deixá-lo Desprevenido contra seu próximo ataque. Normalmente é resistido por Reflexos ou Sentidos." },
      { name: "Disfarçar Intenções", text: "Você esconde seus verdadeiros objetivos, emoções ou motivações, dificultando que outras pessoas percebam o que realmente pretende ou sente. Normalmente é resistido por Intuição." },
      { name: "Trapacear", text: "Ao participar de um jogo, aposta, competição ou atividade em que seja possível obter vantagem através de trapaça, você pode realizar um teste de Enganação. Em caso de sucesso, recebe +1d4 no próximo teste diretamente relacionado àquela atividade. O resultado desse dado é somado ao valor do teste. A trapaça pode ser resistida por Sentidos ou Intuição de alguém que deseja percebê-la; caso seja descoberta, as consequências dependem da situação." },
    ],
  },
  Fortitude: {
    description: "Fortitude representa a resistência do seu organismo contra dor, exaustão, doenças, venenos e outras condições capazes de comprometer fisicamente seu corpo.",
    uses: [
      { name: "Resistir", text: "Você utiliza Fortitude sempre que seu corpo precisa suportar ou superar uma condição física adversa, como dor intensa, venenos, doenças, exaustão, privação, falta de ar, temperaturas extremas ou outros efeitos que ameacem diretamente seu organismo. A Zona de Dificuldade, a Margem Necessária e as consequências de uma falha dependem da fonte do efeito." },
    ],
  },
  Furtividade: {
    description: "Furtividade representa sua capacidade de esconder sua presença, mover-se silenciosamente e evitar ser percebido.",
    notes: ["Enquanto estiver se movendo furtivamente, seu Deslocamento normalmente é reduzido pela metade."],
    uses: [
      { name: "Ocultar Presença", text: "Você tenta permanecer despercebido utilizando cobertura, silêncio, iluminação, camuflagem ou outros elementos disponíveis no ambiente. Seu teste normalmente é resistido por Sentidos de quem possuir a possibilidade de percebê-lo." },
      { name: "Espreitar", text: "Você segue ou observa um alvo sem revelar sua presença. Enquanto estiver Espreitando, o mesmo resultado de Furtividade pode ser mantido; um novo teste é necessário caso a situação mude de forma significativa ou o alvo passe a procurar ativamente por você." },
    ],
  },
  Intimidação: {
    description: "Intimidação representa sua capacidade de provocar medo, pressão ou submissão através de presença, palavras ou comportamento.",
    uses: [
      { name: "Coagir", text: "Você utiliza ameaças, violência, pressão ou medo para tentar fazer alguém cooperar, recuar, entregar uma informação ou realizar determinada ação. A ameaça deve ser crível e capaz de influenciar o alvo naquela situação. Normalmente é resistido por Vontade." },
      { name: "Impor Presença", text: "Você utiliza postura, reputação ou demonstração de autoridade para intimidar alguém sem necessariamente exigir algo diretamente. Em caso de sucesso, o alvo pode hesitar em confrontá-lo, aproximar-se ou agir de maneira hostil enquanto sua presença continuar relevante. Normalmente é resistido por Vontade." },
    ],
  },
  Intuição: {
    description: "Intuição representa sua capacidade de interpretar comportamentos, emoções e intenções através da forma como alguém fala, age e reage.",
    uses: [
      { name: "Perceber Mentira", text: "Você tenta identificar se alguém está escondendo, distorcendo ou inventando informações durante uma interação. Um sucesso indica que algo naquela fala parece falso, mas não revela automaticamente qual é a verdade. Geralmente é um teste contra Enganação." },
      { name: "Ler Intenções", text: "Você tenta compreender a intenção imediata de alguém através de seu comportamento, como perceber se pretende atacar, fugir, negociar, enganar ou tomar alguma atitude semelhante. Geralmente é um teste contra Enganação caso o alvo esteja tentando ocultar suas intenções." },
      { name: "Interpretar Emoção", text: "Você identifica o estado emocional predominante de alguém, como medo, raiva, ansiedade, culpa ou entusiasmo. Caso o alvo esteja deliberadamente escondendo suas emoções, o teste geralmente é realizado contra Enganação." },
    ],
  },
  Investigação: {
    description: "Investigação representa sua capacidade de analisar evidências, relacionar informações e reconstruir acontecimentos.",
    uses: [
      { name: "Examinar Cena", text: "Você analisa um ambiente, objeto ou acontecimento em busca de pistas, alterações, inconsistências ou detalhes relevantes capazes de ajudar a compreender o que ocorreu." },
      { name: "Interpretar Evidência", text: "Você analisa uma pista incompleta, danificada ou ambígua para determinar quais informações ainda podem ser extraídas dela. Quanto maior a Margem de Sucesso, mais precisa ou completa pode ser a informação obtida." },
      { name: "Relacionar Evidências", text: "Você conecta duas ou mais pistas ou informações já conhecidas para determinar relações entre elas e formular uma hipótese plausível sobre os acontecimentos. Resultados superiores podem revelar conexões adicionais sustentadas pelas evidências disponíveis." },
    ],
  },
  Linguística: {
    description: "Linguística representa sua capacidade de compreender estruturas de linguagem, sistemas de escrita e diferentes formas de comunicação.",
    uses: [
      { name: "Decifrar Linguagem", text: "Você utiliza estrutura, contexto, padrões e conhecimentos linguísticos para extrair informações de uma mensagem escrita ou falada em um idioma que não compreende. Um sucesso revela seu sentido geral; resultados superiores podem revelar detalhes mais específicos." },
      { name: "Analisar Linguagem", text: "Você examina um idioma, dialeto, escrita ou padrão de comunicação para identificar sua provável origem, relações com outras línguas, alterações, influências ou características incomuns." },
      { name: "Comunicar", text: "Quando não compartilha um idioma com alguém, você pode tentar transmitir ou compreender informações simples através de palavras reconhecíveis, contexto, gestos e padrões de comunicação. Quanto mais complexa ou abstrata a mensagem, maior sua dificuldade." },
    ],
  },
  Luta: {
    description: "Luta representa sua capacidade de combater corpo a corpo, sendo utilizada em ataques e outras ações de combate que dependam diretamente de técnica, força ou domínio corporal.",
    uses: [],
  },
  Medicina: {
    description: "Medicina representa sua capacidade de avaliar ferimentos, diagnosticar condições físicas e prestar cuidados médicos.",
    uses: [
      { name: "Primeiros Socorros", text: "Com uma Ação Padrão, você presta atendimento emergencial a um alvo em Morrendo. Em caso de sucesso, ele se estabiliza." },
      { name: "Diagnosticar", text: "Você analisa sintomas, ferimentos e sinais físicos para identificar a natureza geral de uma condição, sua gravidade e possíveis causas." },
      { name: "Tratar", text: "Com materiais apropriados, você realiza cuidados básicos em ferimentos, doenças ou outras condições que não exijam procedimentos especializados. O efeito depende da condição tratada e da Margem de Sucesso obtida." },
    ],
  },
  Monstrologia: {
    description: "Monstrologia representa seu conhecimento sobre criaturas perigosas, anormais e sobrenaturais, incluindo sua natureza, comportamento e características incomuns.",
    uses: [
      { name: "Identificar", text: "Você tenta reconhecer uma criatura, determinar sua natureza geral ou relacioná-la a seres previamente conhecidos. Resultados superiores podem revelar informações mais específicas sobre aquilo que é conhecido a respeito dela." },
      { name: "Analisar Criatura", text: "Você observa características físicas, comportamento, rastros ou manifestações de uma criatura para deduzir informações relevantes sobre ela, como padrões de comportamento, capacidades aparentes, resistências ou vulnerabilidades plausíveis. Informações que não possam ser deduzidas através das evidências disponíveis não são reveladas." },
    ],
  },
  Ofício: {
    description: "Ofício representa sua habilidade com trabalhos manuais, produção artesanal e outras atividades práticas que dependam do uso de técnicas, ferramentas e materiais.",
    notes: ["Ofício abrange atividades como culinária, carpintaria, ferraria, costura, joalheria, cerâmica, construção e outros trabalhos artesanais ou manuais. Ele pode ser utilizado sempre que a atividade não for melhor representada por outra Perícia. Trabalhos que exijam conhecimento especializado podem possuir maior dificuldade ou exigir uma Competência adequada."],
    uses: [
      { name: "Produzir", text: "Com ferramentas, materiais e tempo adequados, você produz objetos, alimentos ou outros produtos através de técnicas que conheça. A dificuldade e o tempo necessários dependem da complexidade e qualidade pretendida." },
      { name: "Reparar", text: "Com ferramentas e materiais adequados, você restaura objetos ou estruturas que possam ser reparados através de trabalho manual." },
      { name: "Avaliar Trabalho", text: "Você examina um produto ou trabalho para reconhecer sua qualidade, materiais, técnicas empregadas e possíveis defeitos." },
    ],
  },
  Pilotagem: {
    description: "Pilotagem representa sua capacidade de controlar veículos quando a condução exige precisão, reação ou domínio técnico.",
    uses: [
      { name: "Controlar Veículo", text: "Você realiza um teste de Pilotagem quando precisa manter o controle de um veículo diante de condições adversas, como terreno difícil, perda de aderência, danos, obstáculos ou situações semelhantes." },
      { name: "Manobrar", text: "Você executa uma manobra arriscada ou tecnicamente difícil, como uma curva brusca, derrapagem, salto, passagem estreita ou mudança repentina de trajetória." },
      { name: "Perseguir", text: "Durante uma perseguição entre veículos, você utiliza Pilotagem para reduzir a distância até um alvo ou aumentar a distância de um perseguidor. O teste normalmente é resistido pela Pilotagem do outro condutor ou determinado pelas condições da perseguição." },
    ],
  },
  Pontaria: {
    description: "Pontaria representa sua capacidade de realizar ataques à distância e utilizar com precisão armas, projéteis ou outros meios de ataque à distância.",
    uses: [],
  },
  Reflexos: {
    description: "Reflexos representa sua capacidade de reagir fisicamente a perigos repentinos.",
    uses: [
      { name: "Reagir", text: "Você utiliza Reflexos para resistir a efeitos que possam ser evitados ou reduzidos através de velocidade, posicionamento ou reação física imediata, como explosões, armadilhas, ataques em área e outros perigos semelhantes." },
    ],
  },
  Religião: {
    description: "Religião representa seu conhecimento sobre crenças, tradições, mitologias, cultos e instituições religiosas.",
    uses: [
      { name: "Reconhecer Elemento", text: "Você identifica símbolos, objetos, vestimentas ou outros elementos associados a uma religião, culto ou tradição conhecida." },
      { name: "Interpretar Rito", text: "Você analisa uma prática, cerimônia, texto ou tradição religiosa para compreender seu significado, propósito ou relação com determinada crença." },
      { name: "Identificar Tradição", text: "Você compara costumes, ensinamentos e práticas para determinar a qual religião, culto ou tradição pertencem e reconhecer possíveis variações regionais ou históricas." },
    ],
  },
  Sobrevivência: {
    description: "Sobrevivência representa sua capacidade de permanecer vivo, encontrar recursos e se orientar em ambientes hostis.",
    uses: [
      { name: "Orientar", text: "Você determina sua posição, direção ou rota utilizando mapas, instrumentos ou informações fornecidas pelo próprio ambiente." },
      { name: "Rastrear", text: "Você segue sinais deixados pela passagem de pessoas, animais ou criaturas, identificando sua direção e alterações relevantes no percurso. Rastros suficientemente claros também podem revelar informações gerais sobre sua passagem." },
      { name: "Forragear", text: "Você procura alimento, água e recursos naturais básicos disponíveis no ambiente." },
      { name: "Preparar Abrigo", text: "Você identifica um local adequado ou utiliza recursos disponíveis para preparar um abrigo capaz de oferecer proteção contra condições ambientais adversas." },
    ],
  },
  Tática: {
    description: "Tática representa sua capacidade de interpretar confrontos, reconhecer oportunidades e coordenar ações durante situações de conflito.",
    uses: [
      { name: "Analisar Campo", text: "Você observa um confronto para identificar uma informação taticamente relevante, como uma posição vantajosa, ameaça prioritária, padrão de movimentação, rota de aproximação ou vulnerabilidade circunstancial. As informações obtidas devem ser plausíveis a partir daquilo que você é capaz de observar." },
      { name: "Coordenar", text: "Caso consiga se comunicar adequadamente com um aliado, você pode orientá-lo com base em uma informação ou oportunidade tática disponível. Em caso de sucesso, ele recebe +1d4 em sua próxima Rolagem diretamente relacionada à orientação fornecida." },
    ],
  },
  Tecnologia: {
    description: "Tecnologia representa sua capacidade de operar, compreender, reparar e manipular dispositivos e sistemas tecnológicos.",
    uses: [
      { name: "Operar", text: "Você utiliza equipamentos tecnológicos quando sua operação exigir conhecimento, precisão ou domínio técnico. Dispositivos simples ou familiares normalmente não exigem teste." },
      { name: "Analisar Sistema", text: "Você examina um dispositivo ou sistema tecnológico para compreender sua função, componentes, funcionamento geral ou possíveis formas de interação." },
      { name: "Diagnosticar", text: "Você examina um equipamento para identificar falhas, danos ou componentes responsáveis por seu funcionamento inadequado." },
      { name: "Reparar", text: "Com ferramentas, peças e condições adequadas, você tenta restaurar o funcionamento de um dispositivo danificado ou defeituoso." },
    ],
  },
  Vontade: {
    description: "Vontade representa sua força mental, disciplina e controle emocional diante de efeitos capazes de abalar ou influenciar sua mente.",
    uses: [
      { name: "Resistir", text: "Você utiliza Vontade para resistir ou superar efeitos que tentem afetar sua mente ou emoções, como medo, compulsões, manipulações sobrenaturais, sofrimento psicológico e outras formas de influência mental. A Zona de Dificuldade, a Margem Necessária e as consequências de uma falha dependem da fonte do efeito." },
    ],
  },
};

const COMPETENCY_TREES = {
  "Acrobacia": [
    {
      "name": "Domínio Acrobático",
      "description": "Você possui treinamento avançado em técnicas de movimentação e controle corporal, sabendo utilizar seu próprio corpo e os elementos ao seu redor para realizar movimentos acrobáticos de maneira eficiente.",
      "uses": [
        {
          "name": "Percurso Acrobático",
          "text": "Você pode atravessar obstáculos, mobiliários e outros elementos apropriados do cenário como parte do seu deslocamento, sem precisar interrompê-lo para realizar a manobra."
        }
      ],
      "specializations": [
        {
          "name": "Parkour",
          "ability": "Corrida Livre",
          "text": "Você domina técnicas de transposição de obstáculos e movimentação pelo ambiente. Durante seu deslocamento, pode utilizar paredes, obstáculos e estruturas para alcançar posições que normalmente exigiriam uma rota mais longa ou outra forma de movimentação."
        },
        {
          "name": "Ginástica",
          "ability": "Movimento Preciso",
          "text": "Você domina movimentos que exigem grande coordenação, equilíbrio e precisão corporal. Quando realizar um teste de Acrobacia envolvendo saltos, giros, aterrissagens, equilíbrio ou outros movimentos acrobáticos complexos, reduza a Zona de Dificuldade em um nível. Além disso, uma vez por turno, você pode combinar dois desses movimentos em um único teste de Acrobacia, desde que façam parte da mesma ação."
        },
        {
          "name": "Contorcionismo",
          "ability": "Corpo Flexível",
          "text": "Você possui domínio excepcional sobre a flexibilidade e os limites de movimentação do próprio corpo. Pode atravessar espaços extremamente estreitos e tentar escapar de contenções que normalmente impossibilitariam uma tentativa. Além disso, reduza em um nível a Zona de Dificuldade de testes de Acrobacia que dependam principalmente da sua flexibilidade corporal."
        }
      ]
    }
  ],
  "Adestramento": [
    {
      "name": "Manejo Animal",
      "description": "Você possui conhecimento técnico sobre comportamento, cuidado e treinamento animal, sendo capaz de reconhecer padrões comportamentais e desenvolver novos comandos através de condicionamento e prática.",
      "uses": [
        {
          "name": "Treinar",
          "text": "Durante Interlúdios ou outros períodos apropriados, você pode ensinar novos comandos, tarefas e comportamentos a um animal. O tempo e as condições necessárias dependem da complexidade do treinamento, da natureza do animal e daquilo que está sendo ensinado."
        },
        {
          "name": "Avaliar Animal",
          "text": "Você analisa o comportamento e a condição aparente de um animal para reconhecer sinais mais sutis de estresse, agressividade, condicionamento, maus-tratos, doença ou necessidades específicas. Esse Uso permite compreender aspectos relacionados ao comportamento e manejo do animal, mas não substitui conhecimentos médicos necessários para diagnosticar ou tratar ferimentos e doenças."
        }
      ],
      "specializations": [
        {
          "name": "Caninos",
          "ability": "Treinamento Canino",
          "text": "Você possui conhecimento aprofundado sobre o comportamento e treinamento de caninos. Reduza em um nível a Zona de Dificuldade de testes de Adestramento envolvendo seu manejo ou treinamento. Além disso, você pode treiná-los para desempenhar tarefas complexas, como rastreamento, guarda, busca, resgate ou identificação de odores."
        },
        {
          "name": "Equinos",
          "ability": "Cavaleiro",
          "text": "Você possui experiência aprofundada no manejo e condução de equinos. Reduza em um nível a Zona de Dificuldade de testes de Adestramento realizados para conduzir ou controlar um equino enquanto estiver montado. Além disso, animais adequadamente treinados por você podem ser conduzidos em situações de perigo, perseguição ou grande agitação sem se assustarem automaticamente diante de movimentos bruscos, ruídos ou ameaças."
        },
        {
          "name": "Aves",
          "ability": "Falcoaria",
          "text": "Você domina técnicas de criação, treinamento e manejo de aves. Pode treiná-las para desempenhar tarefas como reconhecimento, busca, caça, entrega ou transporte de pequenos objetos. Aves treinadas por você também podem reconhecer e responder a comandos previamente ensinados a grandes distâncias, desde que sejam capazes de percebê-los."
        },
        {
          "name": "Fauna Selvagem",
          "ability": "Manejo Selvagem",
          "text": "Você compreende o comportamento de animais não domesticados e sabe como se aproximar deles sem depender das mesmas técnicas utilizadas com animais acostumados à presença humana. Você pode tentar manejar e treinar animais selvagens que normalmente não aceitariam treinamento ou comandos humanos, desde que sua natureza permita algum grau de condicionamento."
        }
      ]
    }
  ],
  "Alquimia": [
    {
      "name": "Preparação Alquímica",
      "description": "Você domina processos de refinamento, estabilização e transformação de componentes, sendo capaz de manipulá-los para aplicações alquímicas mais complexas.",
      "uses": [
        {
          "name": "Refinar",
          "text": "Você purifica, trata ou estabiliza um componente bruto ou impuro para torná-lo apropriado para fórmulas mais complexas ou que exijam materiais refinados."
        },
        {
          "name": "Adaptar Componente",
          "text": "Ao preparar uma fórmula, você pode tentar substituir um de seus componentes por outro que possua propriedades semelhantes. Para realizar a substituição, deve atingir a Margem Necessária determinada pela compatibilidade entre os componentes e pela complexidade da fórmula."
        }
      ],
      "specializations": [
        {
          "name": "Toxicologia",
          "ability": "Produzir Toxina",
          "text": "Você domina a preparação e manipulação de substâncias nocivas. Pode desenvolver e produzir venenos, sedativos e outros compostos destinados a prejudicar ou alterar as funções de um organismo. Além disso, pode tentar identificar toxinas desconhecidas e compreender suas propriedades gerais sem precisar conhecer previamente sua fórmula."
        },
        {
          "name": "Farmacologia",
          "ability": "Produzir Medicamento",
          "text": "Você domina a preparação de substâncias destinadas a interagir beneficamente com um organismo. Pode desenvolver e produzir medicamentos, estimulantes e outros compostos utilizados para auxiliar na recuperação, tratamento ou aprimoramento temporário de suas funções."
        },
        {
          "name": "Explosivos",
          "ability": "Composto Reativo",
          "text": "Você domina a preparação e estabilização de compostos altamente reativos, podendo produzir substâncias capazes de gerar combustão, explosões ou outras reações violentas de maneira controlada. A potência e estabilidade do composto dependem da fórmula utilizada e dos componentes disponíveis."
        },
        {
          "name": "Extração",
          "ability": "Extrair Propriedade",
          "text": "Ao [Coletar Componentes] de uma criatura, planta ou material especial, você pode tentar preservar uma propriedade incomum presente em sua fonte. A propriedade deve ser passível de preservação através de processos alquímicos e pode ser posteriormente utilizada como componente de uma fórmula compatível."
        }
      ]
    }
  ],
  "Arcanismo": [
    {
      "name": "Arcanologia",
      "description": "Você estudou formalmente a estrutura da magia, suas Entidades, Afinidades e os fenômenos sobrenaturais associados à feitiçaria.",
      "uses": [
        {
          "name": "Teoria Arcana",
          "text": "Você possui conhecimento teórico sobre feitiçaria, Afinidades e fenômenos arcanos, podendo utilizar Sabedoria para obter respostas sobre questões técnicas relacionadas a esses assuntos como parte do conhecimento adquirido por seus estudos."
        },
        {
          "name": "Analisar Fluxo",
          "text": "Você analisa o fluxo de uma manifestação mágica para identificar interferências, alterações ou anormalidades presentes em sua estrutura."
        }
      ],
      "specializations": [
        {
          "name": "Umbra",
          "ability": "Conhecimento de Umbra",
          "text": "Ao analisar manifestações diretamente relacionadas a Umbra, reduza em um nível a Zona de Dificuldade do teste. Além disso, seu conhecimento especializado permite obter informações avançadas sobre seus fenômenos."
        },
        {
          "name": "Lumen",
          "ability": "Conhecimento de Lumen",
          "text": "Ao analisar manifestações diretamente relacionadas a Lumen, reduza em um nível a Zona de Dificuldade do teste. Além disso, seu conhecimento especializado permite obter informações avançadas sobre seus fenômenos."
        },
        {
          "name": "Caos",
          "ability": "Conhecimento de Caos",
          "text": "Ao analisar manifestações diretamente relacionadas ao Caos, reduza em um nível a Zona de Dificuldade do teste. Além disso, seu conhecimento especializado permite obter informações avançadas sobre seus fenômenos."
        },
        {
          "name": "Éter",
          "ability": "Conhecimento de Éter",
          "text": "Ao analisar manifestações diretamente relacionadas ao Éter, reduza em um nível a Zona de Dificuldade do teste. Além disso, seu conhecimento especializado permite obter informações avançadas sobre seus fenômenos."
        },
        {
          "name": "Ley",
          "ability": "Conhecimento de Ley",
          "text": "Ao analisar manifestações diretamente relacionadas a Ley, reduza em um nível a Zona de Dificuldade do teste. Além disso, seu conhecimento especializado permite obter informações avançadas sobre seus fenômenos."
        },
        {
          "name": "Artefatos",
          "ability": "Decifrar Artefato",
          "text": "Ao analisar um Artefato, você pode descobrir propriedades ocultas, condições de ativação, riscos ou possíveis formas de desativá-lo que não seriam reveladas através de uma análise comum."
        }
      ]
    }
  ],
  "Artes": [
    {
      "name": "Formação Artística",
      "description": "Você possui formação técnica na criação, análise e execução artística, compreendendo métodos, princípios e critérios utilizados profissionalmente em diferentes formas de arte.",
      "uses": [
        {
          "name": "Produzir Obra",
          "text": "Com o tempo, ferramentas e materiais apropriados, você pode produzir obras com qualidade técnica profissional, capazes de possuir valor artístico ou comercial. A qualidade final e o tempo necessário dependem da complexidade da obra e do resultado obtido."
        },
        {
          "name": "Avaliar Obra",
          "text": "Você realiza uma análise técnica de uma obra para determinar aspectos como sua qualidade, técnica empregada, período, influências, possível autoria e sinais de alteração ou falsificação. Quando aplicável, também pode estimar seu valor artístico ou comercial."
        }
      ],
      "specializations": [
        {
          "name": "Música",
          "ability": "Domínio Musical",
          "text": "Você possui conhecimento aprofundado sobre teoria, composição e execução musical, sendo capaz de utilizar adequadamente instrumentos com os quais tenha familiaridade, além da própria voz. Você pode compor, adaptar ou improvisar músicas através de Artes, mesmo durante uma apresentação. Além disso, após ouvir atentamente uma melodia por tempo suficiente, consegue memorizá-la e reproduzi-la posteriormente sem precisar realizar um novo teste apenas para recordá-la."
        },
        {
          "name": "Teatro",
          "ability": "Personificação",
          "text": "Você domina técnicas de interpretação e construção de personagens, sendo capaz de desenvolver e sustentar uma identidade fictícia através da voz, postura, comportamento e maneirismos. Enquanto estiver interpretando essa identidade, pode utilizar Artes no lugar de Enganação para sustentar sua personificação, inclusive durante interações prolongadas."
        },
        {
          "name": "Artes Visuais",
          "ability": "Reprodução",
          "text": "Você domina técnicas de representação e reprodução visual. Após estudar adequadamente uma imagem, símbolo, assinatura ou obra visual, pode tentar reproduzi-la com grande precisão. Além disso, pode utilizar Artes no lugar de Crime quando uma falsificação depender principalmente de habilidade artística, como na reprodução de pinturas, selos, assinaturas ou símbolos."
        },
        {
          "name": "Literatura",
          "ability": "Retórica Escrita",
          "text": "Você domina técnicas de escrita capazes de transmitir ideias e provocar reações específicas através do texto. Quando uma tentativa de persuadir, enganar ou impressionar alguém ocorrer exclusivamente através de um texto escrito por você, pode utilizar Artes no lugar da Perícia normalmente utilizada."
        },
        {
          "name": "Dança",
          "ability": "Expressão Corporal",
          "text": "Você domina técnicas de expressão e comunicação através de movimentos corporais coreografados. Pode utilizar Artes no lugar de Acrobacia quando o objetivo principal de um movimento for sua execução estética ou performática. Além disso, pode realizar [Apresentar] através de uma performance exclusivamente corporal, sem depender de fala ou acompanhamento musical."
        }
      ]
    }
  ],
  "Atletismo": [
    {
      "name": "Condicionamento Atlético",
      "description": "Você possui treinamento físico para utilizar seu corpo de maneira eficiente durante esforços intensos.",
      "uses": [
        {
          "name": "Manter Ritmo",
          "text": "Durante atividades físicas prolongadas, você pode utilizar Atletismo no lugar de Fortitude quando a principal dificuldade estiver relacionada ao condicionamento físico, e não à resistência contra uma ameaça direta ao organismo."
        }
      ],
      "specializations": [
        {
          "name": "Corrida",
          "ability": "Arrancada",
          "text": "Uma vez por turno, ao utilizar [Correr], aumente em +2Q a distância final percorrida."
        },
        {
          "name": "Escalada",
          "ability": "Escalada Técnica",
          "text": "Ao escalar superfícies que permitam o uso adequado de técnicas e apoios, reduza em um nível a Zona de Dificuldade do teste."
        },
        {
          "name": "Natação",
          "ability": "Natação Técnica",
          "text": "Você pode utilizar seu Deslocamento normal para se mover nadando, sem precisar realizar um teste de Atletismo. Condições adversas ou tentativas de nadar além desse limite ainda podem exigir um teste de [Nadar e Mergulhar]."
        },
        {
          "name": "Salto",
          "ability": "Impulsão",
          "text": "Ao utilizar [Saltar], aumente em +2Q a distância obtida, em saltos verticais, aumente +2Q antes de aplicar a redução."
        },
        {
          "name": "Levantamento",
          "ability": "Força Aplicada",
          "text": "Ao tentar levantar, empurrar ou arrastar uma carga extrema, reduza em um nível a Zona de Dificuldade do teste."
        }
      ]
    }
  ],
  "Ciências": [
    {
      "name": "Ciências Exatas",
      "description": "Você possui formação em áreas que utilizam cálculo, medição e modelos para compreender matéria, energia e fenômenos mensuráveis.",
      "uses": [
        {
          "name": "Análise Quantitativa",
          "text": "Você realiza cálculos e estimativas a partir das informações disponíveis, determinando valores como distância, velocidade, proporção, quantidade, pressão, intensidade, duração ou outras grandezas mensuráveis."
        },
        {
          "name": "Projetar Resultado",
          "text": "Quando possuir informações suficientes sobre um fenômeno mensurável, você pode estimar o que acontecerá caso uma de suas condições seja alterada."
        },
        {
          "name": "Determinar Precisão",
          "text": "Você analisa medições, dados ou resultados para identificar margens de erro, inconsistências ou valores incompatíveis com o comportamento esperado."
        },
        {
          "name": "Dimensionar",
          "text": "Você determina aproximadamente quais quantidades, medidas ou proporções seriam necessárias para alcançar um resultado específico."
        }
      ],
      "specializations": [
        {
          "name": "Matemática",
          "ability": "Modelagem",
          "text": "Você transforma conjuntos de dados em modelos capazes de revelar padrões, relações e tendências que não seriam evidentes apenas pela observação. Com informações suficientes, pode estimar resultados futuros, encontrar valores ausentes ou identificar anomalias."
        },
        {
          "name": "Matemática",
          "ability": "Otimização",
          "text": "Quando existirem diferentes maneiras mensuráveis de alcançar um mesmo objetivo, você pode determinar qual delas exige menos tempo, recursos, distância ou esforço, desde que possua dados suficientes para realizar a comparação."
        },
        {
          "name": "Física",
          "ability": "Analisar Fenômeno Físico",
          "text": "Você compreende profundamente fenômenos envolvendo movimento, forças, energia, calor, pressão, eletricidade, ondas e outras propriedades físicas, podendo determinar como uma alteração específica afetaria seu comportamento."
        },
        {
          "name": "Física",
          "ability": "Aplicação Física",
          "text": "Após analisar corretamente um fenômeno físico, você pode identificar uma forma prática de explorá-lo, como determinar onde aplicar força, qual suporte sustenta uma estrutura, qual trajetória um objeto seguirá ou qual posição oferece maior estabilidade. Quando outro teste seguir diretamente essa análise, o Mestre pode reduzir sua Zona de Dificuldade em um nível."
        },
        {
          "name": "Química",
          "ability": "Analisar Composição",
          "text": "Com ferramentas ou condições adequadas, você identifica propriedades, componentes e características químicas de uma substância, incluindo inflamabilidade, corrosividade, toxicidade, reatividade ou outras propriedades."
        },
        {
          "name": "Química",
          "ability": "Prever Reação",
          "text": "Quando conhecer os materiais envolvidos, você pode prever aproximadamente como reagirão entre si e determinar métodos plausíveis para provocar, impedir, neutralizar ou conter essa reação."
        },
        {
          "name": "Química",
          "ability": "Separar Composto",
          "text": "Com equipamentos e materiais apropriados, você pode isolar ou purificar componentes presentes em uma mistura comum. Esse Uso não permite reproduzir fórmulas ou propriedades sobrenaturais pertencentes à Alquimia."
        }
      ]
    },
    {
      "name": "Ciências Naturais",
      "description": "Você possui formação voltada ao estudo dos seres vivos, ecossistemas, ambientes naturais e processos que moldam a vida e o terreno.",
      "uses": [
        {
          "name": "Análise Natural",
          "text": "Você analisa organismos, ambientes ou materiais naturais para compreender suas características, relações e possíveis causas, reconhecendo condições e processos naturais relevantes."
        },
        {
          "name": "Classificar",
          "text": "Você compara um organismo, amostra ou formação natural com conhecimentos existentes para determinar sua provável origem, grupo, espécie ou características gerais. Quanto melhor o resultado, mais específica pode ser a classificação."
        },
        {
          "name": "Analisar Ecossistema",
          "text": "Você observa um ambiente e identifica relações entre fauna, flora, clima e recursos naturais, podendo determinar se determinada presença, ausência ou comportamento é incomum naquele ecossistema."
        },
        {
          "name": "Identificar Alteração Natural",
          "text": "Você reconhece quando um organismo, ambiente ou formação apresenta características incompatíveis com seu desenvolvimento natural, permitindo identificar indícios de interferências externas, artificiais ou sobrenaturais quando houver evidências suficientes."
        }
      ],
      "specializations": [
        {
          "name": "Biologia",
          "ability": "Analisar Organismo",
          "text": "Você estuda a estrutura e o funcionamento de seres vivos, identificando funções de órgãos, adaptações, necessidades biológicas e possíveis causas de anormalidades em organismos biologicamente compreensíveis."
        },
        {
          "name": "Biologia",
          "ability": "Comparar Anatomia",
          "text": "Ao analisar um organismo desconhecido, você pode compará-lo com espécies conhecidas para deduzir a provável função de estruturas corporais, órgãos ou adaptações. Esse conhecimento pode ser aplicado junto de Medicina ou Monstrologia quando apropriado."
        },
        {
          "name": "Biologia",
          "ability": "Processo Biológico",
          "text": "Você determina como fatores como alimentação, reprodução, desenvolvimento, doenças ou alterações ambientais provavelmente afetariam um organismo ao longo do tempo."
        },
        {
          "name": "Botânica",
          "ability": "Analisar Flora",
          "text": "Você reconhece espécies vegetais, estruturas e ciclos de desenvolvimento, podendo determinar se uma planta é comum naquele ambiente, se apresenta alterações e quais partes possuem possíveis aplicações."
        },
        {
          "name": "Botânica",
          "ability": "Identificar Propriedade",
          "text": "Ao estudar uma planta, você pode descobrir propriedades relevantes como toxicidade, valor medicinal, capacidade nutritiva, inflamabilidade ou outras características naturais. Quando aplicável, esse conhecimento pode ser utilizado junto de Medicina, Sobrevivência ou Alquimia."
        },
        {
          "name": "Botânica",
          "ability": "Cultivo",
          "text": "Com condições e recursos adequados, você pode determinar como cultivar, preservar ou recuperar uma espécie vegetal, incluindo quais condições ambientais são necessárias para seu desenvolvimento."
        },
        {
          "name": "Zoologia",
          "ability": "Analisar Fauna",
          "text": "Você reconhece espécies animais e compreende sua anatomia, alimentação, reprodução e padrões naturais de comportamento. Pode deduzir características gerais de um animal mesmo sem ter encontrado aquela espécie anteriormente."
        },
        {
          "name": "Zoologia",
          "ability": "Prever Comportamento",
          "text": "Após observar um animal por tempo suficiente, você identifica sinais de territorialidade, medo, caça, proteção ou fuga e prevê seu comportamento provável diante de um estímulo natural."
        },
        {
          "name": "Zoologia",
          "ability": "Identificar Vestígio",
          "text": "Você reconhece animais através de pegadas, pelos, penas, fezes, marcas de alimentação, ninhos ou outros vestígios biológicos. Esse conhecimento pode ser aplicado junto de Sobrevivência para identificar aquilo que deixou um rastro."
        },
        {
          "name": "Geologia",
          "ability": "Analisar Formação",
          "text": "Você identifica rochas, minerais, sedimentos e formações geológicas, determinando processos que provavelmente as produziram e reconhecendo elementos incomuns em sua composição."
        },
        {
          "name": "Geologia",
          "ability": "Avaliar Terreno",
          "text": "Você identifica instabilidade, erosão, risco de deslizamento, cavidades, falhas ou outros perigos geológicos. Quando houver evidências suficientes, pode prever como determinada alteração afetaria o terreno."
        },
        {
          "name": "Geologia",
          "ability": "Prospectar",
          "text": "Você analisa terrenos e formações para determinar onde minerais, recursos subterrâneos, água ou outros materiais naturais possuem maior probabilidade de serem encontrados."
        }
      ]
    }
  ],
  "Crime": [
    {
      "name": "Segurança",
      "description": "Você conhece mecanismos de proteção, fechaduras e técnicas de invasão física.",
      "uses": [
        {
          "name": "Contornar Segurança",
          "text": "Você analisa um sistema físico de proteção para identificar vulnerabilidades, rotas alternativas ou métodos plausíveis de superá-lo."
        }
      ],
      "specializations": [
        {
          "name": "Fechaduras",
          "ability": "Arrombamento Avançado",
          "text": "Você pode tentar superar cofres, fechaduras profissionais e outros mecanismos de travamento que normalmente exigiriam conhecimento especializado. Ao utilizar [Arrombar] contra uma fechadura, reduza sua Zona de Dificuldade em um nível."
        },
        {
          "name": "Alarmes",
          "ability": "Neutralizar Alarme",
          "text": "Você consegue identificar e tentar neutralizar mecanismos físicos de detecção ou alarme sem acioná-los."
        },
        {
          "name": "Alarmes",
          "ability": "Mapear Detecção",
          "text": "Você analisa sensores, gatilhos e mecanismos de detecção para determinar sua área de cobertura, pontos cegos e quais ações provavelmente os acionariam."
        }
      ]
    },
    {
      "name": "Submundo",
      "description": "Você conhece práticas, códigos, organizações e métodos comuns do meio criminoso, sabendo como operar e buscar recursos dentro dele.",
      "uses": [
        {
          "name": "Contatos Criminosos",
          "text": "Você pode tentar localizar pessoas, serviços, informações ou mercadorias através do submundo. A disponibilidade e a dificuldade dependem da presença e do acesso ao meio criminoso na região."
        }
      ],
      "specializations": [
        {
          "name": "Contrabando",
          "ability": "Rota Clandestina",
          "text": "Você consegue planejar formas de transportar ou ocultar materiais evitando fiscalizações, inspeções e controles comuns."
        },
        {
          "name": "Mercado Ilegal",
          "ability": "Mercado Negro",
          "text": "Você consegue estimar o valor, a origem e a disponibilidade de produtos ilegais, além de saber onde procurar possíveis compradores ou vendedores."
        },
        {
          "name": "Furto",
          "ability": "Mãos Criminosas",
          "text": "Ao utilizar [Furtar] ou [Plantar] diretamente em outro ser, você recebe +1d4. O resultado desse dado é somado ao valor do seu teste."
        }
      ]
    }
  ],
  "Diplomacia": [
    {
      "name": "Relações Sociais",
      "description": "Você conhece técnicas formais de comunicação, convivência e comportamento social.",
      "uses": [
        {
          "name": "Navegar Etiqueta",
          "text": "Você conhece protocolos, formas de tratamento e comportamentos esperados em ambientes formais ou culturalmente específicos. Nesses ambientes, pode utilizar Diplomacia para evitar gafes, abordar corretamente figuras importantes ou acessar interações que normalmente seriam barradas por protocolo."
        },
        {
          "name": "Mapear Relações",
          "text": "Após observar ou interagir com um grupo por tempo suficiente, você pode identificar quem possui influência, quem responde a quem e quais relações parecem envolver respeito, rivalidade, dependência ou tensão. Em um Sucesso Bom ou superior, o Mestre também revela qual pessoa presente parece ser o melhor caminho para obter algo específico daquele grupo."
        }
      ],
      "specializations": [
        {
          "name": "Mediação",
          "ability": "Encontrar Acordo",
          "text": "Ao conversar com duas ou mais partes em conflito, você pode identificar quais exigências são realmente importantes para cada lado e quais podem ser negociadas. Em um Sucesso Normal, o Mestre revela uma condição capaz de tornar um acordo possível; em um Sucesso Bom ou superior, você também identifica uma concessão que uma das partes provavelmente aceitaria sem comprometer seus interesses principais."
        },
        {
          "name": "Oratória",
          "ability": "Mover Multidões",
          "text": "Você pode utilizar Diplomacia para influenciar grupos e grandes plateias como um único alvo, desde que consiga se comunicar com a maioria de seus integrantes. O resultado determina a reação geral da multidão, permitindo acalmar, inspirar, convencer ou direcionar sua atenção para uma ideia ou objetivo."
        },
        {
          "name": "Protocolo",
          "ability": "Influência Institucional",
          "text": "Você conhece os procedimentos, hierarquias e formalidades utilizados por instituições e ambientes de poder. Ao lidar com uma organização estruturada, pode utilizar Diplomacia para descobrir a forma correta de conseguir uma audiência, encaminhar um pedido, acessar alguém de posição superior ou fazer com que uma solicitação seja levada oficialmente a quem possui autoridade para resolvê-la."
        }
      ]
    },
    {
      "name": "Humanidades",
      "description": "Você possui conhecimentos sobre sociedades, instituições, história e relações humanas, permitindo compreender por que grupos agem de determinada forma e como estruturas sociais se organizam.",
      "uses": [
        {
          "name": "Contextualizar Sociedade",
          "text": "Você analisa costumes, conflitos, instituições e comportamentos coletivos a partir de seu contexto histórico e cultural. Em um sucesso, pode identificar a origem provável de uma tradição, tensão, divisão social ou comportamento coletivo relevante."
        },
        {
          "name": "Reconhecer Estrutura Social",
          "text": "Você identifica como poder, prestígio, classe, crenças, tradições ou funções institucionais organizam determinado grupo. Isso pode revelar quais posições possuem autoridade real, quais dependem principalmente de status e quais grupos se encontram em conflito."
        }
      ],
      "specializations": [
        {
          "name": "Política",
          "ability": "Ler Jogo de Poder",
          "text": "Você identifica interesses, alianças, rivalidades e relações de dependência entre figuras ou grupos políticos. Em um Sucesso Bom ou superior, o Mestre também revela qual mudança, apoio ou perda provavelmente alteraria o equilíbrio de poder naquele cenário."
        },
        {
          "name": "Direito",
          "ability": "Interpretar Norma",
          "text": "Você pode analisar leis, contratos, regulamentos e procedimentos para determinar direitos, obrigações, brechas ou consequências legais relevantes. Quando existir uma forma legítima de alcançar determinado objetivo através das regras existentes, um Sucesso Normal ou superior pode identificá-la."
        },
        {
          "name": "Sociologia",
          "ability": "Analisar Dinâmica Social",
          "text": "Ao observar uma comunidade, organização ou multidão, você pode identificar tensões, divisões, valores dominantes e fatores capazes de alterar seu comportamento coletivo. Em um Sucesso Bom ou superior, pode descobrir qual acontecimento, argumento ou pressão teria maior chance de mobilizar aquele grupo."
        }
      ]
    }
  ],
  "Enganação": [
    {
      "name": "Manipulação",
      "description": "Você conhece técnicas deliberadas de construção de mentiras e controle de narrativas.",
      "uses": [
        {
          "name": "Construir Mentira",
          "text": "Com preparação, você cria uma história falsa estruturada e coerente. Realize um teste de Enganação durante a preparação; seu resultado pode ser utilizado posteriormente contra tentativas de encontrar contradições na história enquanto novas evidências não a comprometerem."
        }
      ],
      "specializations": [
        {
          "name": "Blefe",
          "ability": "Sustentar Mentira",
          "text": "Na primeira vez que uma mentira preparada através de [Construir Mentira] for diretamente questionada, você pode manter o resultado obtido durante sua preparação em vez de realizar um novo teste, desde que não tenham surgido evidências concretas contra ela."
        },
        {
          "name": "Golpes",
          "ability": "Esquema",
          "text": "Você pode preparar fraudes que dependam de múltiplas etapas, identidades, documentos ou participantes. Realize um teste de Enganação durante a preparação; seu resultado é utilizado contra tentativas de perceber inconsistências ou descobrir que o esquema é uma fraude enquanto sua estrutura permanecer intacta."
        },
        {
          "name": "Jogos",
          "ability": "Viciar Jogo",
          "text": "Quando utilizar [Trapacear] durante um jogo de azar ou competição, o +1d4 recebido pode ser aplicado a todos os seus testes diretamente relacionados àquela partida, em vez de apenas ao próximo. O benefício termina quando você falhar em um desses testes ou sua trapaça for descoberta."
        }
      ]
    },
    {
      "name": "Disfarce",
      "description": "Você conhece técnicas destinadas a alterar sua aparência e assumir identidades falsas.",
      "uses": [
        {
          "name": "Disfarçar",
          "text": "Com recursos adequados, você modifica sua aparência para dificultar seu reconhecimento. Realize um teste de Enganação; o resultado é utilizado contra tentativas posteriores de reconhecê-lo através de sua aparência."
        }
      ],
      "specializations": [
        {
          "name": "Impostura",
          "ability": "Assumir Identidade",
          "text": "Com materiais adequados, tempo de preparação e oportunidade de estudar o alvo, você pode assumir a aparência e imitar características de uma pessoa específica. Realize um teste de Enganação durante a preparação; seu resultado é utilizado contra tentativas de perceber inconsistências na impostura através de Sentidos ou Intuição, conforme aquilo que estiver sendo analisado."
        },
        {
          "name": "Identidade Falsa",
          "ability": "Criar Persona",
          "text": "Você pode construir uma identidade fictícia completa, incluindo nome, história, profissão, hábitos e informações pessoais coerentes. Após preparar a persona, realize um teste de Enganação; seu resultado é utilizado contra tentativas de encontrar contradições nela durante interações comuns. A identidade não precisa corresponder a uma pessoa real."
        }
      ]
    }
  ],
  "Furtividade": [
    {
      "name": "Infiltração",
      "description": "Você possui treinamento específico para atravessar áreas vigiadas, explorar pontos cegos e evitar sistemas de vigilância.",
      "uses": [
        {
          "name": "Infiltrar",
          "text": "Ao observar uma área protegida por tempo suficiente, você pode identificar rotas, pontos cegos, horários ou comportamentos de vigilância que facilitem sua entrada. Em um sucesso, o Mestre revela uma oportunidade de infiltração existente naquele local."
        }
      ],
      "specializations": [
        {
          "name": "Camuflagem",
          "ability": "Adaptar Camuflagem",
          "text": "Com tempo e materiais adequados, você pode preparar sua aparência para um ambiente específico. Enquanto permanecer em um cenário compatível com essa camuflagem, reduza em um nível a Zona de Dificuldade dos testes de Furtividade realizados enquanto estiver utilizando cobertura ou permanecendo parado."
        },
        {
          "name": "Espreitamento",
          "ability": "Perseguição Discreta",
          "text": "Ao [Espreitar] um alvo, você pode utilizar seu Deslocamento normal em vez de reduzi-lo pela metade, desde que permaneça em condições que permitam movimentação furtiva."
        },
        {
          "name": "Movimento Silencioso",
          "ability": "Passos Fantasmas",
          "text": "Ruídos naturais provocados pelo seu deslocamento, como pisos rangendo, folhas, cascalho ou água rasa, não denunciam sua presença nem aumentam, por si só, a dificuldade dos seus testes de Furtividade. Fontes excepcionalmente barulhentas ainda podem fazê-lo normalmente."
        }
      ]
    }
  ],
  "Intimidação": [
    {
      "name": "Coerção",
      "description": "Você conhece métodos deliberados de pressão psicológica, sabendo explorar medo, insegurança e situações de vulnerabilidade para conseguir aquilo que deseja.",
      "uses": [
        {
          "name": "Explorar Fraqueza",
          "text": "Caso conheça um medo, vínculo, segredo ou outra vulnerabilidade relevante de alguém, você pode explorá-la durante uma tentativa de [Coagir], reduzindo a Zona de Dificuldade da Rolagem em um nível. A vulnerabilidade utilizada deve ser relevante para a ameaça realizada."
        }
      ],
      "specializations": [
        {
          "name": "Interrogatório Hostil",
          "ability": "Quebrar Resistência",
          "text": "Após obter sucesso em [Coagir] alguém durante um interrogatório, você pode realizar uma pergunta direta. Caso o alvo saiba a resposta e seja capaz de fornecê-la, ele não pode simplesmente permanecer em silêncio ou se recusar a responder, mas ainda pode mentir, omitir informações ou distorcer sua resposta."
        },
        {
          "name": "Ameaça Velada",
          "ability": "Subentendido",
          "text": "Você pode [Coagir] através de insinuações, contexto ou consequências implícitas, sem formular uma ameaça explícita. Para alguém que não compreenda a situação ou seu contexto, suas palavras podem parecer completamente inofensivas."
        }
      ]
    }
  ],
  "Intuição": [
    {
      "name": "Leitura Comportamental",
      "description": "Você possui experiência ou estudo voltado à análise consciente de padrões de comportamento.",
      "uses": [
        {
          "name": "Estabelecer Padrão",
          "text": "Após observar ou interagir com alguém por tempo suficiente, você pode identificar hábitos, reações recorrentes, preferências ou comportamentos característicos daquela pessoa. O tempo necessário depende da quantidade e da qualidade das interações disponíveis."
        },
        {
          "name": "Perceber Mudança",
          "text": "Caso já tenha estabelecido um padrão sobre alguém, você pode reconhecer quando seu comportamento foge significativamente do habitual, mesmo que não saiba imediatamente o motivo dessa mudança."
        }
      ],
      "specializations": [
        {
          "name": "Mentiras",
          "ability": "Ler a Mentira",
          "text": "Quando obtiver sucesso em [Perceber Mentira], você pode analisar como a pessoa construiu sua versão. Escolha uma opção: identificar qual informação ou parte da história ela parece estar tentando esconder, qual parte foi provavelmente inventada ou qual assunto ela está evitando abordar. Isso não revela automaticamente a verdade por trás da mentira. Em um Sucesso Extremo, escolha duas opções."
        },
        {
          "name": "Emoções",
          "ability": "Identificar Gatilho",
          "text": "Após identificar uma emoção relevante através de [Interpretar Emoção], você pode tentar descobrir qual assunto, pessoa, objeto ou acontecimento presente parece estar provocando aquela reação."
        },
        {
          "name": "Psicologia",
          "ability": "Traçar Perfil",
          "text": "Após observar ou interagir com alguém por tempo suficiente, você pode construir um perfil comportamental. Em um sucesso, descubra uma motivação, medo, vínculo ou necessidade relevante daquela pessoa. Em um Sucesso Bom ou superior, descubra dois desses elementos."
        }
      ]
    }
  ],
  "Investigação": [
    {
      "name": "Criminalística",
      "description": "Você conhece métodos técnicos de investigação criminal, preservação de evidências e reconstrução de acontecimentos.",
      "uses": [
        {
          "name": "Processar Cena",
          "text": "Ao investigar uma cena de crime ou violência, você aplica métodos criminalísticos para reconhecer vestígios relevantes, possíveis pontos de entrada ou saída e sinais de que a cena foi adulterada, limpa ou organizada deliberadamente. Quanto maior sua Margem de Sucesso, mais completa e precisa pode ser a reconstrução."
        },
        {
          "name": "Coletar Evidência",
          "text": "Com os materiais apropriados, você pode coletar, armazenar e preservar vestígios sem contaminá-los ou comprometer informações importantes."
        }
      ],
      "specializations": [
        {
          "name": "Vestígios",
          "ability": "Comparar Vestígios",
          "text": "Você pode comparar duas ou mais evidências físicas, como sangue, fibras, impressões, resíduos ou marcas, para determinar se apresentam características compatíveis e se provavelmente possuem a mesma origem ou relação com o mesmo acontecimento."
        },
        {
          "name": "Balística",
          "ability": "Análise Balística",
          "text": "A partir de projéteis, cápsulas, impactos ou ferimentos compatíveis, você pode reconstruir aspectos de um disparo, como trajetória, direção, distância aproximada e provável posição do atirador. Com evidências suficientes, também pode determinar se diferentes disparos provavelmente foram realizados pela mesma arma."
        },
        {
          "name": "Entrevista Investigativa",
          "ability": "Reconstruir Depoimento",
          "text": "Ao conduzir uma entrevista com o objetivo de reconstruir acontecimentos, você pode utilizar Investigação no lugar da Perícia social normalmente exigida. Em vez de persuadir, intimidar ou manipular o alvo, você confronta respostas com horários, evidências e informações conhecidas para identificar contradições, lacunas e inconsistências no relato."
        }
      ]
    }
  ],
  "Linguística": [
    {
      "name": "Idiomas",
      "description": "Você possui formação voltada ao aprendizado e utilização prática de diferentes idiomas.",
      "uses": [
        {
          "name": "Comunicação Rudimentar",
          "text": "Após observar ou interagir suficientemente com um idioma desconhecido, você pode utilizar Linguística para compreender e construir frases simples através dele, utilizando padrões, vocabulário e estruturas que tenha assimilado. Conceitos complexos, técnicos ou abstratos continuam exigindo conhecimento adequado do idioma. A Zona de Dificuldade e a Margem Necessária dependem da complexidade da comunicação e do contato que você teve com o idioma."
        },
        {
          "name": "Assimilar Idioma",
          "text": "Você possui facilidade em internalizar vocabulário, pronúncia e estruturas linguísticas. Ao aprender um novo idioma através de Interlúdios, reduza pela metade a quantidade de cenas necessárias para adquirir sua Especialização, mínimo de uma."
        }
      ],
      "specializations": [
        {
          "name": "Idioma Específico",
          "ability": "Fluência",
          "text": "Escolha um idioma ao adquirir esta Especialização. Você consegue falar, compreender, ler e escrever normalmente nesse idioma sem necessidade de testes em situações comuns. Textos extremamente técnicos, arcaicos, codificados ou deliberadamente ambíguos ainda podem exigir testes de Linguística."
        }
      ]
    },
    {
      "name": "Criptografia",
      "description": "Você conhece métodos utilizados para ocultar, codificar e recuperar informações através de cifras, códigos e padrões.",
      "uses": [
        {
          "name": "Criptoanalisar",
          "text": "Você analisa uma mensagem codificada para identificar padrões, sua estrutura e possíveis métodos utilizados em sua construção. Com informações ou amostras suficientes, pode tentar decifrá-la mesmo sem possuir a chave original. A dificuldade depende da complexidade do método, da quantidade de informação disponível e do conhecimento que você possui sobre sua construção."
        },
        {
          "name": "Codificar",
          "text": "Você cria uma cifra ou código para proteger uma mensagem. Faça um teste de Linguística durante sua criação; o resultado pode ser utilizado posteriormente contra tentativas de decifrar a mensagem sem possuir sua chave ou conhecer o método utilizado."
        }
      ],
      "specializations": [
        {
          "name": "Cifras",
          "ability": "Reconstruir Chave",
          "text": "Ao analisar diferentes mensagens produzidas pelo mesmo método de codificação, você pode identificar padrões recorrentes e tentar reconstruir sua chave ou lógica. Em caso de sucesso, você passa a compreender aquele método, podendo decifrar outras mensagens produzidas através da mesma chave ou estrutura enquanto ela permanecer inalterada."
        },
        {
          "name": "Esteganografia",
          "ability": "Mensagem Oculta",
          "text": "Você pode esconder uma mensagem dentro de um texto, imagem, símbolo, objeto ou outra forma aparentemente comum de informação. Faça um teste de Linguística ao ocultá-la; o resultado pode ser utilizado posteriormente contra tentativas de perceber que existe uma mensagem escondida. Uma vez descoberta, seu conteúdo ainda precisa ser interpretado ou decifrado normalmente."
        }
      ]
    }
  ],
  "Medicina": [
    {
      "name": "Saúde",
      "description": "Você possui formação médica e conhecimento profissional sobre anatomia, fisiologia, doenças e tratamentos.",
      "uses": [
        {
          "name": "Tratamento Clínico",
          "text": "Você pode diagnosticar e tratar doenças, traumas e outras condições que exijam conhecimento médico profissional, determinando procedimentos, cuidados e acompanhamento adequados. A dificuldade depende da complexidade da condição e dos recursos disponíveis."
        },
        {
          "name": "Analisar Exame",
          "text": "Você interpreta exames, registros clínicos e sinais fisiológicos complexos para obter informações que não poderiam ser determinadas apenas pela observação direta do paciente."
        }
      ],
      "specializations": [
        {
          "name": "Cirurgia",
          "ability": "Operar",
          "text": "Com ferramentas, ambiente e tempo apropriados, você pode realizar procedimentos invasivos para tratar ferimentos, remover corpos estranhos, reparar estruturas internas ou realizar outras intervenções cirúrgicas complexas."
        },
        {
          "name": "Patologia",
          "ability": "Análise Patológica",
          "text": "Você examina tecidos, órgãos, amostras ou outros sinais biológicos para identificar alterações provocadas por doenças, degenerações e processos anormais no organismo."
        },
        {
          "name": "Patologia",
          "ability": "Examinar Cadáver",
          "text": "Você pode realizar uma análise médica de um cadáver para determinar sua provável causa e tempo aproximado de morte, além de identificar ferimentos, doenças e outras alterações relevantes para compreender as condições em que ela ocorreu."
        },
        {
          "name": "Farmacologia",
          "ability": "Prescrever",
          "text": "Você conhece os efeitos, doses, contraindicações e interações de medicamentos. Após avaliar uma condição, pode determinar quais medicamentos conhecidos são apropriados para tratá-la e reconhecer combinações potencialmente perigosas ou inadequadas."
        },
        {
          "name": "Toxicologia",
          "ability": "Tratar Intoxicação",
          "text": "Você pode identificar os efeitos de venenos, drogas e outras substâncias nocivas sobre o organismo e determinar métodos apropriados de tratamento, neutralização ou utilização de antídotos quando existirem."
        }
      ]
    }
  ],
  "Monstrologia": [
    {
      "name": "Estudos Monstruosos",
      "description": "Você possui estudo sistemático sobre criaturas anormais, seus padrões, origens e características, permitindo analisar seres desconhecidos além daquilo que pode ser deduzido apenas pela observação.",
      "uses": [
        {
          "name": "Comparar Espécime",
          "text": "Quando encontrar uma criatura desconhecida, você pode compará-la com registros e grupos previamente estudados para determinar possíveis relações, origens ou características compartilhadas. Quanto mais evidências e informações estiverem disponíveis, mais precisa pode ser sua análise."
        },
        {
          "name": "Registrar Criatura",
          "text": "Após estudar uma criatura, seus rastros ou restos por tempo suficiente, você pode produzir um registro sobre ela. Em encontros futuros com criaturas semelhantes, informações já confirmadas não precisam ser descobertas novamente através de Monstrologia."
        }
      ],
      "specializations": [
        {
          "name": "Abissais",
          "ability": "Conhecimento Abissal",
          "text": "Ao analisar criaturas originárias ou profundamente relacionadas ao Abismo, reduza em um nível a Zona de Dificuldade dos testes de Monstrologia. Além disso, você pode reconhecer características e padrões próprios de grupos abissais mesmo em criaturas que nunca encontrou antes."
        },
        {
          "name": "Espirituais",
          "ability": "Analisar Manifestação",
          "text": "Você pode estudar criaturas incorpóreas, assombrações e entidades espirituais mesmo quando sua anatomia ou comportamento não puderem ser analisados por meios convencionais, identificando manifestações, vínculos ou condições relacionadas à sua existência."
        },
        {
          "name": "Bestiais",
          "ability": "Prever Comportamento",
          "text": "Após observar suficientemente uma criatura guiada principalmente por instinto, você pode determinar sua reação provável diante de estímulos como ameaça, alimento, território, ferimento ou presença de outras criaturas."
        },
        {
          "name": "Anatomia Monstruosa",
          "ability": "Identificar Vulnerabilidade",
          "text": "Ao analisar a anatomia, estruturas corporais ou adaptações anormais de uma criatura, você pode identificar vulnerabilidades físicas plausíveis a partir das características observadas. A análise revela a natureza da vulnerabilidade e as condições necessárias para explorá-la, mas não concede benefícios ofensivos por si só."
        }
      ]
    }
  ],
  "Pilotagem": [
    {
      "name": "Condução",
      "description": "Você possui treinamento técnico para compreender o comportamento, limitações e operação de diferentes tipos de veículos.",
      "uses": [
        {
          "name": "Avaliar Veículo",
          "text": "Após conduzir ou examinar um veículo, você pode identificar características e problemas que afetem diretamente sua condução, como resposta dos controles, estabilidade, perda de desempenho ou danos capazes de comprometer sua pilotagem."
        },
        {
          "name": "Condução Técnica",
          "text": "Você pode tentar operar veículos com os quais não possui familiaridade, desde que consiga compreender seus controles e princípios de funcionamento. Veículos cuja operação exija formação específica ainda podem exigir uma Especialização apropriada."
        }
      ],
      "specializations": [
        {
          "name": "Carros",
          "ability": "Controle Automotivo",
          "text": "Você possui domínio técnico sobre a condução de automóveis. Ao realizar uma manobra que envolva perda deliberada de aderência, frenagem brusca, mudança repentina de direção ou controle do veículo em derrapagem, reduza em um nível a Zona de Dificuldade do teste de Pilotagem."
        },
        {
          "name": "Motocicletas",
          "ability": "Recuperar Controle",
          "text": "Ao conduzir uma motocicleta, quando uma falha faria você cair ou perder seu controle, você pode realizar imediatamente um novo teste de Pilotagem para tentar permanecer montado e recuperar o controle. As demais consequências da falha original ainda podem ocorrer."
        },
        {
          "name": "Aeronaves",
          "ability": "Voo",
          "text": "Você possui treinamento necessário para operar aeronaves, podendo realizar procedimentos de decolagem, pouso, navegação aérea e manobras próprias de voo."
        },
        {
          "name": "Embarcações",
          "ability": "Navegação Náutica",
          "text": "Você possui treinamento para operar embarcações e utilizar instrumentos, mapas e referências ambientais para planejar rotas, determinar sua posição e navegar mesmo sem referências terrestres visíveis."
        },
        {
          "name": "Veículos Pesados",
          "ability": "Operação Pesada",
          "text": "Você pode operar caminhões, veículos industriais, máquinas de grande porte e outros veículos que exijam controle especializado. O tamanho, peso ou inércia próprios desses veículos não aumentam por si só a Zona de Dificuldade dos seus testes de Pilotagem."
        }
      ]
    }
  ],
  "Religião": [
    {
      "name": "Teologia",
      "description": "Você possui estudo formal sobre sistemas religiosos, doutrinas, tradições e práticas espirituais.",
      "uses": [
        {
          "name": "Analisar Doutrina",
          "text": "Você interpreta textos, ensinamentos e estruturas religiosas complexas, identificando princípios, contradições, diferentes interpretações e relações entre doutrinas."
        },
        {
          "name": "Estudar Ritual",
          "text": "Você analisa a estrutura e os procedimentos de uma cerimônia religiosa para determinar sua finalidade, tradição de origem e os elementos, etapas ou condições necessários para sua realização."
        }
      ],
      "specializations": [
        {
          "name": "Mitologia",
          "ability": "Identificar Mito",
          "text": "Você relaciona símbolos, criaturas, acontecimentos, objetos e personagens a narrativas mitológicas conhecidas. Quando encontrar algo diretamente relacionado a um mito conhecido, pode reconhecer suas referências e características associadas."
        },
        {
          "name": "Rituais",
          "ability": "Conduzir Ritual",
          "text": "Você pode executar corretamente cerimônias religiosas cujos procedimentos conheça. Caso o ritual exija componentes, condições ou etapas específicas, você sabe como incorporá-los corretamente à cerimônia."
        },
        {
          "name": "Cultos",
          "ability": "Analisar Culto",
          "text": "Você reconhece estruturas, códigos, práticas, símbolos e sinais utilizados por grupos religiosos fechados, secretos ou clandestinos. Ao estudar um culto, pode identificar padrões de organização, hierarquias e possíveis funções exercidas por seus membros."
        },
        {
          "name": "Teologia Comparada",
          "ability": "Comparar Tradições",
          "text": "Ao analisar duas ou mais religiões, cultos ou tradições, você pode identificar influências, origens, princípios ou práticas compartilhadas entre elas, reconhecendo também onde suas interpretações divergem. Quando uma tradição desconhecida apresentar elementos claramente relacionados a outra que você conheça, essas relações podem ser utilizadas para deduzir informações sobre ela."
        }
      ]
    }
  ],
  "Sobrevivência": [
    {
      "name": "Vida Selvagem",
      "description": "Você possui conhecimento prático sobre sobrevivência utilizando diretamente os recursos e características do ambiente natural.",
      "uses": [
        {
          "name": "Explorar Ambiente",
          "text": "Você analisa um ambiente natural para identificar recursos disponíveis, perigos, condições favoráveis e características relevantes para sua sobrevivência."
        },
        {
          "name": "Improvisar",
          "text": "Você utiliza recursos encontrados no ambiente para produzir ferramentas, utensílios ou soluções simples para necessidades imediatas. A dificuldade depende dos recursos disponíveis e da complexidade daquilo que pretende produzir."
        }
      ],
      "specializations": [
        {
          "name": "Rastreamento",
          "ability": "Ler Rastro",
          "text": "Ao obter um Sucesso Bom ou superior em [Rastrear], você também descobre uma informação adicional sobre aquilo que está seguindo, como quantidade, velocidade, estado físico ou tempo aproximado desde sua passagem."
        },
        {
          "name": "Ecologia",
          "ability": "Ler Ecossistema",
          "text": "Você interpreta as relações entre fauna, flora, recursos e condições ambientais para identificar informações úteis à sobrevivência, como áreas provavelmente seguras, disponibilidade de recursos, presença incomum de predadores ou sinais de alterações recentes no ambiente."
        },
        {
          "name": "Forrageamento",
          "ability": "Coleta Eficiente",
          "text": "Ao obter sucesso em [Forragear], você consegue aproveitar melhor os recursos encontrados, obtendo uma quantidade ou qualidade maior quando o ambiente possuir recursos suficientes para isso."
        }
      ]
    },
    {
      "name": "Ambientes",
      "description": "Você possui experiência em reconhecer e enfrentar condições ambientais capazes de dificultar a sobrevivência.",
      "uses": [
        {
          "name": "Adaptar-se",
          "text": "Após permanecer e se preparar adequadamente para um ambiente, você pode estabelecer uma rotina de sobrevivência, reconhecendo os equipamentos, recursos e precauções necessários para permanecer nele. Enquanto as condições se mantiverem estáveis, situações comuns daquele ambiente não exigem novos testes apenas para manter essa rotina."
        }
      ],
      "specializations": [
        {
          "name": "Ambientes Extremos",
          "ability": "Preparação Extrema",
          "text": "Você sabe se preparar para condições ambientais particularmente severas, como frio ou calor intensos, grandes altitudes e outras situações em que exposição prolongada representa risco direto. Ao possuir equipamentos e recursos apropriados, condições previsíveis desse tipo não aumentam por si só a Zona de Dificuldade dos seus testes de Sobrevivência."
        },
        {
          "name": "Regiões Urbanas",
          "ability": "Sobrevivência Urbana",
          "text": "Você sabe utilizar estruturas, recursos descartados e características de áreas urbanas para encontrar abrigo, obter recursos e se orientar quando o objetivo for sobreviver utilizando aquilo que a cidade oferece."
        },
        {
          "name": "Subterrâneos",
          "ability": "Exploração Subterrânea",
          "text": "Você reconhece riscos próprios de cavernas e ambientes subterrâneos, como instabilidade, passagens perigosas, alterações de ventilação e sinais de possíveis rotas, permitindo avaliar esses locais mesmo sem referências da superfície."
        },
        {
          "name": "Viridis",
          "ability": "Desbravador de Viridis",
          "text": "Você possui experiência prática com os ecossistemas anormais de Viridis, podendo reconhecer e tomar precauções contra perigos ambientais característicos da região. Reduza em um nível a Zona de Dificuldade dos testes de Sobrevivência diretamente relacionados a esses perigos."
        }
      ]
    }
  ],
  "Tática": [
    {
      "name": "Doutrina Militar",
      "description": "Você conhece métodos formais de combate, organização operacional e funcionamento de grupos armados.",
      "uses": [
        {
          "name": "Leitura Tática",
          "text": "Você reconhece formações, padrões de movimentação, procedimentos e métodos táticos utilizados por forças organizadas, podendo identificar como seus integrantes estão distribuídos, quais funções exercem e como estão coordenando suas ações."
        },
        {
          "name": "Avaliar Operação",
          "text": "Ao analisar um plano ou operação, você pode identificar problemas previsíveis em sua execução, como posicionamento inadequado, rotas ruins, falhas logísticas, ausência de contingências ou conflitos entre diferentes etapas. Margens de Sucesso maiores podem revelar problemas mais relevantes ou menos evidentes."
        }
      ],
      "specializations": [
        {
          "name": "Estratégia",
          "ability": "Planejar Operação",
          "text": "Com tempo e informações suficientes, você pode realizar uma Rolagem de Tática para preparar uma operação futura. Em caso de sucesso, identifique uma ameaça, dificuldade ou necessidade previsível que possa ser preparada antecipadamente. Margens maiores podem revelar fatores adicionais ou menos evidentes."
        },
        {
          "name": "Logística",
          "ability": "Prever Necessidade",
          "text": "Durante uma operação, missão ou deslocamento previamente planejado, uma vez por cena, quando surgir a necessidade de um suprimento, ferramenta ou equipamento mundano que poderia razoavelmente ter sido previsto durante a preparação, você pode declarar que incluiu aquele recurso no planejamento. O item deve ser compatível com os recursos disponíveis antes da operação e com aquilo que seria razoável transportar. Esse Uso não permite obter equipamentos raros, restritos ou cuja necessidade não pudesse ter sido antecipada."
        },
        {
          "name": "Armamentos",
          "ability": "Avaliar Arsenal",
          "text": "Você consegue identificar a função, características, limitações e aplicações táticas de armas e equipamentos militares que saiba reconhecer. Esse conhecimento não concede treinamento para utilizá-los."
        }
      ]
    }
  ],
  "Tecnologia": [
    {
      "name": "Computação",
      "description": "Você possui conhecimento sobre sistemas digitais, programação, redes e computadores.",
      "uses": [
        {
          "name": "Hackear",
          "text": "Você pode tentar invadir, contornar ou manipular sistemas digitais protegidos. A Zona de Dificuldade e a Margem Necessária dependem da segurança do sistema e dos recursos disponíveis."
        },
        {
          "name": "Analisar Sistema Digital",
          "text": "Você analisa a estrutura e o funcionamento de um sistema computacional para compreender seus componentes, permissões, processos e possíveis pontos problemáticos."
        }
      ],
      "specializations": [
        {
          "name": "Programação",
          "ability": "Manipular Código",
          "text": "Você pode criar, modificar ou analisar softwares, scripts e algoritmos complexos, desde que possua acesso e recursos adequados."
        },
        {
          "name": "Cibersegurança",
          "ability": "Explorar Vulnerabilidade",
          "text": "Com acesso ou informações suficientes sobre um sistema, você pode procurar uma vulnerabilidade em sua segurança. Ao encontrá-la, determine qual camada ou proteção ela permite contornar; enquanto a vulnerabilidade permanecer válida, ela pode ser explorada sem precisar ser descoberta novamente."
        },
        {
          "name": "Cibersegurança",
          "ability": "Plantar Backdoor",
          "text": "Após obter acesso a um sistema através de [Hackear], você pode realizar outro teste de Tecnologia para estabelecer uma forma persistente de acessá-lo posteriormente. Alterações relevantes na segurança do sistema podem comprometer ou remover esse acesso."
        },
        {
          "name": "Redes",
          "ability": "Rastrear Rede",
          "text": "Você pode mapear dispositivos, conexões, rotas e fluxos de informação dentro de uma infraestrutura digital, identificando como seus diferentes pontos se comunicam."
        },
        {
          "name": "Hardware",
          "ability": "Intervenção Física",
          "text": "Você pode acessar e modificar diretamente os componentes físicos de um sistema computacional para alterar sua configuração, substituir componentes ou realizar intervenções que não seriam possíveis apenas através de software."
        }
      ]
    },
    {
      "name": "Engenharia",
      "description": "Você possui conhecimentos sobre construção, funcionamento e modificação de máquinas, dispositivos e estruturas artificiais.",
      "uses": [
        {
          "name": "Projetar",
          "text": "Com tempo e informações suficientes, você pode elaborar um projeto para construir ou modificar uma máquina, dispositivo ou estrutura dentro dos conhecimentos que possui. A complexidade do projeto determina os recursos, tempo e Margem Necessária."
        },
        {
          "name": "Modificar Equipamento",
          "text": "Com ferramentas e materiais adequados, você pode alterar deliberadamente o funcionamento de uma máquina ou dispositivo. Modificações mais complexas podem exigir planejamento, componentes específicos ou conhecimento especializado."
        }
      ],
      "specializations": [
        {
          "name": "Eletrônica",
          "ability": "Modificar Circuito",
          "text": "Você pode analisar, reparar ou alterar circuitos e sistemas eletrônicos complexos, trabalhando diretamente com seus componentes e conexões."
        },
        {
          "name": "Mecânica",
          "ability": "Modificar Mecanismo",
          "text": "Você pode analisar, reparar ou modificar motores, engrenagens, transmissões, sistemas hidráulicos e outros mecanismos físicos complexos."
        },
        {
          "name": "Estruturas",
          "ability": "Analisar Estrutura",
          "text": "Você pode analisar construções e estruturas artificiais para identificar sua estabilidade, distribuição de cargas, pontos de suporte e vulnerabilidades estruturais. Quando utilizar diretamente uma informação descoberta dessa forma em um teste relacionado à estrutura, reduza em um nível sua Zona de Dificuldade."
        }
      ]
    }
  ]
};

const ROLL_SOUND_BASE64 = "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGRBD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGRBD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQZEEP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5JkQI/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZECP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

let rollSound = null;

function userFacingErrorMessage(error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  const code = String(error?.code || "");
  if (error?.name === "FirebaseError" || /^(?:auth|firestore)\//i.test(code)
    || /firebase|firestore|missing or insufficient permissions/i.test(message)) return "";
  return message;
}

function playRollSound() {
  if (!rollSound) {
    rollSound = new Audio(`data:audio/mpeg;base64,${ROLL_SOUND_BASE64}`);
    rollSound.preload = "auto";
    rollSound.volume = 0.78;
  }

  rollSound.volume = .78 * (window.AbyssCloud?.getOwnRollVolume?.() ?? 1);
  rollSound.pause();
  rollSound.currentTime = 0;
  const playback = rollSound.play();
  if (playback?.catch) playback.catch(() => {});
}

const ABILITY_SECTIONS = {
  attacks: { label: "Ataques", eyebrow: "Combate" },
  backgrounds: { label: "Antecedências", eyebrow: "História do personagem" },
  styles: { label: "Estilos de Luta", eyebrow: "Técnicas de combate" },
  powers: { label: "Poderes", eyebrow: "Dons e técnicas" },
  spells: { label: "Feitiços", eyebrow: "Feitiçaria" },
  tricks: { label: "Truques", eyebrow: "Pequenas manifestações" },
  echoes: { label: "Ecos", eyebrow: "Essência do personagem" },
  classes: { label: "Classes", eyebrow: "Arquétipo" },
  tree: { label: "Árvore", eyebrow: "Progressão" },
  upgrades: { label: "Melhorias", eyebrow: "Aprimoramentos de itens" },
};

const ITEM_TYPES = {
  weapon: "Arma", armor: "Armadura", utility: "Utilitário", clothing: "Vestimenta",
  throwable: "Arremessável", ammunition: "Munição", magic: "Objeto Mágico",
};
const UPGRADE_ITEM_TYPES = ["weapon", "armor", "clothing", "ammunition"];

const VERDEON_SYMBOL = "V̶";
const MAX_PURCHASE_HISTORY = 200;

function formatVerdeons(value) {
  return `${VERDEON_SYMBOL}\u00a0${clampInteger(value, 0, 999999999, 0).toLocaleString("pt-BR")}`;
}

function renderVerdeonAmount(element, value) {
  if (!element) return;
  const amount = clampInteger(value, 0, 999999999, 0).toLocaleString("pt-BR");
  const symbol = document.createElement("span");
  symbol.className = "verdeon-symbol";
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = "V";
  const number = document.createElement("span");
  number.textContent = amount;
  element.classList.add("verdeon-value");
  element.setAttribute("aria-label", `${amount} Verdeons`);
  element.replaceChildren(symbol, number);
}

function sanitizeShopDestination(value) {
  return value === "inventory" || (value !== "upgrades" && ABILITY_SECTIONS[value]) ? value : "inventory";
}

const CREATION_RESOURCES = {
  pv: "PV",
  pa: "PA",
  sa: "SA",
};

const CREATION_MODIFIER_TYPES = {
  skill: "Perícia",
  pv: "PV",
  pa: "PA",
  sa: "SA",
  attribute: "Atributo",
  damage: "Dano",
  defense: "Defesa",
  evasion: "Esquiva",
  abilityDt: "DT de Habilidades",
  spellDt: "DT de Feitiçaria",
  block: "Bloqueio",
};

let FEATURE_CATALOG = [];
const FEATURE_BY_ID = new Map();

const TRAINING = {
  leigo: { label: "Leigo", die: 8 },
  adepto: { label: "Adepto", die: 12 },
  treinado: { label: "Treinado", die: 20 },
};

const ECHOES = {
  determinado: "O Determinado",
  justo: "O Justo",
  bondoso: "O Bondoso",
  paciente: "O Paciente",
  integro: "O Íntegro",
  bravo: "O Bravo",
  perseverante: "O Perseverante",
};

const ECHO_DETAILS = {
  determinado: {
    title: "O Determinado",
    intro: [
      "O Determinado é alguém movido por uma convicção difícil de abalar. Quando estabelece um objetivo, tende a continuar avançando mesmo diante de fracassos, pressão ou consequências desfavoráveis. Esse Eco representa personagens que encontram força justamente nos momentos em que algo tenta interrompê-los, transformando frustração, resistência e adversidade em impulso para seguir adiante.",
      "Sua determinação não precisa surgir de coragem ou otimismo. Ela pode nascer de ambição, dever, orgulho, apego, esperança, obsessão ou qualquer outra razão suficientemente importante para fazê-lo continuar quando abandonar o caminho pareceria mais fácil.",
    ],
    characterTitle: "Personagens Determinados",
    characters: [
      "Personagens Determinados tendem a possuir objetivos, convicções ou desejos aos quais se agarram com intensidade. Eles podem insistir repetidamente diante de um obstáculo, colocar cada vez mais de si mesmos em uma ação ou simplesmente se recusar a ceder quando algo tenta quebrar sua vontade.",
      "Isso não significa que todo Determinado seja imprudente ou incapaz de desistir. Alguns avançam agressivamente contra aquilo que os impede, enquanto outros suportam silenciosamente a pressão até encontrarem outra oportunidade. O que os aproxima é a dificuldade de aceitar que uma adversidade, por si só, seja suficiente para decidir quando algo deve terminar.",
      "Essa característica também pode assumir formas menos positivas. A determinação pode se transformar em teimosia, obsessão ou incapacidade de reconhecer quando continuar possui um custo maior do que recuar. O mesmo impulso que permite a um personagem superar seus limites pode levá-lo a atravessá-los.",
    ],
  },
  justo: {
    title: "O Justo",
    intro: [
      "O Justo é alguém guiado por uma noção particularmente forte daquilo que considera correto, merecido ou proporcional. Esse Eco representa personagens que dificilmente permanecem indiferentes quando percebem abuso, desigualdade, traição ou alguma situação que viole seu senso de justiça, sentindo-se naturalmente inclinados a tomar uma posição diante dela.",
      "Aquilo que um Justo considera correto, entretanto, não precisa corresponder às leis, aos costumes ou sequer à moral daqueles ao seu redor. Sua justiça pode nascer de princípios pessoais, dever, experiência, tradição, compaixão ou até de uma visão severa sobre aquilo que cada um merece.",
    ],
    characterTitle: "Personagens Justos",
    characters: [
      "Personagens Justos costumam observar com atenção a maneira como ações e consequências se relacionam. Alguns procuram proteger aqueles que consideram vítimas, outros desejam responsabilizar culpados, corrigir desequilíbrios ou simplesmente garantir que cada ser receba aquilo que acreditam ser devido.",
      "Um Justo não precisa ser benevolente, obediente ou misericordioso. Dois personagens podem compartilhar esse Eco enquanto possuem ideias completamente opostas sobre aquilo que constitui justiça. Um pode acreditar em perdão e reparação, enquanto outro considera que toda ação deve possuir uma consequência equivalente.",
      "Esse senso também pode se tornar inflexível. A busca pelo que considera correto pode levar um Justo a julgar situações antes de compreendê-las por completo, perseguir uma reparação além do necessário ou confundir justiça com punição. A mesma convicção que o impulsiona a enfrentar uma injustiça pode fazê-lo acreditar que possui o direito de decidir sozinho o que os outros merecem.",
    ],
  },
  bondoso: {
    title: "O Bondoso",
    intro: [
      "O Bondoso é alguém naturalmente inclinado a considerar o bem-estar daqueles ao seu redor e agir de maneira a favorecê-lo. Esse Eco representa personagens que encontram valor em ajudar, proteger, cuidar ou simplesmente tornar a situação de outro ser um pouco melhor, mesmo quando não existe uma recompensa imediata por isso.",
      "Sua bondade não precisa nascer de inocência ou altruísmo absoluto. Ela pode surgir de empatia, responsabilidade, afeto, culpa, fé, princípios ou da simples escolha de não permanecer indiferente diante da necessidade de alguém.",
    ],
    characterTitle: "Personagens Bondosos",
    characters: [
      "Personagens Bondosos costumam demonstrar sua natureza através das pequenas e grandes formas pelas quais interferem positivamente na vida de outros seres. Alguns oferecem ajuda sem pensar duas vezes, outros preferem proteger discretamente, compartilhar recursos, prestar favores ou assumir responsabilidades que poderiam simplesmente ignorar.",
      "Ser Bondoso não significa ser ingênuo, pacífico ou incapaz de causar dano. Um personagem pode ser severo, desconfiado ou até violento e ainda assim possuir esse Eco, desde que exista nele uma disposição genuína de fazer o bem quando considera que alguém precisa disso.",
      "Essa característica também pode levá-lo a se colocar em segundo plano com frequência, assumir problemas que não lhe pertencem ou permitir que outros se aproveitem de sua disposição. A mesma vontade que o torna capaz de cuidar dos demais pode fazê-lo esquecer de preservar a si próprio.",
    ],
  },
  paciente: {
    title: "O Paciente",
    intro: [
      "O Paciente é alguém capaz de resistir à urgência de agir antes da hora, preferindo observar, esperar e reconhecer o momento mais favorável para intervir. Esse Eco representa personagens que encontram força na contenção, permitindo que situações se desenvolvam antes de comprometer seus recursos, suas decisões ou sua posição.",
      "Sua paciência pode nascer de disciplina, cautela, experiência, confiança, frieza ou simplesmente de um temperamento naturalmente ponderado. Para o Paciente, esperar não significa permanecer inerte, mas compreender que nem toda oportunidade precisa ser aproveitada no instante em que aparece.",
    ],
    characterTitle: "Personagens Pacientes",
    characters: [
      "Personagens Pacientes costumam observar antes de se comprometer, permitindo que outras pessoas revelem suas intenções ou que uma oportunidade se torne mais favorável antes de agir. Alguns planejam cuidadosamente cada movimento, enquanto outros simplesmente possuem a tranquilidade necessária para não reagir à primeira provocação ou possibilidade que surge.",
      "Ser Paciente não significa ser passivo, lento ou indeciso. Um personagem desse Eco pode agir com extrema rapidez quando considera que o momento chegou; sua característica está justamente em saber quando ainda não chegou.",
      "Essa disposição também pode se tornar excessiva. Esperar pela condição perfeita pode significar permitir que oportunidades desapareçam, evitar decisões necessárias ou agir tarde demais. A mesma cautela que permite ao Paciente encontrar o momento ideal pode fazê-lo hesitar enquanto o mundo continua se movendo.",
    ],
  },
  integro: {
    title: "O Íntegro",
    intro: [
      "O Íntegro é alguém que procura permanecer fiel àquilo que considera essencial em si mesmo, mesmo quando as circunstâncias tornam mais fácil ceder. Esse Eco representa personagens que preservam suas convicções, compromissos e valores diante de pressão, tentação ou prejuízo, encontrando força justamente na decisão de não abandonar aquilo que escolheram sustentar.",
      "Sua integridade não precisa estar ligada à bondade, à honra ou às leis. Ela pode nascer de princípios pessoais, lealdade, disciplina, orgulho, fé, dever ou de qualquer convicção suficientemente importante para que o personagem se recuse a traí-la.",
    ],
    characterTitle: "Personagens Íntegros",
    characters: [
      "Personagens Íntegros costumam demonstrar sua natureza quando aquilo em que acreditam é colocado à prova. Alguns mantêm promessas mesmo quando quebrá-las seria vantajoso, outros recusam propostas que contradizem seus princípios, permanecem ao lado de alguém apesar das consequências ou sustentam decisões que poderiam abandonar facilmente.",
      "Ser Íntegro não significa estar sempre certo. Um personagem pode manter convicções equivocadas, severas ou até destrutivas e ainda assim possuir esse Eco. A Integridade representa principalmente a coerência entre aquilo em que acredita e aquilo que escolhe fazer quando existe uma razão real para ceder.",
      "Essa característica também pode se tornar rigidez. A dificuldade de abandonar uma posição pode impedir o personagem de reconhecer erros, aceitar mudanças ou reconsiderar decisões que já não fazem sentido. A mesma firmeza que o mantém inteiro diante da pressão pode fazê-lo resistir até mesmo quando mudar seria necessário.",
    ],
  },
  bravo: {
    title: "O Bravo",
    intro: [
      "O Bravo é alguém que encontra força na decisão de avançar mesmo quando reconhece o perigo diante de si. Esse Eco representa personagens que não dependem da ausência de medo para agir, mas da disposição de enfrentá-lo, colocando-se voluntariamente em situações arriscadas quando acreditam que recuar significaria abandonar aquilo que precisa ser feito.",
      "Sua bravura pode nascer de confiança, dever, orgulho, proteção, impulso, raiva ou simples coragem diante do desconhecido. O que define o Bravo não é procurar o perigo por si só, mas aceitar conscientemente seus riscos quando considera que enfrentá-los vale a pena.",
    ],
    characterTitle: "Personagens Bravos",
    characters: [
      "Personagens Bravos costumam demonstrar sua natureza quando existe uma opção mais segura, mas escolhem assumir uma posição mais arriscada para alcançar algo importante. Alguns avançam primeiro contra uma ameaça, outros permanecem onde seria mais prudente fugir, colocam-se entre o perigo e outra pessoa ou aceitam enfrentar situações que naturalmente provocariam medo.",
      "Ser Bravo não significa ser imprudente ou incapaz de sentir receio. Um personagem pode compreender perfeitamente o risco de uma situação e ainda assim possuir esse Eco. Sua bravura está justamente em reconhecer aquilo que pode dar errado e decidir agir apesar disso.",
      "Essa característica também pode se transformar em temeridade. A necessidade de provar coragem, enfrentar desafios ou evitar qualquer aparência de covardia pode levar o personagem a aceitar riscos desnecessários. A mesma disposição que permite ao Bravo caminhar em direção ao perigo pode fazê-lo avançar quando recuar seria a escolha mais sensata.",
    ],
  },
  perseverante: {
    title: "O Perseverante",
    intro: [
      "O Perseverante é alguém capaz de continuar mesmo quando alcançar aquilo que deseja exige tempo, desgaste ou sucessivas tentativas. Esse Eco representa personagens que não dependem de resultados imediatos para manter seus esforços, encontrando força na continuidade e na capacidade de avançar pouco a pouco diante de obstáculos que não podem ser superados de uma única vez.",
      "Sua perseverança pode nascer de disciplina, esperança, necessidade, responsabilidade, teimosia ou simplesmente da recusa em abandonar algo no qual já investiu tanto de si. Para o Perseverante, um caminho difícil não é necessariamente um caminho impossível.",
    ],
    characterTitle: "Personagens Perseverantes",
    characters: [
      "Personagens Perseverantes costumam demonstrar sua natureza em situações nas quais progresso exige continuidade. Alguns retomam um trabalho após repetidos contratempos, outros suportam longos períodos de desgaste, perseguem objetivos que parecem cada vez mais distantes ou simplesmente continuam avançando quando resultados imediatos deixaram de aparecer.",
      "Ser Perseverante não significa insistir cegamente em uma única abordagem. Diferente do Determinado, que encontra impulso para superar uma adversidade presente, o Perseverante se destaca por permanecer comprometido ao longo do tempo, adaptando seus métodos sempre que necessário sem abandonar facilmente aquilo que pretende alcançar.",
      "Essa característica também pode fazê-lo permanecer preso a algo por tempo demais. O investimento acumulado em um objetivo pode tornar difícil reconhecer quando ele deixou de valer o esforço, levando o personagem a continuar apenas porque já percorreu uma grande parte do caminho. A mesma resistência ao desgaste que o faz seguir adiante pode dificultar reconhecer quando é hora de parar.",
    ],
  },
};

const CHARACTER_CLASSES = {
  vanguardista: {
    label: "Vanguardista",
    pvInitial: 10,
    pvPerLevel: 5,
    paInitial: 6,
    paPerLevel: 1,
    saInitial: 5,
    saPerLevel: 1,
    defenseBase: 10,
    adeptBase: 2,
  },
  especialista: {
    label: "Especialista",
    pvInitial: 8,
    pvPerLevel: 4,
    paInitial: 8,
    paPerLevel: 2,
    saInitial: 8,
    saPerLevel: 1,
    defenseBase: 12,
    adeptBase: 6,
  },
  arcanista: {
    label: "Arcanista",
    pvInitial: 6,
    pvPerLevel: 3,
    paInitial: 10,
    paPerLevel: 3,
    saInitial: 10,
    saPerLevel: 2,
    defenseBase: 8,
    adeptBase: 4,
  },
};

// Somente cores hexadecimais validadas são aplicadas à paleta.
