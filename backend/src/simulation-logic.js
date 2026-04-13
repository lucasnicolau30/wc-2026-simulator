const MAX_RANKING_POINTS = 91;

async function calculateStrength(){
     // fetch retorna o envelope HTTP, com (status, headers, body cru)
    const response = await fetch("http://localhost:8000/starters");
    // transforma em objeto JS a partir do JSON retornado pelo backend
    const starterPlayers = await response.json();

    const teams = {};
    for(const player of starterPlayers){
        if(!teams[player.selection_name]){
            teams[player.selection_name] = [];
        }
        teams[player.selection_name].push(player);
    }

    const teamStrength = {};
    for(const selectionName of Object.keys(teams)){
        const players = teams[selectionName];
        const rankingRating = MAX_RANKING_POINTS - players[0].ranking;
        let totalOverRating = 0;  
        for(let i = 0; i < players.length; i ++){
            totalOverRating += players[i].rating;
        }
        const overRating = totalOverRating / players.length;
        teamStrength[selectionName] = parseFloat(((overRating * 0.7) + (rankingRating * 0.3)).toFixed(2));
    }
    return teamStrength;
}

function calculateWinProbability(selectionA, strengthA, selectionB, strengthB){
    const totalStrength = strengthA + strengthB;
    const probabilityA = parseFloat((strengthA / totalStrength).toFixed(5));
    const probabilityB = parseFloat((strengthB / totalStrength).toFixed(5));

    return { probabilityA, probabilityB };
}

function calculateSelectionsRatings(players){
    const attackers = players.filter(player => player.position === 'FWD' || player.position === 'MID');
    const defenders = players.filter(player => player.position === 'DEF' || player.position === 'GK');
    let attackRating = 0;
    let defenseRating = 0;

    for(let i = 0; i < attackers.length; i ++){
        attackRating += attackers[i].rating;
    }
    attackRating = parseFloat((attackRating / attackers.length).toFixed(1));

    for(let i = 0; i < defenders.length; i ++){
        defenseRating += defenders[i].rating;
    }
    defenseRating = parseFloat((defenseRating / defenders.length).toFixed(1));

    return { attackRating, defenseRating };
}

function calculateXG(attackRatingA, defenseRatingA, probabilityA, attackRatingB, defenseRatingB, probabilityB){
    const potencialA = (attackRatingA - defenseRatingB)/100;
    const bonusA = (probabilityA - 0.5) * 0.5;
    const xgA = parseFloat((1.3 + (potencialA * 3.0) + bonusA).toFixed(1));

    const potencialB = (attackRatingB - defenseRatingA)/100;
    const bonusB = (probabilityB - 0.5) * 0.5;
    const xgB = parseFloat((1.3 + (potencialB * 3.0) + bonusB).toFixed(1));

    return { xgA, xgB };
}

function poisson(xG){
    let L = Math.exp(-xG);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while(p > L);
    return k - 1;
}

function selectGoalscorer(players, goals){
    const attackers = players.filter(player => player.position === 'FWD');
    const middfielders = players.filter(player => player.position === 'MID');
    const defenders = players.filter(player => player.position === 'DEF');
    const gks = players.filter(player => player.position === 'GK');
    const goalscorers = [];

    for(let i = 0; i < goals; i++){
        const random = Math.random();
        let scorer;

        if(random < 0.6 && attackers.length > 0){
            scorer = attackers[Math.floor(Math.random() * attackers.length)];
        } 
        else if(random < 0.9 && middfielders.length > 0){
            scorer = middfielders[Math.floor(Math.random() * middfielders.length)];
        } 
        else if(random < 0.98 && defenders.length > 0){
            scorer = defenders[Math.floor(Math.random() * defenders.length)];
        } 
        else if(gks.length > 0){
            scorer = gks[Math.floor(Math.random() * gks.length)];
        }

        if(!scorer){
            scorer = players[Math.floor(Math.random() * players.length)];
        }

        goalscorers.push(scorer);
    }
    return goalscorers;
}

function generateGoalMinutes(scorersA, selectionA, scorersB, selectionB){
    const minA = [];
    const minB = [];

    if(scorersA.length > 0){
        for(let i = 0; i < scorersA.length; i++){
            minA.push({ player: scorersA[i], minute: Math.floor(Math.random() * 90) + 1 });
        }
    }

    if(scorersB.length > 0){
        for(let i = 0; i < scorersB.length; i++){
            minB.push({ player: scorersB[i], minute: Math.floor(Math.random() * 90) + 1 });
        }
    }
    
    const events = [...minA.map(e => ({...e, team: selectionA})), ...minB.map(e => ({...e, team: selectionB}))].sort((a, b) => a.minute - b.minute);

    return events;
}

function calculateGroupStageResult(selectionA, goalsA, selectionB, goalsB){
    let winner;
    let pointsA = 0;
    let pointsB = 0;
    if(goalsA > goalsB){
        winner = selectionA;
        pointsA = 3;
    }
    else if(goalsB > goalsA){
        winner = selectionB;
        pointsB = 3;
    }
    else{
        pointsA = 1;
        pointsB = 1;
    }

    return { winner, pointsA, pointsB };
}

