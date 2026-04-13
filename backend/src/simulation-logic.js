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
    const probabiityA = parseFloat((strengthA / totalStrength).toFixed(5));
    const probabiityB = parseFloat((strengthB / totalStrength).toFixed(5));

    return { probabiityA, probabiityB };
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

function calculateXG(attackRatingA, defenseRatingA, probabiityA, attackRatingB, defenseRatingB, probabiityB){
    const potencialA = (attackRatingA - defenseRatingB)/100;
    const bonusA = (probabiityA - 0.5) * 0.5;
    const xgA = parseFloat((1.3 + (potencialA * 3.0) + bonusA).toFixed(1));

    const potencialB = (attackRatingB - defenseRatingA)/100;
    const bonusB = (probabiityB - 0.5) * 0.5;
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
    const { probabiityA: prob1A, probabiityB: prob1B } = calculateWinProbability('Brasil', strengths['Brasil'], 'Argentina', strengths['Argentina']);
    const xg1 = calculateXG(brasilRatings.attackRating, brasilRatings.defenseRating, prob1A, argentinaRatings.attackRating, argentinaRatings.defenseRating, prob1B);
    const goals1A = poisson(xg1.xgA);
    const goals1B = poisson(xg1.xgB);
    console.log(`Probabilidade: ${prob1A} x ${prob1B}`);
    console.log(`XG: ${xg1.xgA} x ${xg1.xgB}`);
    console.log(`Gols: Brasil ${goals1A} x Argentina ${goals1B}`);

    console.log('--- França vs Haiti ---');
    const { probabiityA: prob2A, probabiityB: prob2B } = calculateWinProbability('França', strengths['França'], 'Haiti', strengths['Haiti']);
    const xg2 = calculateXG(francaRatings.attackRating, francaRatings.defenseRating, prob2A, haitiRatings.attackRating, haitiRatings.defenseRating, prob2B);
    const goals2A = poisson(xg2.xgA);
    const goals2B = poisson(xg2.xgB);
    console.log(`Probabilidade: ${prob2A} x ${prob2B}`);
    console.log(`XG: ${xg2.xgA} x ${xg2.xgB}`);
    console.log(`Gols: França ${goals2A} x Haiti ${goals2B}`);

    console.log('--- Brasil vs Nova Zelândia ---');
    const { probabiityA: prob3A, probabiityB: prob3B } = calculateWinProbability('Brasil', strengths['Brasil'], 'Nova Zelândia', strengths['Nova Zelândia']);
    const xg3 = calculateXG(brasilRatings.attackRating, brasilRatings.defenseRating, prob3A, novaZelandiaRatings.attackRating, novaZelandiaRatings.defenseRating, prob3B);
    const goals3A = poisson(xg3.xgA);
    const goals3B = poisson(xg3.xgB);
    console.log(`Probabilidade: ${prob3A} x ${prob3B}`);
    console.log(`XG: ${xg3.xgA} x ${xg3.xgB}`);
    console.log(`Gols: Brasil ${goals3A} x Nova Zelândia ${goals3B}`);
}

test();