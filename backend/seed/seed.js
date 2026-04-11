const mysql = require('mysql2/promise');
const fs = require('fs');

// ?? EVITA SQL INJECTION
// IGNORE EH SO SE HOUVER CHANCES DE DUPLICATAS

async function seed(){
    const connection = await mysql.createConnection({host: 'localhost', user: 'root', password: '2516', database: 'wc2026'});
    await connection.execute('SET autocommit = 1');
    const data = JSON.parse(fs.readFileSync('./seed/selections.json', 'utf-8'));

    for(const selection of data.selections){
        // o ? vira 'A', 'B', etc dependendo da seleção
        await connection.execute(
            'INSERT IGNORE INTO `groups` (name) VALUES (?)',
            [selection.group]
        );

        const [rows] = await connection.execute(
            'SELECT id FROM `groups` WHERE name = ?',
            [selection.group]
        );

        const group_id = rows[0].id;

        await connection.execute(
            'INSERT INTO selections (group_id, name, ranking, formation) VALUES (?, ?, ?, ?)',
            [group_id, selection.name, selection.ranking, selection.formation]
        );

        const [selection_rows] = await connection.execute(
            'SELECT id from selections WHERE name = ?',
            [selection.name]
        );

        const selection_id = selection_rows[0].id;

        for(const player of selection.players){
            await connection.execute(
                'INSERT INTO players (selection_id, name, age, position, rating, is_starter) VALUES (?, ?, ?, ?, ?, ?)',
                [selection_id, player.name, player.age, player.position, player.rating, player.is_starter]
            );
        }

        console.log(`✓ ${selection.name} inserida`);
    }
    console.log('Seed concluído!');
    await connection.end();
};

seed();