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
        teamStrength[selectionName] = parseFloat(((overRating * 0.4) + (rankingRating * 0.6)).toFixed(2));
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
    const bonusA = (probabilityA - 0.5) * 1.5;
    const xgA = parseFloat((1.0 + (potencialA * 5.0) + bonusA).toFixed(1));

    const potencialB = (attackRatingB - defenseRatingA)/100;
    const bonusB = (probabilityB - 0.5) * 1.5;
    const xgB = parseFloat((1.0 + (potencialB * 5.0) + bonusB).toFixed(1));

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

function calculateCleanSheet(goalsA, goalsB){
    let cleanSheetA = false;
    let cleanSheetB = false;

    if(goalsA === 0){
        cleanSheetA = true;
    }
    if(goalsB === 0){
        cleanSheetB = true;
    }

    return { cleanSheetA, cleanSheetB };
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

function selectAssist(players, goals){
    const attackers = players.filter(player => player.position === 'FWD');
    const middfielders = players.filter(player => player.position === 'MID');
    const defenders = players.filter(player => player.position === 'DEF');
    const gks = players.filter(player => player.position === 'GK');
    const assists = [];

    for(let i = 0; i < goals; i++){
        const random = Math.random();
        let assister;

        if(random < 0.3 && attackers.length > 0){
            assister = attackers[Math.floor(Math.random() * attackers.length)];
        } 
        else if(random < 0.8 && middfielders.length > 0){
            assister = middfielders[Math.floor(Math.random() * middfielders.length)];
        } 
        else if(random < 0.95 && defenders.length > 0){
            assister = defenders[Math.floor(Math.random() * defenders.length)];
        } 
        else if(gks.length > 0){
            assister = gks[Math.floor(Math.random() * gks.length)];
        }

        if(!assister){
            assister = players[Math.floor(Math.random() * players.length)];
        }

        assists.push(assister);
    }
    return assists;
}

function generateGoalMinutes(scorersA, selectionA, scorersB, selectionB){
    const minA = [];
    const minB = [];

    if(scorersA.length > 0){
        for(let i = 0; i < scorersA.length; i++){
            minA.push({ player: scorersA[i].name, minute: Math.floor(Math.random() * 90) + 1 });
        }
    }

    if(scorersB.length > 0){
        for(let i = 0; i < scorersB.length; i++){
            minB.push({ player: scorersB[i].name, minute: Math.floor(Math.random() * 90) + 1 });
        }
    }
    
    const events = [...minA.map(e => ({...e, team: selectionA})), ...minB.map(e => ({...e, team: selectionB}))].sort((a, b) => a.minute - b.minute);

    return events;
}

function calculateGroupStageResult(selectionA, goalsA, selectionB, goalsB){
    let winner;
    let loser;
    let pointsA = 0;
    let pointsB = 0;
    if(goalsA > goalsB){
        winner = selectionA;
        loser = selectionB;
        pointsA = 3;
    }
    else if(goalsB > goalsA){
        winner = selectionB;
        loser = selectionA;
        pointsB = 3;
    }
    else{
        winner = null;
        loser = null;
        pointsA = 1;
        pointsB = 1;
    }

    return { winner, loser, pointsA, pointsB };
}

function calculatePlayerRating(player, scored, assisted, teamWon, teamLost, cleanSheet, goalsConceded){
    let rating = 6.0;

    rating += scored * 1.5;
    rating += assisted * 1.0;

    if(teamWon) rating += 0.5;
    if(teamLost) rating -= 0.5;

    if(cleanSheet && (player.position === 'DEF' || player.position === 'GK')){
        rating += 0.8;
    }
    if(!cleanSheet && player.position === 'GK'){
        rating -= 0.8;
    }
    if(player.position === 'GK'){
        rating -= goalsConceded * 0.3;
    }

    return parseFloat(Math.min(10, Math.max(1, rating)).toFixed(1));
}

function simulateMatchGroupStage(selectionA, playersA, strengthA, selectionB, playersB, strengthB){
    const { probabilityA, probabilityB } = calculateWinProbability(selectionA, strengthA, selectionB, strengthB);
    const { attackRating: attackRatingA, defenseRating: defenseRatingA } = calculateSelectionsRatings(playersA);
    const { attackRating: attackRatingB, defenseRating: defenseRatingB } = calculateSelectionsRatings(playersB);
    const { xgA, xgB } = calculateXG(attackRatingA, defenseRatingA, probabilityA, attackRatingB, defenseRatingB, probabilityB);
    const goalsA = poisson(xgA);
    const goalsB = poisson(xgB);
    const { cleanSheetA, cleanSheetB } = calculateCleanSheet(goalsA, goalsB);
    const scorersA = selectGoalscorer(playersA, goalsA);
    const scorersB = selectGoalscorer(playersB, goalsB);
    const assistsA = selectAssist(playersA, goalsA);
    const assistsB = selectAssist(playersB, goalsB);
    const events = generateGoalMinutes(scorersA, selectionA, scorersB, selectionB);
    const { winner, loser, pointsA, pointsB } = calculateGroupStageResult(selectionA, goalsA, selectionB, goalsB);
    const playerRatingsA = [];
    for(let i = 0; i < playersA.length; i++){
        const player = playersA[i];
        const scored = scorersA.filter(s => s.id === player.id).length;
        const assisted = assistsA.filter(a => a.id === player.id).length;
        const rating = calculatePlayerRating(player, scored, assisted, winner === selectionA, loser === selectionA, cleanSheetA, goalsB);
        playerRatingsA.push({ player: player.name, position: player.position, rating });
    }

    const playerRatingsB = [];
    for(let i = 0; i < playersB.length; i++){
        const player = playersB[i];
        const scored = scorersB.filter(s => s.id === player.id).length;
        const assisted = assistsB.filter(a => a.id === player.id).length;
        const rating = calculatePlayerRating(player, scored, assisted, winner === selectionB, loser === selectionB, cleanSheetB, goalsA);
        playerRatingsB.push({ player: player.name, position: player.position, rating });
    }

    return { 
    winner, loser, pointsA, pointsB, goalsA, goalsB, xgA, xgB, events, playerRatingsA, playerRatingsB,
    scorersA: scorersA.map(s => ({ name: s.name, position: s.position })),
    scorersB: scorersB.map(s => ({ name: s.name, position: s.position })),
    assistsA: assistsA.map(a => ({ name: a.name, position: a.position })),
    assistsB: assistsB.map(a => ({ name: a.name, position: a.position }))
    };
}

function simulatePenaltyShootout(playersA, selectionA, playersB, selectionB){
    const gkA = playersA.find(p => p.position === 'GK');
    const gkB = playersB.find(p => p.position === 'GK');

    const sortedA = [...playersA].sort((a, b) => {
        if(b.rating > a.rating){
            return 1;
        } 
        if(a.rating > b.rating){
            return -1;
        } 
        return 0;
    });

    const sortedB = [...playersB].sort((a, b) => {
        if(b.rating > a.rating){
            return 1;
        } 
        if(a.rating > b.rating){
            return -1;
        } 
        return 0;
    });

    const kickersA = sortedA.slice(0, 5);
    const kickersB = sortedB.slice(0, 5);

    let goalsA = 0;
    let goalsB = 0;
    let eventsA = [];
    let eventsB = [];

    for(let i = 0; i < 5; i++){
        const chanceA = (kickersA[i].rating - gkB.rating + 150) / 200;
        if(Math.random() < chanceA){
            goalsA++;
            eventsA.push({ player: kickersA[i].name, scored: true });
        } 
        else{
            eventsA.push({ player: kickersA[i].name, scored: false });
        }

        const chanceB = (kickersB[i].rating - gkA.rating + 150) / 200;
        if(Math.random() < chanceB){
            goalsB++;
            eventsB.push({ player: kickersB[i].name, scored: true });
        } 
        else{
            eventsB.push({ player: kickersB[i].name, scored: false });
        }
    }

    // morte súbita — começa do 6º jogador
    let kickerIndex = 5;
    while(goalsA === goalsB){
        const kA = sortedA[kickerIndex % sortedA.length];
        const chanceA = (kA.rating - gkB.rating + 150) / 200;
        const scoredA = Math.random() < chanceA;
        if(scoredA){
            goalsA++;
            eventsA.push({ player: kA.name, scored: scoredA });
        } 
        else{
            eventsA.push({ player: kA.name, scored: false });
        }

        const kB = sortedB[kickerIndex % sortedB.length];
        const chanceB = (kB.rating - gkA.rating + 150) / 200;
        const scoredB = Math.random() < chanceB;
        if(scoredB){
            goalsB++;
            eventsB.push({ player: kB.name, scored: scoredB });
        }
        else{
            eventsB.push({ player: kB.name, scored: false });            
        }

        kickerIndex++;
    }

    let winner;
    if(goalsA > goalsB){
        winner = selectionA;
    } 
    else{
        winner = selectionB;
    }

    return { winner, goalsA, goalsB, eventsA, eventsB };
}

function assignThirds(firsts, thirds){
    const shuffled = [...thirds].sort(() => Math.random() - 0.5);
    const assignments = [];
    const used = new Set();

    for(const first of firsts){
        const validThird = shuffled.find(t => t.group_id !== first.group_id && !used.has(t.id));
        
        // if apenas por precaução, mas não deve acontecer de não encontrar um terceiro válido
        if(validThird){
            used.add(validThird.id);
            assignments.push({ first, third: validThird });
        }
    }

    return assignments;
}

function calculateKnockoutResult(selectionA, goalsA, selectionB, goalsB){
    let winner;
    let loser;
    if(goalsA > goalsB){
        winner = selectionA;
        loser = selectionB;
    }
    else if(goalsB > goalsA){
        winner = selectionB;
        loser = selectionA;
    }
    else{
        winner = null;
        loser = null;
    }

    return { winner, loser };
}

function simulateMatchKnockout(selectionA, playersA, strengthA, selectionB, playersB, strengthB){
    const { probabilityA, probabilityB } = calculateWinProbability(selectionA, strengthA, selectionB, strengthB);
    const { attackRating: attackRatingA, defenseRating: defenseRatingA } = calculateSelectionsRatings(playersA);
    const { attackRating: attackRatingB, defenseRating: defenseRatingB } = calculateSelectionsRatings(playersB);
    const { xgA, xgB } = calculateXG(attackRatingA, defenseRatingA, probabilityA, attackRatingB, defenseRatingB, probabilityB);
    const goalsA = poisson(xgA);
    const goalsB = poisson(xgB);
    const { cleanSheetA, cleanSheetB } = calculateCleanSheet(goalsA, goalsB);
    const scorersA = selectGoalscorer(playersA, goalsA);
    const scorersB = selectGoalscorer(playersB, goalsB);
    const assistsA = selectAssist(playersA, goalsA);
    const assistsB = selectAssist(playersB, goalsB);
    const events = generateGoalMinutes(scorersA, selectionA, scorersB, selectionB);
    let shootout = null;
    let { winner, loser } = calculateKnockoutResult(selectionA, goalsA, selectionB, goalsB);
    if(!winner){
        shootout = simulatePenaltyShootout(playersA, selectionA, playersB, selectionB);
        winner = shootout.winner;
        if(winner === selectionA){
            loser = selectionB;
        } 
        else {
            loser = selectionA;
        }
    }
    const playerRatingsA = [];
    for(let i = 0; i < playersA.length; i++){
        const player = playersA[i];
        const scored = scorersA.filter(s => s.id === player.id).length;
        const assisted = assistsA.filter(a => a.id === player.id).length;
        const rating = calculatePlayerRating(player, scored, assisted, winner === selectionA, loser === selectionA, cleanSheetA, goalsB);
        playerRatingsA.push({ player: player.name, position: player.position, rating });
    }

    const playerRatingsB = [];
    for(let i = 0; i < playersB.length; i++){
        const player = playersB[i];
        const scored = scorersB.filter(s => s.id === player.id).length;
        const assisted = assistsB.filter(a => a.id === player.id).length;
        const rating = calculatePlayerRating(player, scored, assisted, winner === selectionB, loser === selectionB, cleanSheetB, goalsA);
        playerRatingsB.push({ player: player.name, position: player.position, rating });
    }

    return { 
    winner, loser, goalsA, goalsB, xgA, xgB, events, shootout, playerRatingsA, playerRatingsB,
    scorersA: scorersA.map(s => ({ name: s.name, position: s.position })),
    scorersB: scorersB.map(s => ({ name: s.name, position: s.position })),
    assistsA: assistsA.map(a => ({ name: a.name, position: a.position })),
    assistsB: assistsB.map(a => ({ name: a.name, position: a.position }))
    };
}

module.exports = { calculateStrength, calculateWinProbability, calculateSelectionsRatings, calculateXG, poisson, calculateCleanSheet, selectGoalscorer, selectAssist, generateGoalMinutes, calculateGroupStageResult, calculatePlayerRating, simulateMatchGroupStage, simulatePenaltyShootout, assignThirds, calculateKnockoutResult, simulateMatchKnockout };
