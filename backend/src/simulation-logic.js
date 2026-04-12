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
    const probabiityA = parseFloat((strengthA / totalStrength)).toFixed(5);
    const probabiityB = parseFloat((strengthB / totalStrength)).toFixed(5);
    const random = Math.random();
    let winner;
    if(random < probabiityA){
        winner = selectionA;
        console.log(probabiityA);
        console.log(random);
    }
    else{
        winner = selectionB;
        console.log(probabiityB);
        console.log(random);
    }
    return winner;
}

module.exports = { calculateStrength, calculateWinProbability };