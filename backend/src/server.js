require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');
const { calculateStrength, calculateWinProbability, calculateSelectionsRatings, calculateXG, poisson, calculateCleanSheet, selectGoalscorer, selectAssist, generateGoalMinutes, calculateGroupStageResult, calculatePlayerRating, simulateMatchGroupStage, simulatePenaltyShootout, assignThirds, calculateKnockoutResult, simulateMatchKnockout } = require('./simulation-logic');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'wc2026';
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const corsOptions = FRONTEND_URL
    ? { origin: FRONTEND_URL.split(',').map(o => o.trim()), credentials: true }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 9000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

const simulationLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Limite de simulações excedido. Aguarde alguns segundos.' }
});

app.use(globalLimiter);

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: { title: 'WC 2026 API', version: '1.0.0', description: 'API para simulação da Copa do Mundo 2026' },
        servers: [{ url: 'http://localhost:8000' }],
    },
    apis: [__filename],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(path.join(__dirname, '..', '..', 'frontend'), { index: 'home.html' }));

let pool = null;

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Database initialized');
        });
    })
    .catch(err => {
        console.error('Falha ao inicializar o banco:', err);
        process.exit(1);
    });

async function initializeDatabase() {
    try {
        const initConn = await mysqlPromise.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });
        await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await initConn.end();
    } catch (err) {
        console.log(`[init] pulando CREATE DATABASE (${err.code || err.message}) — assumindo que o banco já existe`);
    }

    const conn = await mysqlPromise.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name CHAR(1) NOT NULL
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS selections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        ranking INT NOT NULL,
        formation VARCHAR(10) NOT NULL,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        selection_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        position ENUM('GK', 'DEF', 'MID', 'FWD') NOT NULL,
        rating INT NOT NULL,
        is_starter BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (selection_id) REFERENCES selections(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NULL,
        home_id INT NOT NULL,
        away_id INT NOT NULL,
        stage ENUM('group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final') NOT NULL,
        home_score INT DEFAULT NULL,
        away_score INT DEFAULT NULL,
        home_xg FLOAT DEFAULT 0,
        away_xg FLOAT DEFAULT 0,
        round INT NULL,
        match_number INT NULL,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id),
        FOREIGN KEY (home_id) REFERENCES selections(id),
        FOREIGN KEY (away_id) REFERENCES selections(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS groups_standings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        selection_id INT NOT NULL,
        matches_id INT NOT NULL,
        points INT DEFAULT 0,
        wins INT DEFAULT 0,
        draws INT DEFAULT 0,
        losses INT DEFAULT 0,
        goals_for INT DEFAULT 0,
        goals_against INT DEFAULT 0,
        goal_difference INT DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id),
        FOREIGN KEY (selection_id) REFERENCES selections(id),
        FOREIGN KEY (matches_id) REFERENCES matches(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS player_match_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        match_id INT NOT NULL,
        goals INT DEFAULT 0,
        assists INT DEFAULT 0,
        clean_sheet BOOLEAN DEFAULT FALSE,
        rating FLOAT DEFAULT 0,
        goal_minute INT NULL,
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (match_id) REFERENCES matches(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS knockouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        winner_id INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (winner_id) REFERENCES selections(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS goal_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        player_id INT NOT NULL,
        minute INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS shootout_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        team ENUM('home', 'away') NOT NULL,
        kick_order INT NOT NULL,
        player_name VARCHAR(100) NOT NULL,
        scored BOOLEAN NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id)
    )`);

    const [matchCols] = await conn.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'matches'",
        [DB_NAME]
    );
    const matchColNames = matchCols.map(c => c.COLUMN_NAME);
    if(!matchColNames.includes('shootout_home_score')){
        await conn.execute('ALTER TABLE matches ADD COLUMN shootout_home_score INT NULL');
    }
    if(!matchColNames.includes('shootout_away_score')){
        await conn.execute('ALTER TABLE matches ADD COLUMN shootout_away_score INT NULL');
    }

    const [countRows] = await conn.execute('SELECT COUNT(*) AS total FROM selections');

    if (countRows[0].total === 0) {
        console.log('Populando banco de dados...');

        const data = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../seed/selections.json'), 'utf-8')
        );

        for (const selection of data.selections) {
            await conn.execute('INSERT IGNORE INTO `groups` (name) VALUES (?)', [selection.group]);

            const [groupRows] = await conn.execute(
                'SELECT id FROM `groups` WHERE name = ?',
                [selection.group]
            );

            const group_id = groupRows[0].id;

            await conn.execute(
                'INSERT INTO selections (group_id, name, ranking, formation) VALUES (?, ?, ?, ?)',
                [group_id, selection.name, selection.ranking, selection.formation]
            );

            const [selRows] = await conn.execute(
                'SELECT id FROM selections WHERE name = ?',
                [selection.name]
            );

            const selection_id = selRows[0].id;

            for (const player of selection.players) {
                await conn.execute(
                    'INSERT INTO players (selection_id, name, age, position, rating, is_starter) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        selection_id,
                        player.name,
                        player.age,
                        player.position,
                        player.rating,
                        player.is_starter
                    ]
                );
            }

            console.log(`✓ ${selection.name} inserida`);
        }

        console.log('Seed concluído!');
    }

    await conn.end();

    if (!pool) {
        pool = mysql.createPool({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        }).promise();
    }
}

// funções helpers para gerar r16, qf, sf, 3rd, final
async function getWinnerByMatchNumber(matchNumber){
    const [rows] = await pool.query(
        'SELECT k.winner_id FROM knockouts k JOIN matches m ON k.match_id = m.id WHERE m.match_number = ?',
        [matchNumber]
    );
    return rows[0].winner_id;
}

async function getLoserByMatchNumber(matchNumber){
    const [rows] = await pool.query(
        `SELECT m.home_id, m.away_id, k.winner_id FROM knockouts k  JOIN matches m ON k.match_id = m.id WHERE m.match_number = ?`,
        [matchNumber]
    );
    
    const row = rows[0];
    let loserId;
    if(row.home_id === row.winner_id){
        loserId = row.away_id;
    }
    else{
        loserId = row.home_id;
    }
    return loserId;
}

// funções helpers para evitar chamadas HTTP dentro de chamdadas HTTP
async function getStartersFromDB() {
    const [rows] = await pool.query(
        'SELECT players.*, selections.name AS selection_name, selections.ranking FROM players JOIN selections ON players.selection_id = selections.id WHERE players.is_starter = true'
    );
    return rows;
}

async function simulateKnockoutMatchById(matchId) {
    const [matchRows] = await pool.query(
        'SELECT m.*, h.name AS home_name, a.name AS away_name FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.id = ?',
        [matchId]
    );
    if(matchRows.length === 0){
        throw Object.assign(new Error('partida não encontrada'), { status: 404 });
    }
    const match = matchRows[0];
    const selectionA = match.home_name;
    const selectionB = match.away_name;
    const idA = match.home_id;
    const idB = match.away_id;

    const starterPlayers = await getStartersFromDB();
    const strengths = calculateStrength(starterPlayers);

    const teams = {};
    for(const player of starterPlayers){
        if(!teams[player.selection_name]) teams[player.selection_name] = [];
        teams[player.selection_name].push(player);
    }

    const result = simulateMatchKnockout(
        selectionA, teams[selectionA], strengths[selectionA],
        selectionB, teams[selectionB], strengths[selectionB]
    );

    let winnerId;
    if(result.winner === selectionA){
        winnerId = idA;
    }
    else{
        winnerId = idB;
    }

    let shootoutHomeScore = null;
    let shootoutAwayScore = null;
    if(result.shootout){
        shootoutHomeScore = result.shootout.goalsA;
        shootoutAwayScore = result.shootout.goalsB;
    }

    await pool.query(
        'UPDATE matches SET home_score = ?, away_score = ?, home_xg = ?, away_xg = ?, shootout_home_score = ?, shootout_away_score = ? WHERE id = ?',
        [result.goalsA, result.goalsB, result.xgA, result.xgB, shootoutHomeScore, shootoutAwayScore, matchId]
    );

    await pool.query('DELETE FROM shootout_events WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM goal_events WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM player_match_stats WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM knockouts WHERE match_id = ?', [matchId]);

    await pool.query('INSERT INTO knockouts (match_id, winner_id) VALUES (?, ?)', [matchId, winnerId]);

    if(result.shootout){
        for(let i = 0; i < result.shootout.eventsA.length; i++){
            const kick = result.shootout.eventsA[i];
            await pool.query(
                'INSERT INTO shootout_events (match_id, team, kick_order, player_name, scored) VALUES (?, ?, ?, ?, ?)',
                [matchId, 'home', i, kick.player, kick.scored]
            );
        }
        for(let i = 0; i < result.shootout.eventsB.length; i++){
            const kick = result.shootout.eventsB[i];
            await pool.query(
                'INSERT INTO shootout_events (match_id, team, kick_order, player_name, scored) VALUES (?, ?, ?, ?, ?)',
                [matchId, 'away', i, kick.player, kick.scored]
            );
        }
    }

    for(const player of [...teams[selectionA], ...teams[selectionB]]){
        const isA = player.selection_name === selectionA;
        const scorers = isA ? result.scorersA : result.scorersB;
        const assists = isA ? result.assistsA : result.assistsB;
        const ratings = isA ? result.playerRatingsA : result.playerRatingsB;
        const goalsAgainst = isA ? result.goalsB : result.goalsA;
        const team = isA ? selectionA : selectionB;

        const scored = scorers.filter(s => s.name === player.name).length;
        const assisted = assists.filter(a => a.name === player.name).length;
        const playerRating = ratings.find(p => p.player === player.name);
        const cleanSheet = player.position === 'GK' && goalsAgainst === 0;

        await pool.query(
            'INSERT INTO player_match_stats (player_id, match_id, goals, assists, rating, clean_sheet) VALUES (?, ?, ?, ?, ?, ?)',
            [player.id, matchId, scored, assisted, playerRating.rating, cleanSheet]
        );

        const playerEvents = result.events.filter(e => e.player === player.name && e.team === team);
        for(const event of playerEvents){
            await pool.query(
                'INSERT INTO goal_events (match_id, player_id, minute) VALUES (?, ?, ?)',
                [matchId, player.id, event.minute]
            );
        }
    }

    return result;
}

/**
 * @swagger
 * /selections:
 *   get:
 *     summary: Retorna todas as seleções com seu grupo
 *     responses:
 *       200:
 *         description: Lista de seleções
 */
app.get('/selections', async(req, res) => {    
    // join para eu pegar o nome do grupo, seleciono tudo de selections e o nome do grupo, depois faço o join com a tabela de grupos usando o group_id
    const [rows] = await pool.query('SELECT selections.*, `groups`.name AS group_name FROM selections JOIN `groups` ON selections.group_id = `groups`.id');
    res.json(rows);
});

/**
 * @swagger
 * /starters:
 *   get:
 *     summary: Retorna todos os titulares de todas as seleções
 *     responses:
 *       200:
 *         description: Lista de jogadores titulares
 */
app.get('/starters', async(req, res) => {
    const [rows] = await pool.query('SELECT players.*, selections.name AS selection_name, selections.ranking FROM players JOIN selections ON players.selection_id = selections.id WHERE players.is_starter = true');
    res.json(rows);
});

/**
 * @swagger
 * /standings/{groupId}:
 *   get:
 *     summary: Classificação de um grupo
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Classificação do grupo
 */
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

/**
 * @swagger
 * /player-stats/{playerId}:
 *   get:
 *     summary: Estatísticas acumuladas de um jogador
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estatísticas do jogador
 */
app.get('/player-stats/:playerId', async(req, res) => {
    const playerId = req.params.playerId;

    const [rows] = await pool.query(`SELECT p.name, pms.player_id, SUM(pms.goals) AS total_goals, SUM(pms.assists) AS total_assists, SUM(pms.clean_sheet) AS total_clean_sheets, AVG(pms.rating) AS average_rating FROM player_match_stats pms JOIN players p ON pms.player_id = p.id WHERE pms.player_id = ? GROUP BY pms.player_id, p.name`,
        [playerId]
    );

    res.json(rows);
});

/**
 * @swagger
 * /matches:
 *   get:
 *     summary: Retorna todas as partidas da fase de grupos
 *     responses:
 *       200:
 *         description: Lista de partidas
 */
app.get('/matches', async(req, res) => {
    const [rows] = await pool.query(`SELECT m.id, m.home_id, m.away_id, m.round, m.stage, m.home_score, m.away_score, m.home_xg, m.away_xg,
        h.name AS home_name, a.name AS away_name FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.stage = 'group' ORDER BY m.round ASC, m.id ASC`
    );
    res.json(rows);
});

/**
 * @swagger
 * /matches/{id}/events:
 *   get:
 *     summary: Gols de uma partida (minuto e jogador)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de eventos de gol
 */
app.get('/matches/:id/events', async(req, res) => {
    const matchId = req.params.id;

    const [rows] = await pool.query(`SELECT ge.minute, p.name AS player_name, sel.name AS team_name FROM goal_events ge JOIN players p ON ge.player_id = p.id JOIN selections sel ON p.selection_id = sel.id WHERE ge.match_id = ? ORDER BY ge.minute ASC`,
        [matchId]
    );
    res.json(rows);
});

/**
 * @swagger
 * /performance/{metric}:
 *   get:
 *     summary: Ranking de jogadores por métrica
 *     parameters:
 *       - in: path
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [goals, assists, cleanSheets, rating]
 *     responses:
 *       200:
 *         description: Top 25 jogadores pela métrica
 *       400:
 *         description: Métrica inválida
 */
app.get('/performance/:metric', async(req, res) => {
    const metric = req.params.metric;
    const search = req.query.search ? req.query.search.trim() : '';

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

    const conditions = [];
    const params = [];

    if(metric === 'cleanSheets'){
        conditions.push("p.position = 'GK'");
    }

    if(search){
        conditions.push('p.name LIKE ?');
        params.push(`%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
        `SELECT p.name AS player_name, sel.name AS selection_name, p.position,
        SUM(pms.goals) AS total_goals,
        SUM(pms.assists) AS total_assists,
        SUM(pms.clean_sheet) AS total_clean_sheets,
        AVG(pms.rating) AS average_rating
        FROM player_match_stats pms JOIN players p ON pms.player_id = p.id JOIN selections sel ON p.selection_id = sel.id
        ${where}
        GROUP BY pms.player_id, p.name, sel.name, p.position ORDER BY ${orderBy} DESC LIMIT 25`,
        params
    );

    res.json(rows);
});

