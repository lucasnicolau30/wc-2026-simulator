const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const { calculateStrength, calculateWinProbability, calculateSelectionsRatings, calculateXG, poisson, calculateCleanSheet, selectGoalscorer, selectAssist, generateGoalMinutes, calculateGroupStageResult, calculatePlayerRating, simulateMatchGroupStage } = require('./simulation-logic');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

// promise pra poder usar async 
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2516',
    database: 'wc2026'
}).promise();

app.get('/selections', async(req, res) => {    
    // join para eu pegar o nome do grupo, seleciono tudo de selections e o nome do grupo, depois faço o join com a tabela de grupos usando o group_id
    const [rows] = await pool.query('SELECT selections.*, `groups`.name AS group_name FROM selections JOIN `groups` ON selections.group_id = `groups`.id');
    res.json(rows);
});

app.get('/starters', async(req, res) => {
    const [rows] = await pool.query('SELECT players.*, selections.name AS selection_name, selections.ranking FROM players JOIN selections ON players.selection_id = selections.id WHERE players.is_starter = true');
    res.json(rows);
});

app.get('/standings/:groupId', async(req, res) => {
    const groupId = req.params.groupId;
    
    const [rows] = await pool.query(`
        SELECT s.name, pms.selection_id,
        SUM(pms.points) AS total_points,
        SUM(pms.wins) AS total_wins,
        SUM(pms.draws) AS total_draws,
        SUM(pms.losses) AS total_losses,
        SUM(pms.wins + pms.draws + pms.losses) AS total_played,
        SUM(pms.goals_for) AS total_goals_for,
        SUM(pms.goals_against) AS total_goals_against,
        SUM(pms.goal_difference) AS total_goal_difference FROM groups_standings pms JOIN selections s ON pms.selection_id = s.id WHERE pms.group_id = ? GROUP BY pms.selection_id, s.name ORDER BY total_points DESC, total_goal_difference DESC`,
        [groupId]
    );

    res.json(rows);
});

app.get('/player-stats/:playerId', async(req, res) => {
    const playerId = req.params.playerId;

    const [rows] = await pool.query(`SELECT p.name, pms.player_id, SUM(pms.goals) AS total_goals, SUM(pms.assists) AS total_assists, SUM(pms.clean_sheet) AS total_clean_sheets, AVG(pms.rating) AS average_rating FROM player_match_stats pms JOIN players p ON pms.player_id = p.id WHERE pms.player_id = ? GROUP BY pms.player_id, p.name`,
        [playerId]
    );

    res.json(rows);
});

app.get('/matches', async(req, res) => {
    const [rows] = await pool.query(`SELECT m.id, m.round, m.stage, m.home_score, m.away_score, m.home_xg, m.away_xg,
        h.name AS home_name, a.name AS away_name FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.stage = 'group' ORDER BY m.round ASC, m.id ASC`
    );
    res.json(rows);
});

app.get('/matches/:id/events', async(req, res) => {
    const matchId = req.params.id;

    const [rows] = await pool.query(`SELECT ge.minute, p.name AS player_name, sel.name AS team_name FROM goal_events ge JOIN players p ON ge.player_id = p.id JOIN selections sel ON p.selection_id = sel.id WHERE ge.match_id = ? ORDER BY ge.minute ASC`,
        [matchId]
    );
    res.json(rows);
});

app.get('/performance/:metric', async(req, res) => {
    const metric = req.params.metric;

    const metricMap = {
        'goals': 'SUM(pms.goals)',
        'assists': 'SUM(pms.assists)',
        'cleanSheets': 'SUM(pms.clean_sheet)',
        'rating': 'AVG(pms.rating)'
    };

    const orderBy = metricMap[metric];
    if(!orderBy){
        return res.status(400).json({ error: 'metric inválido' });
    } 

    const [rows] = await pool.query(`SELECT p.name AS player_name, sel.name AS selection_name, p.position,
        SUM(pms.goals) AS total_goals,
        SUM(pms.assists) AS total_assists,
        SUM(pms.clean_sheet) AS total_clean_sheets,
        AVG(pms.rating) AS average_rating
        FROM player_match_stats pms JOIN players p ON pms.player_id = p.id JOIN selections sel ON p.selection_id = sel.id GROUP BY pms.player_id, p.name, sel.name, p.position ORDER BY ${orderBy} DESC LIMIT 25`
    )
    
    res.json(rows);
});

