export type Mark = 'X' | 'O' | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

// Packed 16-bit integer representation of winning lines (bitmasks)
const WIN_MASKS = [0x007, 0x038, 0x1c0, 0x049, 0x092, 0x124, 0x111, 0x054];

// Fast bitwise win checking
export function checkWinner(currentBoard: Mark[]): Mark {
	let xBits = 0;
	let oBits = 0;

	for (let i = 0; i < 9; i++) {
		if (currentBoard[i] === 'X') xBits |= 1 << i;
		else if (currentBoard[i] === 'O') oBits |= 1 << i;
	}

	for (let i = 0; i < 8; i++) {
		const mask = WIN_MASKS[i];
		if ((xBits & mask) === mask) return 'X';
		if ((oBits & mask) === mask) return 'O';
	}
	return null;
}

// Single-pass allocation-free move gathering
export function getAvailableMoves(currentBoard: Mark[]): number[] {
	const moves: number[] = [];
	for (let i = 0; i < 9; i++) {
		if (currentBoard[i] === null) moves.push(i);
	}
	return moves;
}

// Alpha-Beta pruned Minimax returning raw score for minimal object allocation overhead
function minimax(
	currentBoard: Mark[],
	depth: number,
	isMaximizing: boolean,
	aiMark: 'X' | 'O',
	humanMark: 'X' | 'O',
	alpha: number,
	beta: number
): number {
	const winner = checkWinner(currentBoard);
	if (winner === aiMark) return 10 - depth;
	if (winner === humanMark) return depth - 10;

	const moves = getAvailableMoves(currentBoard);
	if (moves.length === 0) return 0;

	if (isMaximizing) {
		let maxEval = -100;
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			currentBoard[move] = aiMark;
			const score = minimax(currentBoard, depth + 1, false, aiMark, humanMark, alpha, beta);
			currentBoard[move] = null;

			if (score > maxEval) maxEval = score;
			if (score > alpha) alpha = score;
			if (beta <= alpha) break; // Alpha-Beta Cutoff
		}
		return maxEval;
	} else {
		let minEval = 100;
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			currentBoard[move] = humanMark;
			const score = minimax(currentBoard, depth + 1, true, aiMark, humanMark, alpha, beta);
			currentBoard[move] = null;

			if (score < minEval) minEval = score;
			if (score < beta) beta = score;
			if (beta <= alpha) break; // Alpha-Beta Cutoff
		}
		return minEval;
	}
}

// Root solver returning the top move
function getBestMove(currentBoard: Mark[], aiMark: 'X' | 'O', humanMark: 'X' | 'O'): number {
	const moves = getAvailableMoves(currentBoard);
	if (moves.length === 0) return -1;

	// Symmetry optimization: If board is empty, picking center or corner is mathematically optimal
	if (moves.length === 9) return 4;

	let bestScore = -Infinity;
	let bestMove = moves[0];

	for (let i = 0; i < moves.length; i++) {
		const move = moves[i];
		currentBoard[move] = aiMark;
		const score = minimax(currentBoard, 0, false, aiMark, humanMark, -100, 100);
		currentBoard[move] = null;

		if (score > bestScore) {
			bestScore = score;
			bestMove = move;
		}
	}

	return bestMove;
}

export function getAIMove(currentBoard: Mark[], aiMark: 'X' | 'O', difficulty: Difficulty): number {
	const moves = getAvailableMoves(currentBoard);
	if (moves.length === 0) return -1;

	const humanMark: 'X' | 'O' = aiMark === 'X' ? 'O' : 'X';

	if (difficulty === 'easy') {
		return moves[(Math.random() * moves.length) | 0];
	}

	if (difficulty === 'medium') {
		// 1. Immediate Win
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			currentBoard[move] = aiMark;
			if (checkWinner(currentBoard) === aiMark) {
				currentBoard[move] = null;
				return move;
			}
			currentBoard[move] = null;
		}

		// 2. Immediate Block
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			currentBoard[move] = humanMark;
			if (checkWinner(currentBoard) === humanMark) {
				currentBoard[move] = null;
				return move;
			}
			currentBoard[move] = null;
		}

		// 3. 50/50 Optimal vs Random
		if (Math.random() > 0.5) {
			return getBestMove(currentBoard, aiMark, humanMark);
		}
		return moves[(Math.random() * moves.length) | 0];
	}

	// Hard mode: Perfect Minimax (Guarantees Tie or Win)
	return getBestMove(currentBoard, aiMark, humanMark);
}
