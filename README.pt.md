# WC-2026 — Sistema Simulador da Copa do Mundo

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)
![Hostinger](https://img.shields.io/badge/Hostinger-673DE6?style=flat&logo=hostinger&logoColor=white)

Leia em: Português | [English](README.md)

Aplicação full-stack desenvolvida para simular a Copa do Mundo FIFA 2026, incluindo a lógica da fase de grupos, classificação dos melhores terceiros colocados, geração do mata-mata e estatísticas por jogador, com suporte a simulação automática probabilística e modo de inserção manual de partidas.

**Demo ao vivo:** https://wc2026simulador.com/

## Screenshots

Abaixo estão algumas telas da aplicação, incluindo gerenciamento da fase de grupos, geração do chaveamento do mata-mata e responsividade mobile.

### Seleção de Modo

<img src="frontend/img/preview/sim-pc.png" height="400">

<img src="frontend/img/preview/sim-mobile.png" height="400">

### Fase de Grupos

<img src="frontend/img/preview/groups-pc.png" height="400">

<img src="frontend/img/preview/groups-mobile.png" height="400">

### Partidas

<img src="frontend/img/preview/matches-pc.png" height="400">

<img src="frontend/img/preview/matches-mobile.png" height="400">

### Mata-mata

<img src="frontend/img/preview/knockout-pc.png" height="400">

<img src="frontend/img/preview/knockout-mobile.png" height="400">

### Ranking de Desempenho dos Jogadores

<img src="frontend/img/preview/performance-pc.png" height="400">

<img src="frontend/img/preview/performance-mobile.png" height="400">

## Contexto

Com a expansão da Copa do Mundo FIFA para **48 seleções** em 2026, o formato do torneio se tornou mais complexo, principalmente em relação à classificação na fase de grupos, aos melhores terceiros colocados e à geração do chaveamento do mata-mata.

A ideia surgiu ao perceber que muitos simuladores existentes permitem apenas escolher resultados manualmente ou gerar simulações automáticas que parecem aleatórias, sem nenhuma base estatística clara por trás.

Este projeto foi criado para simular **toda a estrutura da Copa do Mundo 2026**, permitindo tanto simulação estatística automatizada quanto controle manual das partidas no mesmo sistema.

## Estrutura do Projeto

```
wc-2026/
├─ backend/
│  ├─ seed/
│  │  ├─ selections.json        # Base de dados de seleções e jogadores
│  │  └─ validate.js            # Script de validação da base de dados
│  │
│  └─ src/
│     ├─ server.js              # API Express + configuração do banco de dados
│     └─ simulation-logic.js    # Algoritmos de simulação das partidas
│
├─ frontend/
│  ├─ css/
│  │  ├─ shared.css             # Estilos globais e componentes compartilhados
│  │  ├─ simulation.css         # Estilos da página de seleção de modo
│  │  ├─ game-real.css          # Estilos da página de simulação automática
│  │  └─ game-manual.css        # Estilos da página de simulação manual
│  │
│  ├─ img/                      # Bandeiras, fundos e screenshots de preview
│  │
│  ├─ js/
│  │  ├─ config.js              # Configuração da URL base da API
│  │  ├─ translation.js         # Sistema de i18n (PT / EN)
│  │  ├─ particles.js           # Animação de fundo com partículas em canvas
│  │  ├─ simulation.js          # Lógica de seleção de modo e navegação
│  │  ├─ back-button.js         # Lógica compartilhada do modal de voltar
│  │  ├─ game-real.js           # Lógica do modo de simulação automática
│  │  └─ game-manual.js         # Lógica do modo manual
│  │
│  ├─ simulation.html           # Ponto de entrada — seleção de modo
│  ├─ game-real.html            # Página de simulação automática
│  ├─ game-manual.html          # Página de simulação manual
│  ├─ robots.txt                # Regras de rastreamento para buscadores
│  └─ sitemap.xml               # Sitemap para indexação no Google
│
├─ .env
├─ package.json
└─ README.md
```

## Como Funciona

1. O usuário seleciona um modo de simulação: **real** ou **manual**
2. O sistema gera todas as **partidas da fase de grupos**
3. As partidas são:
   - simuladas automaticamente usando modelos de probabilidade
   - inseridas manualmente pelo usuário
4. As classificações dos grupos são atualizadas dinamicamente
5. As seleções classificadas avançam para as fases eliminatórias
6. As partidas do mata-mata são geradas automaticamente
7. As estatísticas dos jogadores e os eventos das partidas são registrados
8. O torneio avança até a partida final

## Lógica de Simulação

### Modo de Simulação Automática

Os resultados das partidas são gerados usando:

- dados de ranking da FIFA
- nota média dos jogadores titulares
- cálculos de probabilidade baseados na lógica ELO
- distribuição de Poisson para gols esperados (**xG**)

O sistema simula:

- placares das partidas
- artilheiros
- assistências
- notas dos jogadores
- clean sheets (jogos sem sofrer gols)
- eventos de gol minuto a minuto
- disputas de pênaltis

### Modo Manual

Permite ao usuário:

- inserir manualmente os placares das partidas
- simular cenários personalizados do torneio
- calcular automaticamente as classificações dos grupos
- determinar os vencedores do mata-mata

## Modelagem do Banco de Dados

O sistema utiliza um banco de dados relacional estruturado para gerenciar as seguintes entidades principais:

- groups
- selections
- players
- matches
- group_standings
- knockout_matches
- player_match_stats
- goal_events
- shootout_events

Essa modelagem permite:

- rastreamento persistente das partidas
- cálculo de classificações em tempo real
- acompanhamento de desempenho dos jogadores
- lógica de progressão do torneio

## Documentação da API

A documentação Swagger está disponível em: [Swagger](http://localhost:8000/docs)

<img src="frontend/img/preview/swagger.png" height="400">

## Deploy & SEO

A aplicação está hospedada na **Hostinger** utilizando hospedagem Node.js com domínio próprio.

Configuração de produção:

- Ponto de entrada: `backend/src/server.js`
- Frontend servido como arquivos estáticos via `express.static`, com `simulation.html` como index
- Variáveis de ambiente configuradas via `.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `FRONTEND_URL`

Configuração de SEO:

- `robots.txt` — permite o rastreamento completo por buscadores
- `sitemap.xml` — enviado ao Google Search Console; a URL raiz canônica aponta para `simulation.html`
- `simulation.html` inclui meta tags completas: `title`, `description`, `keywords`, Open Graph, Twitter Card e `hreflang` para PT/EN
- `translation.js` atualiza dinamicamente `document.lang`, `<title>` e todas as meta tags ao trocar de idioma

## Internacionalização

A aplicação tem suporte para **Português (PT-BR)** e **Inglês (EN)** através de um sistema de i18n próprio:

- Idioma armazenado no `localStorage` e persistido entre as páginas
- Todos os textos da interface definidos em `frontend/js/translation.js`
- Tags `hreflang` configuradas para indexação SEO bilíngue

## Referências

- [Formato Oficial da Copa do Mundo FIFA 2026](https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026)
- [Dados de Ranking da FIFA](https://inside.fifa.com/fifa-world-ranking/men) — Última atualização: 12/04/2026
- [Documentação do MySQL](https://dev.mysql.com/)
- [Referência de Simulador](https://interativos.ge.globo.com/futebol/copa-do-mundo/especial/simulador-da-copa-do-mundo-2026)
- [Referência de Jogadores](https://www.sofascore.com/pt) — Última atualização: 24/04/2026
- [Inspiração de Componentes de UI](https://uiverse.io/SamiBouchareb/warm-catfish-72)
- [Inspiração de Componentes de UI](https://uiverse.io/JaydipPrajapati1910/dry-frog-0)
- [Inspiração de Componentes de UI](https://uiverse.io/alexruix/slippery-frog-10)
- [Inspiração de Componentes de UI](https://uiverse.io/aryamitra06/silent-lion-21)

## Autor

Lucas Nicolau — Estudante de Engenharia de Software na @UFAM
