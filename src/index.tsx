import React from "react";
import { createRoot } from "react-dom/client";
import GoBoard, { Vertex } from "@sabaki/go-board";
import { parse } from "@sabaki/sgf";
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
						player: 1,
						coord: [15, 3],
						elo: 0,
					},
					{
						player: -1,
						coord: [3, 3],
						elo: 0,
					},
					{
						player: 1,
						coord: [15, 15],
						elo: 0,
					},
					{
						player: -1,
						coord: [3, 15],
						elo: 0,
					},
					{
						player: 1,
						coord: [2, 2],
						elo: 0,
					},
					{
						player: -1,
						coord: [3, 2],
						elo: 0,
					},
				],
				finalMove: 4,
			},
			{
				label: "Example game 2",
				width: 9,
				height: 9,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 3",
				width: 13,
				height: 13,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 4",
				width: 14,
				height: 14,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 5",
				width: 19,
				height: 9,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 6",
				width: 37,
				height: 37,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 7",
				width: 19,
				height: 13,
				moves: [],
				finalMove: 0,
			},
			{
				label: "Example game 8",
				width: 20,
				height: 19,
				moves: [],
				finalMove: 0,
			},
		],
		currentGame: 0,
		currentMove: 0,
		mistakeIndicator: null,
		labelFormat: "{PB} {BR} vs. {PW} {WR} {EV}",
	});

	const game = currentGame(state);

	let playerElo = 0;
	let averageProb = 0;
	let perfectProb = 1;
	if (game !== null)
	{
		for (let i = 0; i < game.finalMove; i++)
		{
			const move = game.moves[i];
			playerElo -= move.elo;
		}
		for (let i = 0; i < game.finalMove; i++)
		{
			const move = game.moves[i];
			const expectedPlayerScore = expectedScore(playerElo, move.elo);
			averageProb += expectedPlayerScore;
			perfectProb *= expectedPlayerScore;
		}
		averageProb /= game.finalMove;
		console.log(playerElo, averageProb, perfectProb);
		console.log(game.moves.map(x => x.elo));
	}

	const progress = Math.max(perfectProb > 0.9 ? 1 : averageProb * 2 - 1, 0);

	let board = GoBoard.fromDimensions(game?.width ?? 19, game?.height ?? 19);
	if (game !== null)
	{
		for (let i = 0; i < state.currentMove; i++)
		{
			const move = game.moves[i];
			board = board.makeMove(move.player, move.coord);
		}
	}

	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	React.useEffect(() =>
	{
		drawBoard();
	}, [state]);

	React.useEffect(() =>
	{
		window.addEventListener("resize", drawBoard);
		return () => window.removeEventListener("resize", drawBoard);
	}, [state]);

	function drawBoard()
	{
		if (canvasRef.current === null || game === null)
			return;

		const w = canvasRef.current.width = canvasRef.current.clientWidth;
		const h = canvasRef.current.height = canvasRef.current.clientHeight;

		const ctx = canvasRef.current.getContext("2d")!;

		ctx.fillStyle = "#0000";
		ctx.fillRect(0, 0, w, h);

		const { x, y, stoneSize, boardWidth, boardHeight } = getBoardOffset(w, h, game);

		ctx.translate(x, y);

		ctx.fillStyle = "#e0b56a";
		ctx.fillRect(0, 0, boardWidth, boardHeight);

		ctx.strokeStyle = "#000";
		for (let x = 0; x < game.width; x++)
		{
			ctx.beginPath();
			ctx.moveTo((x + 1) * stoneSize - 0.5, stoneSize - 1);
			ctx.lineTo((x + 1) * stoneSize - 0.5, game.height * stoneSize);
			ctx.stroke();
		}

		for (let y = 0; y < game.height; y++)
		{
			ctx.beginPath();
			ctx.moveTo(stoneSize - 1, (y + 1) * stoneSize - 0.5);
			ctx.lineTo(game.width * stoneSize, (y + 1) * stoneSize - 0.5);
			ctx.stroke();
		}

		ctx.fillStyle = "#000";
		if (game.width % 2 === 1 && game.height % 2 === 1)
		{
			ctx.beginPath();
			ctx.ellipse((game.width * 0.5 + 0.5) * stoneSize - 0.5, (game.height * 0.5 + 0.5) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		if (game.width >= 13 && game.height >= 13)
		{
			ctx.beginPath();
			ctx.ellipse(4 * stoneSize - 0.5, 4 * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.ellipse((game.width - 3) * stoneSize - 0.5, 4 * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.ellipse(4 * stoneSize - 0.5, (game.height - 3) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.ellipse((game.width - 3) * stoneSize - 0.5, (game.height - 3) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
			ctx.fill();

			if (game.width % 2 === 1)
			{
				ctx.beginPath();
				ctx.ellipse((game.width * 0.5 + 0.5) * stoneSize - 0.5, 4 * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
				ctx.fill();

				ctx.beginPath();
				ctx.ellipse((game.width * 0.5 + 0.5) * stoneSize - 0.5, (game.height - 3) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
				ctx.fill();
			}

			if (game.height % 2 === 1)
			{
				ctx.beginPath();
				ctx.ellipse(4 * stoneSize - 0.5, (game.height * 0.5 + 0.5) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
				ctx.fill();

				ctx.beginPath();
				ctx.ellipse((game.width - 3) * stoneSize - 0.5, (game.height * 0.5 + 0.5) * stoneSize - 0.5, 3, 3, 0, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		for (let x = 0; x < game.width; x++)
		{
			for (let y = 0; y < game.height; y++)
			{
				const s = board.get([x, y]);
				if (s === 0)
					continue;

				ctx.fillStyle = s === 1 ? "#000" : "#fff";
				ctx.beginPath();
				ctx.ellipse((x + 1) * stoneSize - 0.5, (y + 1) * stoneSize - 0.5, stoneSize * 0.5 - 0.5, stoneSize * 0.5 - 0.5, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
			}
		}

		if (state.currentMove > 0)
		{
			const move = game.moves[state.currentMove - 1];
			ctx.strokeStyle = move.player === 1 ? "#fff" : "#000";
			ctx.lineWidth = stoneSize * 0.075;
			ctx.beginPath();
			ctx.ellipse((move.coord[0] + 1) * stoneSize - 0.5, (move.coord[1] + 1) * stoneSize - 0.5, stoneSize * 0.3 - 0.5, stoneSize * 0.3 - 0.5, 0, 0, Math.PI * 2);
			ctx.stroke();
		}

		if (state.mistakeIndicator !== null)
		{
			const [x, y] = state.mistakeIndicator.map(x => (x + 1) * stoneSize - 0.5);
			ctx.strokeStyle = "#c00";
			ctx.lineWidth = stoneSize * 0.1;
			ctx.beginPath();
			ctx.moveTo(x - stoneSize * 0.2, y - stoneSize * 0.2);
			ctx.lineTo(x + stoneSize * 0.2, y + stoneSize * 0.2);
			ctx.moveTo(x + stoneSize * 0.2, y - stoneSize * 0.2);
			ctx.lineTo(x - stoneSize * 0.2, y + stoneSize * 0.2);
			ctx.stroke();
		}
	}

	function boardClick(e: React.MouseEvent<HTMLCanvasElement>)
	{
		if (canvasRef.current === null || game === null || state.currentMove >= game.finalMove)
			return;

		const { x, y, stoneSize } = getBoardOffset(canvasRef.current.width, canvasRef.current.height, game);
		const coord = [e.nativeEvent.offsetX - x, e.nativeEvent.offsetY - y].map(x => Math.floor((x + 0.5) / stoneSize - 0.5)) as Vertex;

		if (board.has(coord) && board.get(coord) === 0 && !(coord[0] === state.mistakeIndicator?.[0] && coord[1] === state.mistakeIndicator?.[1]))
		{
			const move = game.moves[state.currentMove];
			if (coord[0] === move.coord[0] && coord[1] === move.coord[1])
				setState(goToMove(updateElo(state, playerElo, 1), state.currentMove + 1));
			else
				setState({ ...updateElo(state, playerElo, 0), mistakeIndicator: coord });
		}
	}

	function getBoardOffset(w: number, h: number, game: Game):
		{ x: number, y: number, stoneSize: number, boardWidth: number, boardHeight: number }
	{
		// Round down to nearest odd number
		const stoneSize = Math.round(Math.min(w / (game.width + 1), h / (game.height + 1)) * 0.5) * 2 - 1;
		const boardWidth = stoneSize * (game.width + 1) - 1;
		const boardHeight = stoneSize * (game.height + 1) - 1;
		const x = Math.floor((w - boardWidth) * 0.5);
		const y = Math.floor((h - boardHeight) * 0.5);
		return { x, y, stoneSize, boardWidth, boardHeight };
	}

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
			<input type="file" id="uploadFile" accept=".sgf"
				onChange={async e => setState(addGame(state, await e.target.files?.[0]?.text() ?? ""))} />
			<label htmlFor="uploadFile" className="button">Upload File</label>
			<input type="text" placeholder="Paste SGF or URL here" value=""
				onChange={async e => setState(addGame(state, /^https?:/.test(e.target.value) ? await (await fetch(e.target.value)).text() : e.target.value))} />
			<div id="labelFormatRow">
				<label htmlFor="labelFormat">Label format: </label>
				<input type="text" id="labelFormat" value={state.labelFormat}
					onChange={e => setState({ ...state, labelFormat: e.target.value })} />
			</div>
		</div>
		<canvas id="board" ref={canvasRef} onClick={boardClick} />
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
			<button onClick={() => setState(setAsFinalMove(state))}>Stop memorizing here</button>
			<div id="progressLabel">{Math.floor(progress * 100) + "%"}</div>
			<div id="progress"><div className={progress >= 1 ? "complete" : ""} style={{ clipPath: `polygon(0% 0%, ${progress * 100}% 0%, ${progress * 100}% 100%, 0% 100%)` }}></div></div>
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
	newState.mistakeIndicator = null;
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

function setAsFinalMove(state: State): State
{
	const newState = copy(state);
	const game = currentGame(newState);

	if (game === null)
		return state;

	game.finalMove = newState.currentMove;
	return newState;
}

function addGame(state: State, sgf: string): State
{
	try
	{
		const newState = copy(state);
		const gameNode = parse(sgf)[0];

		const size = gameNode.data.SZ?.[0] ?? "19";
		const [width, height] = (size.includes(":") ? size.split(":") : [size, size]).map(x => parseInt(x));

		const game: Game =
		{
			label: state.labelFormat
				.replace(/\{(\w+)\}/g, (_, key) => gameNode.data[key]?.[0] ?? "")
				.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, ""),
			width,
			height,
			moves: [],
			finalMove: 0,
		};

		for (let moveNode = gameNode.children[0]; moveNode; moveNode = moveNode.children[0])
		{
			if (moveNode.data.B?.[0])
			{
				game.moves.push(
				{
					player: 1,
					coord: toVertex(moveNode.data.B[0]),
					elo: 0,
				});
			}
			else if (moveNode.data.W?.[0])
			{
				game.moves.push(
				{
					player: -1,
					coord: toVertex(moveNode.data.W[0]),
					elo: 0,
				});
			}
		}

		game.finalMove = game.moves.length;

		newState.games.push(game);
		return setCurrentGame(newState, newState.games.length - 1);
	}
	catch (e)
	{
		console.error(e);
		return state;
	}

	function toVertex(coord: string): Vertex
	{
		return [...coord.toLowerCase()].map(c => c.charCodeAt(0) - "a".charCodeAt(0)) as Vertex;
	}
}

function updateElo(state: State, playerElo: number, playerScore: 0 | 1): State
{
	const newState = copy(state);
	const game = currentGame(newState);

	if (game === null)
		return state;

	const move = game.moves[newState.currentMove];

	const expectedPlayerScore = expectedScore(playerElo, move.elo);
	move.elo -= eloIncrement(playerScore, expectedPlayerScore, 1);

	return newState;
}

function expectedScore(elo: number, opponentElo: number): number
{
	return 1 / (1 + Math.pow(10, (opponentElo - elo)));
}

function eloIncrement(score: number, expectedScore: number, k: number): number
{
	return k * (score - expectedScore);
}