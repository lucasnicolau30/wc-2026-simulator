const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const { calculateStrength, calculateWinProbability } = require('./simulation-logic');

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

app.post('/simulation', async(req, res) => {
    const mode = req.body.mode;
    if(mode == 'real'){
        const strength = await calculateStrength();
        res.json({ strength });
    }
});

