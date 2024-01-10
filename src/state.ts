export interface State
{
	games: Game[];
	currentGame: number;
	currentMove: number;
	labelFormat: string;
}

export interface Game
{
	label: string;
	width: number;
	height: number;
	moves: Move[];
	finalMove: number;
}

export interface Move
{
	coord: string;
	player: "B" | "W";
	elo: number;
}