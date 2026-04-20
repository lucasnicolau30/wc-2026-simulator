UGS CRÍTICOS (quebram ou corrompem dados)
1. Credencial do MySQL hardcoded no código (server.js, seed.js)
jspassword: '2516'
Está em 3 lugares. Se você subir isso no GitHub (já subiu?), a senha fica pública. Mova pra um .env com dotenv e adicione .env no .gitignore.
2. initializeDatabase() é re-chamado a cada /simulation (server.js:613, 619)
A rota POST /simulation chama initializeDatabase() de novo, o que cria uma nova connection + pool toda vez e reatribui pool = .... Connections antigas ficam vazando. Além disso, como o seed só roda se total === 0, não dá erro óbvio, mas é um vazamento silencioso. Inicialize uma vez só no app.listen.
3. Re-simular a mesma partida duplica standings / knockouts (server.js:696-731, 1008-1016)
/simulate/match e /simulate/knockout fazem UPDATE matches mas INSERT em groups_standings e knockouts sem checar se já existe. Se o usuário clicar "simular" duas vezes na mesma partida, a tabela vira lixo: dupla pontuação, dois vencedores no mesmo jogo, stats duplicados.
Fix: antes de inserir, DELETE FROM groups_standings WHERE matches_id = ? e DELETE FROM knockouts WHERE match_id = ?. Mesmo pra player_match_stats e goal_events. Ou use UNIQUE constraints.
4. Servidor chama a si mesmo via HTTP (server.js:680, 990, 1092, 1128, 1141)
jsconst response = await fetch("http://localhost:8000/starters");
Isso ocorre dentro das rotas Express. Problemas:

Latência desnecessária (ida e volta pelo TCP/HTTP stack)
Se o processo morrer no meio, handler fica pendurado
/simulate/all-knockouts chama /simulate/knockout via HTTP em loop → N requisições HTTP self-looped por fase. Para 16 jogos isso é absurdo.
Se você mover pra produção com porta diferente, quebra.

