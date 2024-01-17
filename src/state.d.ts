import { Vertex } from "@sabaki/go-board";

export interface State
{
	games: Game[];
	currentGame: number;
	currentMove: number;
	mistakeIndicator: Vertex | null;
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
	coord: Vertex;
	player: 1 | -1;
	elo: number;
}