// function adjustScore(winner, selectionA, goalsA, selectionB, goalsB){
//     let aux;
//     if(winner == sele)
// }

module.exports = { calculateStrength, calculateWinProbability, calculateSelectionsRatings };

async function test() {
    const strengths = await calculateStrength();

    const response = await fetch("http://localhost:8000/starters");
    const starterPlayers = await response.json();

    const teams = {};
    for(const player of starterPlayers){
        if(!teams[player.selection_name]) teams[player.selection_name] = [];
        teams[player.selection_name].push(player);
    }

    const brasilRatings = calculateSelectionsRatings(teams['Brasil']);
    const argentinaRatings = calculateSelectionsRatings(teams['Argentina']);
    const francaRatings = calculateSelectionsRatings(teams['França']);
    const haitiRatings = calculateSelectionsRatings(teams['Haiti']);
    const novaZelandiaRatings = calculateSelectionsRatings(teams['Nova Zelândia']);

    console.log('--- Brasil vs Argentina ---');
    const { probabilityA: prob1A, probabilityB: prob1B } = calculateWinProbability('Brasil', strengths['Brasil'], 'Argentina', strengths['Argentina']);
    const xg1 = calculateXG(brasilRatings.attackRating, brasilRatings.defenseRating, prob1A, argentinaRatings.attackRating, argentinaRatings.defenseRating, prob1B);
    const goals1A = poisson(xg1.xgA);
    const goals1B = poisson(xg1.xgB);
    console.log(`Probabilidade: ${prob1A} x ${prob1B}`);
    console.log(`XG: ${xg1.xgA} x ${xg1.xgB}`);
    console.log(`Gols: Brasil ${goals1A} x Argentina ${goals1B}`);
    const scorers1A = selectGoalscorer(teams['Brasil'], goals1A);
    const scorers1B = selectGoalscorer(teams['Argentina'], goals1B);
    const events1 = generateGoalMinutes(scorers1A, 'Brasil', scorers1B, 'Argentina');
    events1.forEach(e => console.log(`${e.minute}' - ${e.player.name} (${e.team})`));
    const result1 = calculateGroupStageResult('Brasil', goals1A, 'Argentina', goals1B);
    console.log(`Vencedor: ${result1.winner ?? 'Empate'}`);
    console.log(`Pontos: Brasil ${result1.pointsA} x Argentina ${result1.pointsB}`);

    console.log('--- França vs Haiti ---');
    const { probabilityA: prob2A, probabilityB: prob2B } = calculateWinProbability('França', strengths['França'], 'Haiti', strengths['Haiti']);
    const xg2 = calculateXG(francaRatings.attackRating, francaRatings.defenseRating, prob2A, haitiRatings.attackRating, haitiRatings.defenseRating, prob2B);
    const goals2A = poisson(xg2.xgA);
    const goals2B = poisson(xg2.xgB);
    console.log(`Probabilidade: ${prob2A} x ${prob2B}`);
    console.log(`XG: ${xg2.xgA} x ${xg2.xgB}`);
    console.log(`Gols: França ${goals2A} x Haiti ${goals2B}`);
    const scorers2A = selectGoalscorer(teams['França'], goals2A);
    const scorers2B = selectGoalscorer(teams['Haiti'], goals2B);
    const events2 = generateGoalMinutes(scorers2A, 'França', scorers2B, 'Haiti');
    events2.forEach(e => console.log(`${e.minute}' - ${e.player.name} (${e.team})`));
    const result2 = calculateGroupStageResult('França', goals2A, 'Haiti', goals2B);
    console.log(`Vencedor: ${result2.winner ?? 'Empate'}`);
    console.log(`Pontos: França ${result2.pointsA} x Haiti ${result2.pointsB}`);

    console.log('--- Brasil vs Nova Zelândia ---');
    const { probabilityA: prob3A, probabilityB: prob3B } = calculateWinProbability('Brasil', strengths['Brasil'], 'Nova Zelândia', strengths['Nova Zelândia']);
    const xg3 = calculateXG(brasilRatings.attackRating, brasilRatings.defenseRating, prob3A, novaZelandiaRatings.attackRating, novaZelandiaRatings.defenseRating, prob3B);
    const goals3A = poisson(xg3.xgA);
    const goals3B = poisson(xg3.xgB);
    console.log(`Probabilidade: ${prob3A} x ${prob3B}`);
    console.log(`XG: ${xg3.xgA} x ${xg3.xgB}`);
    console.log(`Gols: Brasil ${goals3A} x Nova Zelândia ${goals3B}`);
    const scorers3A = selectGoalscorer(teams['Brasil'], goals3A);
    const scorers3B = selectGoalscorer(teams['Nova Zelândia'], goals3B);
    const events3 = generateGoalMinutes(scorers3A, 'Brasil', scorers3B, 'Nova Zelândia');
    events3.forEach(e => console.log(`${e.minute}' - ${e.player.name} (${e.team})`));
    const result3 = calculateGroupStageResult('Brasil', goals3A, 'Nova Zelândia', goals3B);
    console.log(`Vencedor: ${result3.winner ?? 'Empate'}`);
    console.log(`Pontos: Brasil ${result3.pointsA} x Nova Zelândia ${result3.pointsB}`);
}

test();