Fix: extraia a lógica em funções (getStartersFromDB(), simulateKnockoutMatch(matchId)) e chame diretamente. Só mantenha o fetch para chamadas de front → back.
5. Race condition ao simular todas as partidas em paralelo
No game-real.js:429 você parece simular em loop. Se em algum momento virar Promise.all, a inserção em groups_standings não é atômica → classificação sai errada. Também em /simulate/all-knockouts o loop é sequencial (ok), mas se virar paralelo vira caos. Deixe explícito com comentário ou use transação.
6. /manual/match permite pontuação negativa / letras (server.js:519)
Não há validação de homeScore, awayScore. Usuário pode mandar -3, "abc", 999999, null. O banco aceita tudo virando bug visual ou crash. Mesma coisa em /manual/knockout com winnerId — nada impede o front mandar um winnerId que não é nem home_id nem away_id da partida.
7. /manual/match não impede re-submissão (mesmo bug do #3)
Salvar resultado 2× na mesma partida → standings duplicados. Bug garantido porque no modo manual o usuário vai clicar Salvar duas vezes por engano.
8. getWinnerByMatchNumber / getLoserByMatchNumber crasham se não houver vencedor (server.js:174, 184)
jsreturn rows[0].winner_id;  // se rows[] for vazio, crasha
Se alguém chamar /generate-r16 antes de simular todo o r32, quebra com erro feio de undefined. Valide.
9. /generate-r32 não checa se já foi gerado
Chamar duas vezes insere tudo de novo → duplica 16 confrontos. Idem pra r16, qf, sf, final. Todas essas rotas precisam de um check "já existe partida em stage = X? aborta".
10. Seed quebra se re-executado (seed.js)
Insere INSERT INTO selections sem IGNORE e sem check. Rodar node seed.js duas vezes → 96 seleções no banco. O fallback no server.js:133 (total === 0) evita que aconteça em produção, mas o seed.js standalone é uma arma.
11. Partidas de grupo podem ser duplicadas em modo real (server.js:622-640)
jsif(rows[0].total === 0){ // cria partidas }
Se /simulation for chamado com mode: real depois de ter simulado manual (que também cria partidas), total === 0 é falso → não cria de novo. Mas não limpa também. O modo manual chama resetGameData() antes, mas o modo real não → se o usuário fizer manual → volta pra home → real, as partidas manuais persistem. Isso combinado com o front achando que está em "real" = desastre.
12. ORDER BY errado em /qualifiers (server.js:386)
sqlORDER BY gs.group_id ASC, total_points DESC, total_goal_difference DESC
total_points e total_goal_difference são aliases de SUM(...) — em alguns dialetos MySQL isso funciona, mas o ideal é ordenar por SUM(gs.points) DESC. Se rodar em modo strict, quebra. Também o critério de desempate ignora gols pró como tiebreaker intra-grupo (só ordena terceiros por ele depois).
13. Desempate de grupo incompleto (server.js:255)
ORDER BY total_points DESC, total_goal_difference DESC — não tem critério de gols marcados como 3º desempate, nem confronto direto. Pela regra FIFA: pontos → saldo → gols pró → confronto direto → fair play → sorteio. Pelo menos adicione total_goals_for.
14. simulatePenaltyShootout sem proteção de pós-primeira-série (simulation-logic.js:302-320)
Você cobra os 5 pênaltis sempre até o fim, mesmo se já estiver matematicamente decidido no 4º. Ex: 3×0 após 4 cobranças → os pênaltis 5 deveriam ser dispensados. Não quebra nada, mas fica tecnicamente errado (jogo real para antes).
15. poisson() pode retornar número absurdo
Se xG for muito alto (>10), o algoritmo ainda funciona, mas como o xG usa (attackRating - defenseRatingB)/100 sem clamp, pode dar xG = 8. O resultado fica tipo Brasil 11×0 Argentina. Adicione Math.max(0.3, Math.min(5, xG)) como salvaguarda.
16. calculateWinProbability divide por zero se strengths zeradas
Improvável mas possível se uma seleção tiver ranking = 91 exato e players com rating 0. Adicione um if(totalStrength === 0) return {0.5, 0.5}.

🟡 ERROS DE LÓGICA / MODELAGEM
17. Schema: matches_id em groups_standings é confuso
Cada linha de groups_standings é "time X na partida Y". É um registro de evento, não de classificação acumulada. O nome deveria ser algo como match_standings_events ou similar. Não quebra, mas confunde queries futuras.
18. Falta índice em colunas de JOIN
Sem INDEX em matches.stage, matches.group_id, player_match_stats.match_id, goal_events.match_id. Com 104 jogos × 22 jogadores = 2288 rows em player_match_stats, ainda rápido, mas a query de /performance com GROUP BY + ORDER BY em dados sem índice vai degradar. Adicione.
19. selectGoalscorer pode dar gol para o goleiro
Olha a cadeia de if/else — se random cair no else final E gks.length > 0, o goleiro marca. Acontece com probabilidade ~2%. Não é impossível no futebol real, mas quase sempre é bug. Intencional? Se sim, ignore. Se não, remova o ramo do GK.
20. selectAssist permite mesmo jogador dar gol E assistência no mesmo gol
Não há dedupe. Um atacante pode "assistir a si mesmo". Filtre: if(assister.id === scorer.id) re-sorteie.
21. Rating de calculatePlayerRating truncado (simulation-logic.js)
Não vi o final da função (linha 218+ truncada), mas pela lógica que vi, nada limita rating entre 1-10. Um atacante com 3 gols em jogo ganho com clean sheet do time dele (se atacante) vira 6.0 + 4.5 + 0.5 = 11.0. Cap em 10.
22. Terceiros classificados: sorteio de chaveamento não-FIFA (simulation-logic.js:361)
A regra real da FIFA 2026 pra terceiros colocados é uma tabela fixa baseada em quais grupos produziram os terceiros (tipo "se 3ºs A/B/C/D se classificam → 1ºA joga 3ºC", etc). Seu assignThirds é random. Está ok se você declarou "é aleatório", mas não replica a regra real.

🟠 SEGURANÇA E ROBUSTEZ
23. Zero tratamento de erro nas rotas Express
Nenhum try/catch. Se o MySQL cair no meio de uma query, Express manda stack trace pro cliente. Envolva tudo num middleware de erro global ou em try/catch individual.
24. CORS totalmente aberto (server.js:12)
jsapp.use(cors());
Para desenvolvimento ok, produção não. Limite origens.
25. Falta rate limiting
Qualquer um consegue DoSar seu servidor batendo em /simulate-knockout-stage em loop. Use express-rate-limit.
26. URLs hardcoded http://localhost:8000 (em todo o front + server.js)
Vai dar dor de cabeça no deploy. Use uma constante API_BASE_URL no front (e variável de ambiente no back).
27. Sem validação de input com lib dedicada
Use zod ou joi nas rotas POST. Atualmente o backend confia cegamente no body.

🟢 MELHORIAS DE CÓDIGO / UX
28. server.js com 1152 linhas é monolítico
Separe em routes/selections.js, routes/matches.js, routes/knockout.js, routes/manual.js, db/init.js, db/queries.js. Vai te salvar tempo no futuro.
29. particles.js cria 260 partículas sem considerar mobile
Em celular fraco, 260 partículas em requestAnimationFrame derruba FPS. Faça const count = window.innerWidth < 768 ? 80 : 260;.
30. particles.js não tem pauseOnHide
Continua rodando com a aba escondida. Use document.visibilityState para pausar.
31. Fetch sem try/catch no front
Ex: home.js, simulation.js, game-real.js:133. Se o servidor cair, o usuário vê tela em branco sem nenhuma mensagem. Sempre:
jstry { /* fetch */ } catch(e){ showError("Servidor offline"); }
32. simulation.js tem bug lógico pequeno (simulation.js:20-28)
jsif (mode === "real") { window.location.href = "game-real.html"; }
else { window.location.href = "game-manual.html"; }

if (mode === "manual") { loader.classList.remove("active"); }
O segundo if é inalcançável porque window.location.href já disparou navegação. Remove.
33. home.js usa setTimeout como delay artificial (750ms)
Tá ok pra UX se quiser mostrar loader, mas se o usuário clicar 2× o setTimeout dispara 2 navegações. Desabilite o botão após o primeiro clique.
34. Tradução de nomes de times duplicada (game-real.js)
Existe countryFlags e teamNames separados. Podia ser uma estrutura única { "México": { flag: "mx", en: "Mexico" } }.
35. Seed ignora falha parcial
Se inserir 30 seleções e quebrar na 31, o banco fica num estado inconsistente. Envolva seed em transação (BEGIN/COMMIT/ROLLBACK).
36. validate.js não valida posições
Checa só 26 jogadores e 11 titulares. E se um time tiver 15 atacantes e 0 GK? O simulatePenaltyShootout vai quebrar em gkA = undefined. Adicione validação de formação (1 GK, min 3 DEF, min 3 MID, min 2 FWD entre os titulares).
37. reset no front não reseta cache de shootouts (game-real.js:22)
shootoutCache é um Map em memória. Depois do reset, se o usuário ainda tiver a página aberta, os shootouts antigos aparecem em jogos novos. Limpe o Map no botão reset.
38. Acessibilidade

btnLang não tem aria-label
Botões com ícone só (sem texto para leitores de tela)
Modais sem focus trap — tab sai do modal
Sem prefers-reduced-motion pras animações

39. Mobile
O game-real.html não tem viewport-fit nem responsivo evidente (não vi game-real.css). Teste em 360px.
40. Não há loading state visível durante simulação
Simular 8 jogos de R32 leva uns segundos. O usuário não sabe se clicou. Adicione feedback.
