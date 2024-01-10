import React from "react";
import { createRoot } from "react-dom/client";
import DangerButton from "./danger-button";
import FriendlyInput from "./friendly-input";
import { State, Game } from "./state";

const root = createRoot(document.getElementById("app")!);
root.render(<App />);

function App()
{
	const [state, setState] = React.useState<State>(
	{
		games:
		[
			{
				label: "Example game 1",
				width: 19,
				height: 19,
				moves:
				[
					{
						player: "B",
						coord: "dq",
						elo: 0,
					},
					{
						player: "W",
						coord: "dd",
						elo: 0,
					},
					{
						player: "B",
						coord: "pp",
						elo: 0,
					},
					{
						player: "W",
						coord: "pd",
						elo: 0,
					},
					{
						player: "B",
						coord: "dp",
						elo: 0,
					},
				],
				finalMove: 4,
			},
			{
				label: "Example game 2",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 3",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 4",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 5",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 6",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 7",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 8",
				width: 19,
				height: 19,
				moves: [],
				finalMove: 0,
			},
		],
		currentGame: -1,
		currentMove: 0,
		labelFormat: "{PB} {BR} vs. {PW} {WR} {EV}",
	});

	const game = currentGame(state);

	return <div id="main">
		<div id="menuPanel">
			<div id="gameList">
				{state.games.map((game, i) =>
					<button key={i} title={game.label} className={state.currentGame === i ? "selected" : ""}
						onClick={() => setState(setCurrentGame(state, i))}>
						{game.label}
					</button>
				)}
			</div>
			<input type="file" id="uploadFile" />
			<label htmlFor="uploadFile" className="button">Upload File</label>
			<input type="text" placeholder="Paste SGF here" value="" />
			<div id="labelFormatRow">
				<label htmlFor="labelFormat">Label format: </label>
				<input type="text" id="labelFormat" value={state.labelFormat}
					onChange={e => setState({ ...state, labelFormat: e.target.value })} />
			</div>
		</div>
		<canvas id="canvas" />
		<div id="gamePanel" className={game === null ? "hidden" : ""}>
			<a id="help" href="https://example.com" target="_blank" className="button">?</a>
			<div id="moveNavigationRow">
				<button onClick={() => setState(goToMove(state, 0))}>⏮</button>
				<button onClick={() => setState(goToMove(state, state.currentMove - 1))}>⏴</button>
				<FriendlyInput type="text" value={state.currentMove}
					onChange={e => { const move = parseInt(e.target.value); if (isFinite(move)) setState(goToMove(state, move)); }} />
				<button onClick={() => setState(goToMove(state, state.currentMove + 1))}>⏵</button>
				<button onClick={() => setState(goToMove(state, lastMove(state)))}>⏭</button>
			</div>
			<button>Stop memorizing here</button>
			<input type="text" value={game?.label ?? ""}
				onChange={e => setState(renameCurrentGame(state, e.target.value))} />
			<div id="gameMenuRow">
				<DangerButton>Reset progress</DangerButton>
				<DangerButton onClick={() => setState(deleteCurrentGame(state))}>Delete</DangerButton>
			</div>
		</div>
	</div>;
}

function copy<T>(obj: T): T
{
	return JSON.parse(JSON.stringify(obj));
}

function currentGame(state: State): Game | null
{
	return state.games[state.currentGame] || null;
}

function setCurrentGame(state: State, i: number): State
{
	const newState = copy(state);
	if (i === newState.currentGame)
		return state;

	newState.currentGame = i;
	newState.currentMove = currentGame(newState)?.finalMove ?? 0;
	return newState;
}

function renameCurrentGame(state: State, label: string): State
{
	const newState = copy(state);
	const game = currentGame(newState);
	if (game === null || label === game.label)
		return state;

	game.label = label;
	return newState;
}

function deleteCurrentGame(state: State): State
{
	const newState = copy(state);
	if (currentGame(newState) === null)
		return state;

	newState.games.splice(newState.currentGame, 1);
	newState.currentGame = -1;
	newState.currentMove = 0;
	return newState;
}

function goToMove(state: State, move: number): State
{
	const newState = copy(state);
	move = Math.max(Math.min(move, currentGame(newState)?.moves.length ?? 0), 0);

	if (move === newState.currentMove)
		return state;

	newState.currentMove = move;
	return newState;
}

function lastMove(state: State): number
{
	const game = currentGame(state);

	if (game === null)
		return 0;

	if (state.currentMove < game.finalMove)
		return game.finalMove;

	return game.moves.length;
}