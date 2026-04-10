const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./seed/selections.json', 'utf-8'));

console.log("-------------------------- Selection Validation --------------------------");

for (const selection of data.selections){
  if (selection.players.length !== 26){
    console.log(`ERRO jogadores: ${selection.name} tem ${selection.players.length} jogadores`);
  }

  const starters = selection.players.filter(player => player.is_starter === true);
  if (starters.length !== 11){
    console.log(`ERRO titulares: ${selection.name} tem ${starters.length} titulares`);
  }

  if (selection.players.length === 26 && starters.length === 11){
    console.log(`OK: ${selection.name}`);
  }
}
const groups = {};

for (const selection of data.selections){
  if (!groups[selection.group]){
    groups[selection.group] = [];
  }

  groups[selection.group].push(selection.name);
}

console.log("-------------------------- Groups --------------------------");

for (const group in groups){
  console.log(`Grupo ${group}: [${groups[group].join(', ')}]`);
}

console.log(`\nTotal de seleções: ${data.selections.length}`);