async function getQualifiers(){
    const [rows] = await pool.query('SELECT s.name, s.id, gs.group_id, g.name AS group_name, ' +
    'SUM(gs.points) AS total_points, ' +
    'SUM(gs.wins + gs.draws + gs.losses) AS total_played, ' +
    'SUM(gs.goals_for) AS total_goals_for, ' +
    'SUM(gs.goal_difference) AS total_goal_difference ' +
    'FROM groups_standings gs ' + 'JOIN selections s ON gs.selection_id = s.id ' + 'JOIN `groups` g ON gs.group_id = g.id ' + 'GROUP BY gs.selection_id, s.name, gs.group_id, g.name ' + 'ORDER BY gs.group_id ASC, total_points DESC, total_goal_difference DESC'
    );

    const groupedByGroup = {};
    for(const row of rows){
        if(!groupedByGroup[row.group_id]) groupedByGroup[row.group_id] = [];
        groupedByGroup[row.group_id].push(row);
    }

    const qualifiers = [];
    const thirds = [];

    for(const groupId of Object.keys(groupedByGroup)){
        const group = groupedByGroup[groupId];
        qualifiers.push({ ...group[0], position: 1 });
        qualifiers.push({ ...group[1], position: 2 });
        thirds.push({ ...group[2], position: 3 });
    }

    thirds.sort((a, b) => {
        if(a.total_points > b.total_points) return -1;
        if(b.total_points > a.total_points) return 1;
        if(a.total_goal_difference > b.total_goal_difference) return -1;
        if(b.total_goal_difference > a.total_goal_difference) return 1;
        if(a.total_goals_for > b.total_goals_for) return -1;
        if(b.total_goals_for > a.total_goals_for) return 1;
        return 0;
    });

    const best8Thirds = thirds.slice(0, 8);
    qualifiers.push(...best8Thirds);

    return { qualifiers, thirds, best8Thirds };
}

