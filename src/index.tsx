import React from "react";
import { createRoot } from "react-dom/client";
import createPersistedState from "use-persisted-state";
import GoBoard, { Vertex } from "@sabaki/go-board";
import { parse } from "@sabaki/sgf";
import DangerButton from "./danger-button";
import FriendlyInput from "./friendly-input";
import { State, Game, Move } from "./state";

const usePersistedState = createPersistedState<State>("ankifu-data");
const root = createRoot(document.getElementById("app")!);
root.render(<App />);

function App()
{
	const [state, setState] = usePersistedState(defaultState);
	const game = currentGame(state);

	let sumProb = 0;
	let perfectProb = 1;
	if (game !== null)
	{
		for (let i = 0; i < game.finalMove; i++)
		{
			const move = game.moves[i];
			const correctProb = correctProbability(move.rating);
			sumProb += correctProb;
			perfectProb *= correctProb;
		}
	}

	const progress = Math.max(perfectProb > 0.9 ? 1 : sumProb / (game?.finalMove ?? 1) * 2 - 1, 0);

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
	const stoneSoundRef = React.useRef<HTMLAudioElement>(null);

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

		ctx.fillStyle = "#e6ba73";
		ctx.fillRect(0, 0, boardWidth, boardHeight);

		var gradient = ctx.createLinearGradient(0, 0, boardWidth, 0);
		for (let x = 0; x < boardWidth; x += 2)
		{
			gradient.addColorStop(x / boardWidth, `#dfad67${Math.floor(Math.pow(1.618, x % 67) % 1 * 256).toString(16).padStart(2, "0")}`);
		}
		ctx.fillStyle = gradient;
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

				const [cx, cy] = pos(x, y);
				const shadow = ctx.createRadialGradient(cx, cy, stoneSize * 0.5, cx, cy, stoneSize * 0.6);
				shadow.addColorStop(0, s === 1 ? "#0006" : "#0003");
				shadow.addColorStop(0.4, s === 1 ? "#0002" : "#0001");
				shadow.addColorStop(1, "#0000");
				ctx.fillStyle = shadow;
				ctx.beginPath();
				ctx.ellipse(cx, cy, stoneSize, stoneSize, 0, 0, Math.PI * 2);
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

				const [cx, cy] = pos(x, y);
				const gradient = ctx.createRadialGradient(cx - stoneSize * 0.15, cy - stoneSize * 0.15, 0, cx - stoneSize * 0.15, cy - stoneSize * 0.15, stoneSize * 0.75);
				gradient.addColorStop(0, s === 1 ? "#444" : "#fff");
				gradient.addColorStop(1, s === 1 ? "#000" : "#aaa");
				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.ellipse(cx, cy, stoneSize * 0.5 - 0.5, stoneSize * 0.5 - 0.5, 0, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		if (state.currentMove > 0)
		{
			const move = game.moves[state.currentMove - 1];
			const [cx, cy] = pos(...move.coord);
			ctx.strokeStyle = move.player === 1 ? "#eee" : "#111";
			ctx.lineWidth = stoneSize * 0.075;
			ctx.beginPath();
			ctx.ellipse(cx, cy, stoneSize * 0.275, stoneSize * 0.275, 0, 0, Math.PI * 2);
			ctx.stroke();
		}

		if (state.mode === "learn" && state.currentMove < game.moves.length)
		{
			const move = game.moves[state.currentMove];
			const [cx, cy] = pos(...move.coord);
			ctx.fillStyle = move.player === 1 ? "#0007" : "#fff7";
			ctx.beginPath();
			ctx.ellipse(cx, cy, stoneSize * 0.25, stoneSize * 0.25, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		function pos(x: number, y: number): [number, number]
		{
			return [(x + 1) * stoneSize - 0.5, (y + 1) * stoneSize - 0.5];
		}
	}

	function boardClick(e: React.MouseEvent<HTMLCanvasElement>)
	{
		if (canvasRef.current === null || game === null || state.currentMove >= game.moves.length)
			return;

		const { x, y, stoneSize } = getBoardOffset(canvasRef.current.width, canvasRef.current.height, game);
		const coord = [e.nativeEvent.offsetX - x, e.nativeEvent.offsetY - y].map(x => Math.floor((x + 0.5) / stoneSize - 0.5)) as Vertex;

		if (board.has(coord) && board.get(coord) === 0)
		{
			const move = game.moves[state.currentMove];
			const correctMove = coord[0] === move.coord[0] && coord[1] === move.coord[1];
			if (state.mode === "test")
			{
				if (correctMove)
				{
					stoneSoundRef.current?.play();
					setState(goToMove(updateRating(state, 1), state.currentMove + 1, "test"));
				}
				else
				{
					setState({ ...updateRating(state, -1), mode: "learn" });
				}
			}
			else
			{
				if (correctMove)
				{
					stoneSoundRef.current?.play();
					setState(goToMove(state, state.currentMove + 1, "test"));
				}
			}
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

	React.useEffect(() =>
	{
		window.addEventListener("keydown", onKeyDown, { passive: true });
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	function onKeyDown(e: KeyboardEvent)
	{
		if (e.target !== document.body)
			return;

		switch (e.code)
		{
			case "Space":
				testMe();
				break;
			case "Home":
				goToFirst();
				break;
			case "ArrowLeft":
				goToPrevious();
				break;
			case "ArrowRight":
				goToNext();
				break;
			case "End":
				goToLast();
				break;
		}
	}

	function testMe()
	{
		setState(randomMove(state, sumProb));
	}

	function goToFirst()
	{
		setState(goToMove(state, 0, "test"));
	}

	function goToPrevious()
	{
		setState(goToMove(state, state.currentMove - 1, "learn"));
	}

	function goToNext()
	{
		setState(goToMove(state, state.currentMove + 1, "learn"));
	}

	function goToLast()
	{
		setState(goToMove(state, lastMove(state), "learn"));
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
			<input type="file" id="importFile" accept=".sgf"
				onChange={async e => setState(await importGame(state, e.target.files?.[0]))} />
			<label htmlFor="importFile" className="button">Import file</label>
			<input type="text" placeholder="Paste SGF or URL here" value=""
				onChange={async e => setState(await importGame(state, e.target.value))} />
			<div id="labelFormatRow">
				<label htmlFor="labelFormat">Label format: </label>
				<input type="text" id="labelFormat" value={state.labelFormat}
					onChange={e => setState({ ...state, labelFormat: e.target.value })} />
			</div>
		</div>
		<canvas id="board" ref={canvasRef} onClick={boardClick} />
		<audio ref={stoneSoundRef} src="stone.wav" />
		<div id="gamePanel" className={game === null ? "hidden" : ""}>
			<a id="help" href="https://github.com/kendfrey/ankifu#game-library" target="_blank" className="button material-symbols-outlined">help</a>
			<button onClick={testMe} className="large">Test me</button>
			<textarea value={currentNotes(state).notes} disabled={state.mode === "test"} placeholder="Notes" className="large"
				onChange={e => setState(setNotes(state, e.target.value))} />
			<div id="moveNavigationRow">
				<button onClick={goToFirst} className="material-symbols-outlined">first_page</button>
				<button onClick={goToPrevious} className="material-symbols-outlined">navigate_before</button>
				<FriendlyInput type="text" value={state.mode === "learn" ? state.currentMove.toString() : ""}
					onChange={e => { const move = parseInt(e.target.value); if (isFinite(move)) setState(goToMove(state, move, "learn")); }} />
				<button onClick={goToNext} className="material-symbols-outlined">navigate_next</button>
				<button onClick={goToLast} className="material-symbols-outlined">last_page</button>
			</div>
			<button onClick={() => setState(setAsFinalMove(state))}>Stop memorizing here</button>
			<div id="progressLabel">{Math.floor(progress * 100) + "%"}</div>
			<div id="progress"><div className={progress >= 1 ? "complete" : ""} style={{ clipPath: `polygon(0% 0%, ${progress * 100}% 0%, ${progress * 100}% 100%, 0% 100%)` }}></div></div>
			<input type="text" value={game?.label ?? ""}
				onChange={e => setState(renameCurrentGame(state, e.target.value))} />
			<div id="gameMenuRow">
				<DangerButton onClick={() => setState(resetProgress(state))}>Reset progress</DangerButton>
				<DangerButton onClick={() => setState(deleteCurrentGame(state))}>Delete</DangerButton>
			</div>
		</div>
	</div>;
}

function copy<T>(obj: T): T
{
	return JSON.parse(JSON.stringify(obj));
}

function defaultState(): State
{
	let state: State =
	{
		games: [],
		currentGame: -1,
		currentMove: 0,
		mode: "learn",
		labelFormat: "{PB} {BR} vs. {PW} {WR} {EV}",
	};

	state = addGame(state, "(;FF[4]GM[1]SZ[9];B[fd];W[df];B[ef];W[eg];B[fg];W[dg];B[dc];W[fh];B[ce];W[fc];B[gc];W[ff];B[bg];W[gd];B[fe];W[gg];B[ec];W[ge];B[fb];W[de];B[dd];W[bh];B[bf];W[hc];B[hb];W[ah];B[hd];W[he];B[ic];W[ie];B[ag];W[cf];B[be];W[cg];B[ee];W[id];B[hc];W[];B[])");
	state.games[0].label = "Example game";
	state.currentGame = -1;
	return state;
}

function currentGame(state: State): Game | null
{
	return state.games[state.currentGame] || null;
}

function setCurrentGame(state: State, i: number): State
{
	const newState = copy(state);
	newState.currentGame = i;
	newState.currentMove = currentGame(newState)?.finalMove ?? 0;
	newState.mode = "learn";
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

function resetProgress(state: State): State
{
	const newState = copy(state);
	const game = currentGame(newState);
	if (game === null)
		return state;

	for (const move of game.moves)
		move.rating = 0;

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

function currentNotes(state: State): { notes: string }
{
	const game = currentGame(state);

	if (game === null || state.mode === "test")
		return { notes: "" };

	if (state.currentMove === 0)
		return game;

	return game.moves[state.currentMove - 1];
}

function setNotes(state: State, notes: string): State
{
	const newState = copy(state);
	currentNotes(newState).notes = notes;
	return newState;
}

function randomMove(state: State, sumProb: number): State
{
	const game = currentGame(state);

	if (game === null)
		return state;

	let prob = Math.random() * (game.finalMove - sumProb);
	for (let i = 0; i < game.finalMove; i++)
	{
		prob -= correctProbability(-game.moves[i].rating);
		if (prob <= 0)
			return goToMove(state, i, "test");
	}

	return goToMove(state, 0, "test");
}

function goToMove(state: State, move: number, mode: "learn" | "test"): State
{
	const newState = copy(state);

	const game = currentGame(newState);
	move = Math.max(Math.min(move, game?.moves.length ?? 0), 0);

	if (game === null)
		return state;

	newState.currentMove = move;

	if (move >= game.finalMove)
		mode = "learn";

	newState.mode = mode;
	
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

async function importGame(state: State, source: string | Blob | undefined): Promise<State>
{
	try
	{
		if (!source)
			return state;

		let sgf: string;
		if (typeof source === "string")
		{
			if (/^https?:/.test(source))
			{
				const response = await fetch(source);
				if (!response.ok)
					throw new Error(response.status + " " + response.statusText);

				sgf = await response.text();
			}
			else
			{
				sgf = source;
			}
		}
		else
		{
			sgf = await source.text();
		}

		return addGame(state, sgf);
	}
	catch (e)
	{
		alert(e + "\nAre you sure this is a valid SGF game record?");
		console.error(e);
		return state;
	}
}

function addGame(state: State, sgf: string): State
{
	const newState = copy(state);
	const gameNode = parse(sgf)[0];

	if (gameNode.children.length === 0)
		throw new Error("No moves found");

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
		notes: "",
	};

	if (gameNode.data.AB)
	{
		for (const coord of gameNode.data.AB)
		{
			game.moves.push(move(1, coord));
		}
	}
	if (gameNode.data.AW)
	{
		for (const coord of gameNode.data.AW)
		{
			game.moves.push(move(-1, coord));
		}
	}

	for (let moveNode = gameNode.children[0]; moveNode; moveNode = moveNode.children[0])
	{
		if (moveNode.data.B?.[0])
		{
			game.moves.push(move(1, moveNode.data.B[0]));
		}
		else if (moveNode.data.W?.[0])
		{
			game.moves.push(move(-1, moveNode.data.W[0]));
		}
	}

	game.finalMove = game.moves.length;

	newState.games.unshift(game);
	return setCurrentGame(newState, 0);

	function move(player: 1 | -1, coord: string): Move
	{
		return { player, coord: toVertex(coord), rating: 0, notes: "" };
	}

	function toVertex(coord: string): Vertex
	{
		return [...coord.toLowerCase()].map(c => c.charCodeAt(0) - "a".charCodeAt(0)) as Vertex;
	}
}

function updateRating(state: State, sign: -1 | 1): State
{
	const newState = copy(state);
	const game = currentGame(newState);

	if (game === null)
		return state;

	const move = game.moves[newState.currentMove];
	move.rating = softplus(move.rating * sign) * sign;
	return newState;
}

function correctProbability(rating: number): number
{
	return 1 / (1 + Math.pow(10, -rating));
}

function softplus(x: number): number
{
	return Math.log(1 + Math.exp(x + 1));
}