CREATE DATABASE  wc2026;
USE wc2026;

/* VARCHAR != CHAR:  	
	VARCHAR OCCUPIES ONLY THE NECESSARY E.g: IF VARCHAR(100) IS DEFINED BUT THE NAME ONLY USES 6 CHARACTERS, ONLY 6 BYTES ARE STORED. 
    CHAR OCCUPIES EXACTLY WHAT IS DEFINED E.g: CHAR(1) ALWAYS STORES 1 BYTE, REGARDLESS OF THE CONTENT.
*/

/* WHY HAVE GROUPS AND GROUPS_STANDINDS?
	GROUPS STORES 
	GROUPS_STANDINGS 
*/

CREATE TABLE `groups`(
	id INT AUTO_INCREMENT PRIMARY KEY,
    name CHAR(1) NOT NULL 
);

CREATE TABLE selections(
	id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    ranking INT NOT NULL,
	formation VARCHAR(10) NOT NULL,	
    FOREIGN KEY (group_id) REFERENCES `groups`(id)
);

CREATE TABLE players(
	id INT AUTO_INCREMENT PRIMARY KEY,
	selection_id INT NOT NULL,
	name VARCHAR(100) NOT NULL,
	age INT NOT NULL,
	position ENUM('GK', 'DEF', 'MID', 'FWD') NOT NULL,
	rating INT NOT NULL,
	is_starter BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (selection_id) REFERENCES selections(id)
);

CREATE TABLE matches(
	id INT AUTO_INCREMENT PRIMARY KEY,
	group_id INT NULL,
	home_id INT NOT NULL,
	away_id INT NOT NULL,
	stage ENUM('group', 'r16', 'qf', 'sf', '3rd', 'final') NOT NULL,
	home_score INT DEFAULT 0,
	away_score INT DEFAULT 0,
	home_xg FLOAT DEFAULT 0,
	away_xg FLOAT DEFAULT 0,
	FOREIGN KEY (group_id) REFERENCES `groups`(id),
	FOREIGN KEY (home_id) REFERENCES selections(id),
	FOREIGN KEY (away_id) REFERENCES selections(id)
);

CREATE TABLE groups_standings(
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
	FOREIGN KEY (group_id) REFERENCES `groups`(id),
	FOREIGN KEY (selection_id) REFERENCES selections(id),
	FOREIGN KEY (matches_id) REFERENCES matches(id)
);

CREATE TABLE player_match_stats(
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
);

CREATE TABLE KNOCKOUTS(
	id INT AUTO_INCREMENT PRIMARY KEY,
	match_id INT NOT NULL,
	winner_id INT NOT NULL,
	FOREIGN KEY (match_id) REFERENCES matches(id),
	FOREIGN KEY (winner_id) REFERENCES selections(id)
);

CREATE TABLE goal_events(
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    minute INT NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);