/**
 * @swagger
 * /qualifiers:
 *   get:
 *     summary: Classificados para o mata-mata (1º, 2º e melhores 3ºs)
 *     responses:
 *       200:
 *         description: Qualificados, terceiros e melhores terceiros
 */
app.get('/qualifiers', async(req, res) => {
    res.json(await getQualifiers());
});

/**
 * @swagger
 * /knockout-matches:
 *   get:
 *     summary: Todas as partidas do mata-mata
 *     responses:
 *       200:
 *         description: Partidas de r32 até a final
 */
app.get('/knockout-matches', async(req, res) => {
    const [rows] = await pool.query(`
        SELECT m.id, m.home_id, m.away_id, m.stage, m.match_number, m.home_score, m.away_score, m.home_xg, m.away_xg,
        m.shootout_home_score, m.shootout_away_score,
        h.name AS home_name, a.name AS away_name
        FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.stage IN ('r32','r16','qf','sf','3rd','final') ORDER BY m.match_number ASC`);

    res.json(rows);
});

/**
 * @swagger
 * /matches/{id}/shootout:
 *   get:
 *     summary: Cobranças de pênaltis de uma partida
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados da disputa de pênaltis (ou null se não houve)
 */
app.get('/matches/:id/shootout', async(req, res) => {
    const matchId = req.params.id;

    const [matchRows] = await pool.query(
        `SELECT m.shootout_home_score, m.shootout_away_score,
        h.name AS home_name, a.name AS away_name
        FROM matches m
        JOIN selections h ON m.home_id = h.id
        JOIN selections a ON m.away_id = a.id
        WHERE m.id = ?`,
        [matchId]
    );

    if(matchRows.length === 0){
        return res.status(404).json({ error: 'partida não encontrada' });
    }

    const match = matchRows[0];

    if(match.shootout_home_score === null){
        return res.json(null);
    }

    const [events] = await pool.query(
        'SELECT team, kick_order, player_name, scored FROM shootout_events WHERE match_id = ? ORDER BY kick_order ASC, team ASC',
        [matchId]
    );

    const eventsA = events
        .filter(e => e.team === 'home')
        .sort((a, b) => a.kick_order - b.kick_order)
        .map(e => ({ player: e.player_name, scored: !!e.scored }));

    const eventsB = events
        .filter(e => e.team === 'away')
        .sort((a, b) => a.kick_order - b.kick_order)
        .map(e => ({ player: e.player_name, scored: !!e.scored }));

    let winner;
    if(match.shootout_home_score > match.shootout_away_score){
        winner = match.home_name;
    }
    else{
        winner = match.away_name;
    }

    res.json({
        winner,
        goalsA: match.shootout_home_score,
        goalsB: match.shootout_away_score,
        eventsA,
        eventsB
    });
});