app.post('/simulation', async(req, res) => {
    const mode = req.body.mode;
    if(mode === 'real'){
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM matches');
        
        if(rows[0].total === 0){
            const [groups] = await pool.query('SELECT * FROM `groups`');
            const roundMap = {
                '0-1': 1, '2-3': 1,
                '0-2': 2, '1-3': 2,
                '0-3': 3, '1-2': 3
            };
            for(const group of groups){
                const [selections] = await pool.query('SELECT * FROM selections WHERE group_id = ?', [group.id]);
                for(let i = 0; i < selections.length; i++){
                    for(let j = i + 1; j < selections.length; j++){
                        const round = roundMap[`${i}-${j}`];
                        await pool.query(
                            'INSERT INTO matches (home_id, away_id, stage, group_id, round) VALUES (?, ?, ?, ?, ?)',
                            [selections[i].id, selections[j].id, 'group', group.id, round]
                        );
                    }
                }
            }
        }

        const strength = await calculateStrength();
        res.json({ strength });
    }
});

app.post('/simulate/match', async(req, res) => {
    const { matchId } = req.body;

    const [matchRows] = await pool.query(
        'SELECT m.*, h.name AS home_name, a.name AS away_name FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.id = ?',
        [matchId]
    );
    const match = matchRows[0];
    const selectionA = match.home_name;
    const selectionB = match.away_name;
    const groupId = match.group_id;
    const idA = match.home_id;
    const idB = match.away_id;

    const strengths = await calculateStrength();
    const response = await fetch("http://localhost:8000/starters");
    const starterPlayers = await response.json();

    const teams = {};
    for(const player of starterPlayers){
        if(!teams[player.selection_name]){
            teams[player.selection_name] = [];
        } 
        teams[player.selection_name].push(player);
    }

    const result = simulateMatchGroupStage(
        selectionA, teams[selectionA], strengths[selectionA],
        selectionB, teams[selectionB], strengths[selectionB]
    );

    await pool.query(
        'UPDATE matches SET home_score = ?, away_score = ?, home_xg = ?, away_xg = ? WHERE id = ?',
        [result.goalsA, result.goalsB, result.xgA, result.xgB, matchId]
    );

    let winsA = 0, drawsA = 0, lossesA = 0;
    if(result.pointsA === 3){
        winsA = 1;
    }
    else if(result.pointsA === 1){
        drawsA = 1;
    }
    else{
        lossesA = 1;
    }

    let winsB = 0, drawsB = 0, lossesB = 0;
    if(result.pointsB === 3){
        winsB = 1;
    }
    else if(result.pointsB === 1){
        drawsB = 1;
    }
    else{
        lossesB = 1;
    }

    await pool.query(
        'INSERT INTO groups_standings (group_id, selection_id, matches_id, points, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [groupId, idA, matchId, result.pointsA, winsA, drawsA, lossesA, result.goalsA, result.goalsB, result.goalsA - result.goalsB]
    );

    await pool.query(
        'INSERT INTO groups_standings (group_id, selection_id, matches_id, points, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [groupId, idB, matchId, result.pointsB, winsB, drawsB, lossesB, result.goalsB, result.goalsA, result.goalsB - result.goalsA]
    );

    for(const player of teams[selectionA]){
        const scored = result.scorersA.filter(s => s.name === player.name).length;
        const assisted = result.assistsA.filter(a => a.name === player.name).length;
        const playerRating = result.playerRatingsA.find(p => p.player === player.name);
        const cleanSheet = player.position === 'GK' && result.goalsB === 0;

        await pool.query(
            'INSERT INTO player_match_stats (player_id, match_id, goals, assists, rating, clean_sheet) VALUES (?, ?, ?, ?, ?, ?)',
            [player.id, matchId, scored, assisted, playerRating.rating, cleanSheet]
        );

        const playerEvents = result.events.filter(e => e.player === player.name && e.team === selectionA);
        for(const event of playerEvents){
            await pool.query(
                'INSERT INTO goal_events (match_id, player_id, minute) VALUES (?, ?, ?)',
                [matchId, player.id, event.minute]
            );
        }
    }

    for(const player of teams[selectionB]){
        const scored = result.scorersB.filter(s => s.name === player.name).length;
        const assisted = result.assistsB.filter(a => a.name === player.name).length;
        const playerRating = result.playerRatingsB.find(p => p.player === player.name);
        const cleanSheet = player.position === 'GK' && result.goalsA === 0;

        await pool.query(
            'INSERT INTO player_match_stats (player_id, match_id, goals, assists, rating, clean_sheet) VALUES (?, ?, ?, ?, ?, ?)',
            [player.id, matchId, scored, assisted, playerRating.rating, cleanSheet]
        );

        const playerEvents = result.events.filter(e => e.player === player.name && e.team === selectionB);
        for(const event of playerEvents){
            await pool.query(
                'INSERT INTO goal_events (match_id, player_id, minute) VALUES (?, ?, ?)',
                [matchId, player.id, event.minute]
            );
        }
    }

    res.json(result);
});