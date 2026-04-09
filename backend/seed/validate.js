const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./seed/selections.json', 'utf-8'));

for (const selection of data.selections){
  if (selection.players.length !== 26){
    console.log(`ERRO: ${selection.name} tem ${selection.players.length} jogadores`);
  } 
  else {
    console.log(`OK: ${selection.name}`);
  }
}