async function resetGameData(){
    await pool.query('DELETE FROM shootout_events');
    await pool.query('DELETE FROM goal_events');
    await pool.query('DELETE FROM player_match_stats');
    await pool.query('DELETE FROM knockouts');
    await pool.query('DELETE FROM groups_standings');
    await pool.query('DELETE FROM matches');
    await pool.query('ALTER TABLE matches AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE groups_standings AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE player_match_stats AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE goal_events AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE knockouts AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE shootout_events AUTO_INCREMENT = 1');
}

async function createGroupMatches(){
    const [groups] = await pool.query('SELECT * FROM `groups`');
    const roundMap = { '0-1': 1, '2-3': 1, '0-2': 2, '1-3': 2, '0-3': 3, '1-2': 3 };
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

/**
 * @swagger
 * /reset:
 *   post:
 *     summary: Reseta todos os dados do jogo (partidas, stats, knockouts)
 *     responses:
 *       200:
 *         description: Dados resetados
 */
app.post('/reset', simulationLimiter, async(req, res) => {
    await resetGameData();
    res.json({ ok: true });
});

/**
 * @swagger
 * /manual/match:
 *   post:
 *     summary: Inserir resultado manual de partida da fase de grupos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId: { type: integer }
 *               homeScore: { type: integer }
 *               awayScore: { type: integer }
 *     responses:
 *       200:
 *         description: Resultado inserido
 */
app.post('/manual/match', simulationLimiter, async(req, res) => {
    const { matchId, homeScore, awayScore } = req.body;

    if(!Number.isInteger(matchId) || matchId < 1){
        return res.status(400).json({ error: 'matchId inválido' });
    }
    if(!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99){
        return res.status(400).json({ error: 'homeScore deve ser inteiro entre 0 e 99' });
    }
    if(!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99){
        return res.status(400).json({ error: 'awayScore deve ser inteiro entre 0 e 99' });
    }

    const [matchRows] = await pool.query('SELECT * FROM matches WHERE id = ?',
        [matchId]
    );
    if(matchRows.length === 0){
        return res.status(404).json({ error: 'partida não encontrada' });
    }
    const match = matchRows[0];
    if(match.stage !== 'group'){
        return res.status(400).json({ error: 'rota apenas para partidas da fase de grupos' });
    }

    await pool.query('DELETE FROM groups_standings WHERE matches_id = ?', [matchId]);
    await pool.query('UPDATE matches SET home_score = ?, away_score = ? WHERE id = ?',
        [homeScore, awayScore, matchId]
    );

    let pointsA, pointsB, winsA = 0, drawsA = 0, lossesA = 0, winsB = 0, drawsB = 0, lossesB = 0;

    if(homeScore > awayScore){ 
        pointsA = 3; 
        pointsB = 0; 
        winsA = 1; 
        lossesB = 1; 
    }
    else if(homeScore < awayScore){ 
        pointsA = 0; 
        pointsB = 3; 
        lossesA = 1; 
        winsB = 1; 
    }
    else{ 
        pointsA = 1; 
        pointsB = 1; 
        drawsA = 1; 
        drawsB = 1; 
    }

    await pool.query('INSERT INTO groups_standings (group_id, selection_id, matches_id, points, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [match.group_id, match.home_id, matchId, pointsA, winsA, drawsA, lossesA, homeScore, awayScore, homeScore - awayScore]
    );
    await pool.query('INSERT INTO groups_standings (group_id, selection_id, matches_id, points, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [match.group_id, match.away_id, matchId, pointsB, winsB, drawsB, lossesB, awayScore, homeScore, awayScore - homeScore]
    );

    res.json({ ok: true });
});

/**
 * @swagger
 * /manual/knockout:
 *   post:
 *     summary: Inserir resultado manual de partida do mata-mata
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId: { type: integer }
 *               homeScore: { type: integer }
 *               awayScore: { type: integer }
 *               winnerId: { type: integer }
 *     responses:
 *       200:
 *         description: Resultado inserido
 */
app.post('/manual/knockout', simulationLimiter, async(req, res) => {
    const { matchId, homeScore, awayScore, winnerId } = req.body;

    if(!Number.isInteger(matchId) || matchId < 1){
        return res.status(400).json({ error: 'matchId inválido' });
    }
    if(!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99){
        return res.status(400).json({ error: 'homeScore deve ser inteiro entre 0 e 99' });
    }
    if(!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99){
        return res.status(400).json({ error: 'awayScore deve ser inteiro entre 0 e 99' });
    }
    if(!Number.isInteger(winnerId) || winnerId < 1){
        return res.status(400).json({ error: 'winnerId inválido' });
    }

    const [matchRows] = await pool.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if(matchRows.length === 0){
        return res.status(404).json({ error: 'partida não encontrada' });
    }
    const match = matchRows[0];
    if(match.stage === 'group'){
        return res.status(400).json({ error: 'rota apenas para partidas do mata-mata' });
    }
    if(winnerId !== match.home_id && winnerId !== match.away_id){
        return res.status(400).json({ error: 'winnerId deve ser home_id ou away_id da partida' });
    }

    await pool.query('DELETE FROM shootout_events WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM knockouts WHERE match_id = ?', [matchId]);
    await pool.query('UPDATE matches SET home_score = ?, away_score = ?, shootout_home_score = NULL, shootout_away_score = NULL WHERE id = ?', [homeScore, awayScore, matchId]);
    await pool.query('INSERT INTO knockouts (match_id, winner_id) VALUES (?, ?)', [matchId, winnerId]);

    res.json({ ok: true });
});

/**
 * @swagger
 * /simulation:
 *   post:
 *     summary: Inicializa o banco e cria as partidas (modo manual ou real)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [manual, real]
 *     responses:
 *       200:
 *         description: Simulação inicializada
 */
app.post('/simulation', simulationLimiter, async(req, res) => {
    const mode = req.body.mode;
    if(mode === 'manual'){
        await resetGameData();
        await createGroupMatches();
        return res.json({ ok: true });
    }
    if(mode === 'real'){
        await resetGameData();
        await createGroupMatches();

        const starterPlayers = await getStartersFromDB();
        const strength = calculateStrength(starterPlayers);
        res.json({ strength });
    }
});

/**
 * @swagger
 * /simulate/match:
 *   post:
 *     summary: Simula uma partida da fase de grupos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId: { type: integer }
 *     responses:
 *       200:
 *         description: Resultado da partida simulada
 */
app.post('/simulate/match', simulationLimiter, async(req, res) => {
    const { matchId } = req.body;

    const [matchRows] = await pool.query(
        'SELECT m.*, h.name AS home_name, a.name AS away_name FROM matches m JOIN selections h ON m.home_id = h.id JOIN selections a ON m.away_id = a.id WHERE m.id = ?',
        [matchId]
    );
    if(matchRows.length === 0){
        return res.status(404).json({ error: 'partida não encontrada' });
    }
    const match = matchRows[0];
    // guard: se já foi simulada, retorna o resultado salvo sem re-simular
    if(match.home_score !== null){
        return res.status(200).json({ alreadySimulated: true, home_score: match.home_score, away_score: match.away_score });
    }
    const selectionA = match.home_name;
    const selectionB = match.away_name;
    const groupId = match.group_id;
    const idA = match.home_id;
    const idB = match.away_id;

    await pool.query('DELETE FROM goal_events WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM player_match_stats WHERE match_id = ?', [matchId]);
    await pool.query('DELETE FROM groups_standings WHERE matches_id = ?', [matchId]);

    const starterPlayers = await getStartersFromDB();
    const strengths = calculateStrength(starterPlayers);

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

async function stageAlreadyGenerated(stage){
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM matches WHERE stage = ?', [stage]);
    return rows[0].total > 0;
}

async function generateR32(){
    if(await stageAlreadyGenerated('r32')){
        return { alreadyGenerated: true, stage: 'r32' };
    }
    const { qualifiers, best8Thirds } = await getQualifiers();

    const first = {};
    const second = {};

    for(const team of qualifiers){
        if(team.position === 1) first[team.group_name] = team;
        if(team.position === 2) second[team.group_name] = team;
    }

    const firsts = [first['E'], first['I'], first['A'], first['L'], first['D'], first['G'], first['B'], first['K']];
    const assigned = assignThirds(firsts, best8Thirds);

    const matches = [
        { match_number: 73, home: second['A'], away: second['B'] },
        { match_number: 75, home: first['F'],  away: second['C'] },
        { match_number: 76, home: first['C'],  away: second['F'] },
        { match_number: 78, home: second['E'], away: second['I'] },
        { match_number: 83, home: second['K'], away: second['L'] },
        { match_number: 84, home: first['H'],  away: second['J'] },
        { match_number: 86, home: first['J'],  away: second['H'] },
        { match_number: 88, home: second['D'], away: second['G'] },
        { match_number: 74, home: assigned[0].first, away: assigned[0].third },
        { match_number: 77, home: assigned[1].first, away: assigned[1].third },
        { match_number: 79, home: assigned[2].first, away: assigned[2].third },
        { match_number: 80, home: assigned[3].first, away: assigned[3].third },
        { match_number: 81, home: assigned[4].first, away: assigned[4].third },
        { match_number: 82, home: assigned[5].first, away: assigned[5].third },
        { match_number: 85, home: assigned[6].first, away: assigned[6].third },
        { match_number: 87, home: assigned[7].first, away: assigned[7].third },
    ];

    const stage = 'r32';

    for(const match of matches){
        await pool.query(
            'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
            [match.home.id, match.away.id, stage, match.match_number]
        );
    }

    return { matches };
}

/**
 * @swagger
 * /generate-r32:
 *   post:
 *     summary: Gera os confrontos dos 16 avos de final (r32)
 *     responses:
 *       200:
 *         description: Confrontos gerados
 */
app.post('/generate-r32', simulationLimiter, async(req, res) => {
    const result = await generateR32();
    if(result.alreadyGenerated){
        return res.status(409).json({ error: `Fase ${result.stage} já foi gerada` });
    }
    res.json(result);
});

async function generateR16(){
    if(await stageAlreadyGenerated('r16')){
        return { alreadyGenerated: true, stage: 'r16' };
    }
    const matches = [
        { match_number: 89, home: 74, away: 77 },
        { match_number: 90, home: 73, away: 75 },
        { match_number: 91, home: 76, away: 78 },
        { match_number: 92, home: 79, away: 80 },
        { match_number: 93, home: 83, away: 84 },
        { match_number: 94, home: 81, away: 82 },
        { match_number: 95, home: 86, away: 88 },
        { match_number: 96, home: 85, away: 87 },
    ];
    const stage = 'r16';
    for(const match of matches){
        const homeId = await getWinnerByMatchNumber(match.home);
        const awayId = await getWinnerByMatchNumber(match.away);
        await pool.query(
            'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
            [homeId, awayId, stage, match.match_number]
        );
    }
    return { message: `${matches.length} confrontos do r16 gerados` };
}

/**
 * @swagger
 * /generate-r16:
 *   post:
 *     summary: Gera os confrontos das oitavas de final (r16)
 *     responses:
 *       200:
 *         description: Confrontos gerados
 */
app.post('/generate-r16', simulationLimiter, async(req, res) => {
    const result = await generateR16();
    if(result.alreadyGenerated){
        return res.status(409).json({ error: `Fase ${result.stage} já foi gerada` });
    }
    res.json(result);
});

async function generateQF(){
    if(await stageAlreadyGenerated('qf')){
        return { alreadyGenerated: true, stage: 'qf' };
    }
    const matches = [
        { match_number: 97,  home: 89, away: 90 },
        { match_number: 98,  home: 93, away: 95 },
        { match_number: 99,  home: 91, away: 92 },
        { match_number: 100, home: 94, away: 96 },
    ];
    const stage = 'qf';
    for(const match of matches){
        const homeId = await getWinnerByMatchNumber(match.home);
        const awayId = await getWinnerByMatchNumber(match.away);
        await pool.query(
            'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
            [homeId, awayId, stage, match.match_number]
        );
    }
    return { message: `${matches.length} confrontos do qf gerados` };
}

/**
 * @swagger
 * /generate-qf:
 *   post:
 *     summary: Gera os confrontos das quartas de final (qf)
 *     responses:
 *       200:
 *         description: Confrontos gerados
 */
app.post('/generate-qf', simulationLimiter, async(req, res) => {
    const result = await generateQF();
    if(result.alreadyGenerated){
        return res.status(409).json({ error: `Fase ${result.stage} já foi gerada` });
    }
    res.json(result);
});

async function generateSF(){
    if(await stageAlreadyGenerated('sf')){
        return { alreadyGenerated: true, stage: 'sf' };
    }
    const matches = [
        { match_number: 101, home: 97, away: 99 },
        { match_number: 102, home: 98, away: 100 },
    ];
    const stage = 'sf';
    for(const match of matches){
        const homeId = await getWinnerByMatchNumber(match.home);
        const awayId = await getWinnerByMatchNumber(match.away);
        await pool.query(
            'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
            [homeId, awayId, stage, match.match_number]
        );
    }
    return { message: `${matches.length} confrontos do sf gerados` };
}

/**
 * @swagger
 * /generate-sf:
 *   post:
 *     summary: Gera os confrontos das semifinais (sf)
 *     responses:
 *       200:
 *         description: Confrontos gerados
 */
app.post('/generate-sf', simulationLimiter, async(req, res) => {
    const result = await generateSF();
    if(result.alreadyGenerated){
        return res.status(409).json({ error: `Fase ${result.stage} já foi gerada` });
    }
    res.json(result);
});

async function generateFinal(){
    if(await stageAlreadyGenerated('final')){
        return { alreadyGenerated: true, stage: 'final' };
    }
    const loser101 = await getLoserByMatchNumber(101);
    const loser102 = await getLoserByMatchNumber(102);
    await pool.query(
        'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
        [loser101, loser102, '3rd', 103]
    );
    const winner101 = await getWinnerByMatchNumber(101);
    const winner102 = await getWinnerByMatchNumber(102);
    await pool.query(
        'INSERT INTO matches (home_id, away_id, stage, match_number) VALUES (?, ?, ?, ?)',
        [winner101, winner102, 'final', 104]
    );
    return { message: 'jogos 103 (3º lugar) e 104 (final) gerados' };
}

/**
 * @swagger
 * /generate-final:
 *   post:
 *     summary: Gera a final e o jogo do 3º lugar
 *     responses:
 *       200:
 *         description: Partidas 103 e 104 geradas
 */
app.post('/generate-final', simulationLimiter, async(req, res) => {
    const result = await generateFinal();
    if(result.alreadyGenerated){
        return res.status(409).json({ error: `Fase ${result.stage} já foi gerada` });
    }
    res.json(result);
});

/**
 * @swagger
 * /simulate/knockout:
 *   post:
 *     summary: Simula uma partida específica do mata-mata pelo ID
 *     description: Busca a partida no banco, calcula forças das seleções, simula o confronto (com possível prorrogação/pênaltis), registra o vencedor na tabela knockouts e salva estatísticas individuais dos jogadores (gols, assistências, rating, clean sheet e eventos de gol).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId: { type: integer }
 *     responses:
 *       200:
 *         description: Resultado detalhado da partida simulada (placar, xG, artilheiros, assistências, ratings e eventos)
 */
app.post('/simulate/knockout', simulationLimiter, async(req, res) => {
    const { matchId } = req.body;
    const result = await simulateKnockoutMatchById(matchId);
    res.json(result);
});

async function simulateAllKnockouts(stage){
    const [matches] = await pool.query(
        'SELECT * FROM matches WHERE stage = ? AND home_score IS NULL',
        [stage]
    );

    const results = [];
    for(const match of matches){
        const data = await simulateKnockoutMatchById(match.id);
        results.push({ matchId: match.id, ...data });
    }

    return { message: `${matches.length} partidas simuladas!`, results };
}

/**
 * @swagger
 * /simulate/all-knockouts:
 *   post:
 *     summary: Simula todas as partidas pendentes de uma fase do mata-mata
 *     description: Busca no banco todas as partidas do stage informado que ainda não foram jogadas (home_score IS NULL) e dispara a simulação individual de cada uma via /simulate/knockout.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [r32, r16, qf, sf, 3rd, final]
 *     responses:
 *       200:
 *         description: Quantidade de partidas simuladas e array com o resultado de cada uma
 */
app.post('/simulate/all-knockouts', simulationLimiter, async(req, res) => {
    const { stage } = req.body;
    res.json(await simulateAllKnockouts(stage));
});

/**
 * @swagger
 * /simulate-knockout-stage:
 *   post:
 *     summary: Gera e simula todo o mata-mata de ponta a ponta
 *     description: Executa, em sequência, a geração e simulação de todas as fases do mata-mata (r32 → r16 → qf → sf → final + disputa de 3º lugar). Para cada fase chama a rota de geração de chaveamento correspondente e em seguida /simulate/all-knockouts.
 *     responses:
 *       200:
 *         description: Log completo com os dados de geração e simulação de cada fase do mata-mata
 */
app.post('/simulate-knockout-stage', simulationLimiter, async(req, res) => {
    const generators = {
        r32: generateR32,
        r16: generateR16,
        qf:  generateQF,
        sf:  generateSF,
        final: generateFinal,
    };
    const stages = ['r32', 'r16', 'qf', 'sf', 'final'];
    const log = [];

    for(const stage of stages){
        const genData = await generators[stage]();
        log.push({ step: `generate-${stage}`, data: genData });

        const stagesToSimulate = stage === 'final' ? ['3rd', 'final'] : [stage];

        for(const s of stagesToSimulate){
            const simData = await simulateAllKnockouts(s);
            log.push({ step: `simulate-${s}`, data: simData });
        }
    }

    res.json({ message: 'Mata-mata completo simulado!', log });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
    console.error('[ERRO]', req.method, req.originalUrl, '-', err.stack || err);
    if(res.headersSent){
        return next(err);
    }
    res.status(err.status || 500).json({ error: 'Erro interno do servidor' });
});