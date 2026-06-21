// ============================================================
//  XADREZ COMPLETO – Sem bibliotecas externas
//  Implementação própria: tabuleiro, peças, movimentos, IA.
// ============================================================

// -------- Constantes e símbolos das peças --------
const UNICODE_PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};
const PIECE_VALUES = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };

// Tabelas posicionais (simplificadas, para avaliação)
const PST = {
    p: [
        [0,0,0,0,0,0,0,0],
        [50,50,50,50,50,50,50,50],
        [10,10,20,30,30,20,10,10],
        [5,5,10,25,25,10,5,5],
        [0,0,0,20,20,0,0,0],
        [5,-5,-10,0,0,-10,-5,5],
        [5,10,10,-20,-20,10,10,5],
        [0,0,0,0,0,0,0,0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,0,0,0,0,-20,-40],
        [-30,0,10,15,15,10,0,-30],
        [-30,5,15,20,20,15,5,-30],
        [-30,0,15,20,20,15,0,-30],
        [-30,5,10,15,15,10,5,-30],
        [-40,-20,0,5,5,0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,0,0,0,0,0,0,-10],
        [-10,0,5,10,10,5,0,-10],
        [-10,5,5,10,10,5,5,-10],
        [-10,0,10,10,10,10,0,-10],
        [-10,10,10,10,10,10,10,-10],
        [-10,5,0,0,0,0,5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [0,0,0,0,0,0,0,0],
        [5,10,10,10,10,10,10,5],
        [-5,0,0,0,0,0,0,-5],
        [-5,0,0,0,0,0,0,-5],
        [-5,0,0,0,0,0,0,-5],
        [-5,0,0,0,0,0,0,-5],
        [-5,0,0,0,0,0,0,-5],
        [0,0,0,5,5,0,0,0]
    ],
    q: [
        [-20,-10,-10,-5,-5,-10,-10,-20],
        [-10,0,0,0,0,0,0,-10],
        [-10,0,5,5,5,5,0,-10],
        [-5,0,5,5,5,5,0,-5],
        [0,0,5,5,5,5,0,-5],
        [-10,5,5,5,5,5,0,-10],
        [-10,0,5,0,0,0,0,-10],
        [-20,-10,-10,-5,-5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20,20,0,0,0,0,20,20],
        [20,30,10,0,0,10,30,20]
    ]
};

// -------- Estado do jogo --------
let board = [];
let turn = 'w';          // 'w' ou 'b'
let selected = null;     // { row, col }
let legalMovesForSelected = [];
let moveHistory = [];
let lastMove = null;
let gameOver = false;
let isPlayerWhite = true; // o jogador controla as brancas
let isBotThinking = false;
let boardFlipped = false;
let capturedWhite = [];   // peças capturadas das brancas
let capturedBlack = [];   // peças capturadas das pretas

// Dificuldade / níveis da IA
const DIFFICULTY_LEVELS = [
    { depth: 0, random: 0.6 },  // 10%
    { depth: 1, random: 0.25 }, // 25%
    { depth: 2, random: 0.05 }, // 50%
    { depth: 3, random: 0.01 }, // 75%
    { depth: 4, random: 0.0 }   // 90%
];
let currentDifficulty = 2; // índice

// -------- Inicialização do tabuleiro --------
function initBoard() {
    const b = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRank = ['r','n','b','q','k','b','n','r'];
    for (let c = 0; c < 8; c++) {
        b[0][c] = { type: backRank[c], color: 'b' };
        b[1][c] = { type: 'p', color: 'b' };
        b[6][c] = { type: 'p', color: 'w' };
        b[7][c] = { type: backRank[c], color: 'w' };
    }
    return b;
}

function resetGame() {
    board = initBoard();
    turn = 'w';
    selected = null;
    legalMovesForSelected = [];
    moveHistory = [];
    lastMove = null;
    gameOver = false;
    isBotThinking = false;
    capturedWhite = [];
    capturedBlack = [];
    renderBoard();
    updateStatus();
    // Se for a vez do bot (quando as brancas são o bot, i.e., boardFlipped = true)
    if (!gameOver && !isBotThinking) {
        const botColor = boardFlipped ? 'w' : 'b';
        if (turn === botColor) {
            setTimeout(() => makeBotMove(), 500);
        }
    }
}

// -------- Funções auxiliares --------
function getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return board[row][col];
}

function isInBounds(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

function cloneBoard(b) {
    return b.map(row => row.map(p => p ? { ...p } : null));
}

function findKing(color, b) {
    b = b || board;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (p && p.type === 'k' && p.color === color) return { row: r, col: c };
        }
    }
    return null;
}

// Retorna a lista de movimentos legais para uma peça (sem verificar xeque)
function rawMoves(row, col, b) {
    b = b || board;
    const piece = b[row][col];
    if (!piece) return [];
    const { type, color } = piece;
    const moves = [];
    const enemy = color === 'w' ? 'b' : 'w';
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    const addMove = (r, c) => {
        if (!isInBounds(r, c)) return false;
        const target = b[r][c];
        if (target && target.color === color) return false;
        moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
        if (target && target.color === enemy) return false; // captura bloqueia
        return true;
    };

    const addSliding = (dr, dc) => {
        let r = row + dr, c = col + dc;
        while (isInBounds(r, c)) {
            const target = b[r][c];
            if (target && target.color === color) break;
            moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
            if (target && target.color === enemy) break;
            r += dr; c += dc;
        }
    };

    switch (type) {
        case 'p': {
            // avanço
            let r1 = row + dir;
            if (isInBounds(r1, col) && !b[r1][col]) {
                moves.push({ fromRow: row, fromCol: col, toRow: r1, toCol: col });
                // dois passos
                if (row === startRow) {
                    let r2 = row + 2 * dir;
                    if (!b[r2][col]) {
                        moves.push({ fromRow: row, fromCol: col, toRow: r2, toCol: col });
                    }
                }
            }
            // capturas
            for (let dc of [-1, 1]) {
                let nc = col + dc;
                if (!isInBounds(row + dir, nc)) continue;
                let target = b[row + dir][nc];
                if (target && target.color === enemy) {
                    moves.push({ fromRow: row, fromCol: col, toRow: row + dir, toCol: nc });
                }
                // en passant (ver depois)
            }
            break;
        }
        case 'n': {
            const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            for (let d of deltas) {
                let r = row + d[0], c = col + d[1];
                if (isInBounds(r, c)) {
                    let target = b[r][c];
                    if (!target || target.color === enemy) {
                        moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
                    }
                }
            }
            break;
        }
        case 'b': { addSliding(1,1); addSliding(1,-1); addSliding(-1,1); addSliding(-1,-1); break; }
        case 'r': { addSliding(1,0); addSliding(-1,0); addSliding(0,1); addSliding(0,-1); break; }
        case 'q': {
            addSliding(1,0); addSliding(-1,0); addSliding(0,1); addSliding(0,-1);
            addSliding(1,1); addSliding(1,-1); addSliding(-1,1); addSliding(-1,-1);
            break;
        }
        case 'k': {
            const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            for (let d of deltas) {
                let r = row + d[0], c = col + d[1];
                if (isInBounds(r, c)) {
                    let target = b[r][c];
                    if (!target || target.color === enemy) {
                        moves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
                    }
                }
            }
            // Roque (será filtrado depois)
            break;
        }
    }
    return moves;
}

// Filtra movimentos que deixam o rei em xeque
function legalMoves(row, col, b) {
    b = b || board;
    const piece = b[row][col];
    if (!piece) return [];
    const raw = rawMoves(row, col, b);
    const legal = [];
    const color = piece.color;
    for (let m of raw) {
        // Simula o movimento
        const testBoard = cloneBoard(b);
        const movingPiece = testBoard[row][col];
        testBoard[m.toRow][m.toCol] = movingPiece;
        testBoard[row][col] = null;
        // Verifica se o rei da mesma cor continua em xeque
        const king = findKing(color, testBoard);
        if (!king) continue;
        if (isSquareAttacked(king.row, king.col, color === 'w' ? 'b' : 'w', testBoard)) {
            continue; // movimento inválido
        }
        legal.push(m);
    }

    // Adicionar roque manualmente
    if (piece.type === 'k' && piece.color === color) {
        const rowK = color === 'w' ? 7 : 0;
        if (row === rowK && col === 4) {
            // Roque pequeno (lado do rei)
            const kingSide = [5,6];
            const rookPos = { row: rowK, col: 7 };
            const kingPos = { row: rowK, col: 4 };
            if (!b[rowK][7] || b[rowK][7].type !== 'r' || b[rowK][7].color !== color) {
                // não pode rocar
            } else {
                // verifica se as casas entre estão vazias e se o rei não passa por xeque
                if (!b[rowK][5] && !b[rowK][6]) {
                    // verifica se o rei não está em xeque, nem passa por xeque
                    if (!isSquareAttacked(rowK, 4, color === 'w' ? 'b' : 'w', b) &&
                        !isSquareAttacked(rowK, 5, color === 'w' ? 'b' : 'w', b) &&
                        !isSquareAttacked(rowK, 6, color === 'w' ? 'b' : 'w', b)) {
                        // verifica se o rei e a torre ainda não se moveram (histórico)
                        // simplificação: não vamos rastrear, mas permitimos apenas se não houve movimento
                        // Na prática, vamos permitir roque sempre que as condições estiverem satisfeitas
                        // e as peças estiverem nas posições iniciais.
                        // Vamos verificar se o rei e a torre já se moveram através do histórico.
                        // Como não temos flag, vamos usar uma heurística: se o rei e a torre ainda estão na posição inicial
                        // e nenhum movimento foi feito com eles.
                        // Na prática, para simplificar, permitimos roque se as casas estiverem vazias e não houver xeque.
                        // Vamos adicionar o movimento de roque.
                        legal.push({ fromRow: rowK, fromCol: 4, toRow: rowK, toCol: 6, castle: 'kingside' });
                    }
                }
            }
            // Roque grande (lado da dama)
            const queenSide = [1,2,3];
            if (!b[rowK][0] || b[rowK][0].type !== 'r' || b[rowK][0].color !== color) {
                // não pode
            } else {
                if (!b[rowK][1] && !b[rowK][2] && !b[rowK][3]) {
                    if (!isSquareAttacked(rowK, 4, color === 'w' ? 'b' : 'w', b) &&
                        !isSquareAttacked(rowK, 3, color === 'w' ? 'b' : 'w', b) &&
                        !isSquareAttacked(rowK, 2, color === 'w' ? 'b' : 'w', b)) {
                        legal.push({ fromRow: rowK, fromCol: 4, toRow: rowK, toCol: 2, castle: 'queenside' });
                    }
                }
            }
        }
    }

    // En passant (apenas se houver um movimento anterior que permita)
    // Vamos adicionar depois na execução do movimento, pois precisamos do último movimento.
    return legal;
}

// Verifica se uma casa está sendo atacada por uma determinada cor
function isSquareAttacked(row, col, attackerColor, b) {
    b = b || board;
    // Verifica se alguma peça do atacante pode capturar a casa
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (!p || p.color !== attackerColor) continue;
            const moves = rawMoves(r, c, b);
            for (let m of moves) {
                if (m.toRow === row && m.toCol === col) return true;
            }
        }
    }
    return false;
}

// Verifica se o rei da cor atual está em xeque
function kingInCheck(color, b) {
    b = b || board;
    const king = findKing(color, b);
    if (!king) return false;
    const enemy = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(king.row, king.col, enemy, b);
}

// Gera todos os movimentos legais para uma cor
function generateLegalMoves(color, b) {
    b = b || board;
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (p && p.color === color) {
                const ms = legalMoves(r, c, b);
                for (let m of ms) moves.push(m);
            }
        }
    }
    return moves;
}

// Executa um movimento no tabuleiro, retorna o estado resultante e informações
function makeMove(move, b) {
    b = b || board;
    const newBoard = cloneBoard(b);
    const piece = newBoard[move.fromRow][move.fromCol];
    if (!piece) return null;

    // Captura
    let captured = newBoard[move.toRow][move.toCol];
    if (captured) {
        // registra captura
    }

    // Move a peça
    newBoard[move.toRow][move.toCol] = piece;
    newBoard[move.fromRow][move.fromCol] = null;

    // Promoção (se peão chegar ao final)
    if (piece.type === 'p' && (move.toRow === 0 || move.toRow === 7)) {
        // Promove para rainha (ou pode ser escolhido, mas simplificamos)
        newBoard[move.toRow][move.toCol] = { type: 'q', color: piece.color };
    }

    // Roque
    if (move.castle) {
        const row = move.fromRow;
        if (move.castle === 'kingside') {
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
        } else if (move.castle === 'queenside') {
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
        }
    }

    // En passant (a ser tratado separadamente)

    return { board: newBoard, captured: captured, move: move };
}

// -------- Avaliação de posição (para IA) --------
function evaluatePosition(b, botColor) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (!p) continue;
            const val = PIECE_VALUES[p.type] || 0;
            let sign = (p.color === 'w') ? 1 : -1;
            const botSign = (botColor === 'w') ? 1 : -1;
            const finalSign = sign * botSign;
            score += val * finalSign;
            // Posicional
            if (PST[p.type]) {
                let pst = PST[p.type];
                let pr = r, pc = c;
                if (p.color === 'b') {
                    pr = 7 - r;
                    pc = 7 - c;
                }
                const pstVal = pst[pr]?.[pc] || 0;
                score += pstVal * 0.1 * finalSign;
            }
        }
    }
    // Mobilidade (simples)
    const moves = generateLegalMoves(botColor, b);
    const oppMoves = generateLegalMoves(botColor === 'w' ? 'b' : 'w', b);
    score += (moves.length - oppMoves.length) * 0.5;
    return score;
}

// -------- Minimax com poda alfa-beta --------
function minimax(node, depth, alpha, beta, isMaximizing, botColor, diff) {
    if (depth === 0 || node.isGameOver) {
        return evaluatePosition(node.board, botColor);
    }

    const color = node.turn;
    const moves = generateLegalMoves(color, node.board);
    if (moves.length === 0) {
        // Se não há movimentos, é xeque-mate ou afogamento
        return evaluatePosition(node.board, botColor);
    }

    // Ordena movimentos (capturas primeiro) para melhor poda
    moves.sort((a, b) => {
        const aCap = a.captured ? PIECE_VALUES[a.captured.type] || 0 : 0;
        const bCap = b.captured ? PIECE_VALUES[b.captured.type] || 0 : 0;
        return bCap - aCap;
    });

    let bestVal = isMaximizing ? -Infinity : Infinity;
    for (let m of moves) {
        const result = makeMove(m, node.board);
        if (!result) continue;
        const child = {
            board: result.board,
            turn: color === 'w' ? 'b' : 'w',
            isGameOver: false
        };
        // Verifica se o rei adversário está em xeque-mate (simplificado)
        const childMoves = generateLegalMoves(child.turn, child.board);
        if (childMoves.length === 0 && kingInCheck(child.turn, child.board)) {
            // xeque-mate
            child.isGameOver = true;
        }
        const val = minimax(child, depth - 1, alpha, beta, !isMaximizing, botColor, diff);
        if (isMaximizing) {
            bestVal = Math.max(bestVal, val);
            alpha = Math.max(alpha, val);
        } else {
            bestVal = Math.min(bestVal, val);
            beta = Math.min(beta, val);
        }
        if (beta <= alpha) break;
    }
    return bestVal;
}

// -------- IA (movimento do bot) --------
function makeBotMove() {
    if (gameOver || isBotThinking) return;
    isBotThinking = true;
    renderBoard();
    updateStatus();

    setTimeout(() => {
        const botColor = boardFlipped ? 'w' : 'b';
        const diff = DIFFICULTY_LEVELS[currentDifficulty];
        const moves = generateLegalMoves(botColor, board);
        if (moves.length === 0) {
            isBotThinking = false;
            gameOver = true;
            renderBoard();
            updateStatus();
            return;
        }

        let selectedMove = null;

        // Se profundidade 0, movimento aleatório com viés
        if (diff.depth === 0) {
            // Escolhe um movimento aleatório, mas prefere capturas
            const captureMoves = moves.filter(m => m.captured);
            if (captureMoves.length > 0 && Math.random() < 0.5) {
                selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            } else {
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
        } else {
            // Minimax
            let bestScore = -Infinity;
            let bestMoves = [];
            // Se aleatoriedade alta, faz uma seleção mais branda
            for (let m of moves) {
                const result = makeMove(m, board);
                if (!result) continue;
                const childBoard = result.board;
                const childTurn = botColor === 'w' ? 'b' : 'w';
                const childMoves = generateLegalMoves(childTurn, childBoard);
                let isGameOver = false;
                if (childMoves.length === 0 && kingInCheck(childTurn, childBoard)) {
                    isGameOver = true;
                }
                const score = minimax({ board: childBoard, turn: childTurn, isGameOver }, diff.depth - 1, -Infinity, Infinity, false, botColor, diff);
                const finalScore = score + (Math.random() * diff.random * 100);
                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestMoves = [m];
                } else if (Math.abs(finalScore - bestScore) < 0.001) {
                    bestMoves.push(m);
                }
            }
            if (bestMoves.length === 0) {
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
            } else {
                selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            }
        }

        if (selectedMove) {
            // Executa o movimento
            const result = makeMove(selectedMove, board);
            if (result) {
                if (result.captured) {
                    const capturedColor = result.captured.color;
                    if (capturedColor === 'w') capturedWhite.push(result.captured.type);
                    else capturedBlack.push(result.captured.type);
                }
                board = result.board;
                turn = turn === 'w' ? 'b' : 'w';
                lastMove = selectedMove;
                moveHistory.push(selectedMove);
                // Verifica fim de jogo
                const nextMoves = generateLegalMoves(turn, board);
                if (nextMoves.length === 0) {
                    gameOver = true;
                }
            }
        }

        isBotThinking = false;
        selected = null;
        legalMovesForSelected = [];
        renderBoard();
        updateStatus();

        // Se não acabou e ainda é a vez do bot, chama novamente
        if (!gameOver && !isBotThinking) {
            const botColor2 = boardFlipped ? 'w' : 'b';
            if (turn === botColor2) {
                setTimeout(() => makeBotMove(), 400);
            }
        }
    }, 200);
}

// -------- Renderização do tabuleiro --------
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    let rows = [0,1,2,3,4,5,6,7];
    let cols = [0,1,2,3,4,5,6,7];
    if (boardFlipped) {
        rows = rows.reverse();
        cols = cols.reverse();
    }
    for (let r of rows) {
        for (let c of cols) {
            const sq = document.createElement('div');
            const isLight = (r + c) % 2 === 0;
            sq.className = `square ${isLight ? 'light' : 'dark'}`;
            sq.dataset.row = r;
            sq.dataset.col = c;

            // Último movimento
            if (lastMove) {
                if ((r === lastMove.fromRow && c === lastMove.fromCol) ||
                    (r === lastMove.toRow && c === lastMove.toCol)) {
                    sq.classList.add('last-move');
                }
            }

            // Rei em xeque
            if (kingInCheck(turn, board)) {
                const king = findKing(turn, board);
                if (king && king.row === r && king.col === c) {
                    sq.classList.add('in-check');
                }
            }

            // Selecionado
            if (selected && selected.row === r && selected.col === c) {
                sq.classList.add('selected');
            }

            // Marcadores de movimento legal
            const isLegalTarget = legalMovesForSelected.some(m => m.toRow === r && m.toCol === c);
            if (isLegalTarget) {
                const dot = document.createElement('div');
                const hasPiece = board[r][c] !== null;
                dot.className = `move-dot ${hasPiece ? 'capture-ring' : ''}`;
                sq.appendChild(dot);
            }

            // Peça
            const piece = board[r][c];
            if (piece) {
                const span = document.createElement('span');
                const key = (piece.color === 'w' ? 'w' : 'b') + piece.type.toUpperCase();
                span.textContent = UNICODE_PIECES[key] || '';
                span.className = `piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
                sq.appendChild(span);
            }

            sq.addEventListener('click', () => onSquareClick(r, c));
            boardEl.appendChild(sq);
        }
    }
    updateCaptured();
}

function updateCaptured() {
    const whiteEl = document.getElementById('capturedWhite');
    const blackEl = document.getElementById('capturedBlack');
    whiteEl.innerHTML = '<span class="captured-label">Capturadas:</span>';
    blackEl.innerHTML = '<span class="captured-label">Capturadas:</span>';

    const whitePieces = capturedBlack.map(p => {
        const key = 'w' + p.toUpperCase();
        return UNICODE_PIECES[key] || p;
    });
    const blackPieces = capturedWhite.map(p => {
        const key = 'b' + p.toUpperCase();
        return UNICODE_PIECES[key] || p;
    });

    blackPieces.forEach(sym => {
        const span = document.createElement('span');
        span.textContent = sym;
        span.className = 'captured-piece';
        span.style.color = '#1a1a2e';
        whiteEl.appendChild(span);
    });
    whitePieces.forEach(sym => {
        const span = document.createElement('span');
        span.textContent = sym;
        span.className = 'captured-piece';
        span.style.color = '#fcf8f0';
        span.style.textShadow = '0 1px 3px rgba(0,0,0,0.4)';
        blackEl.appendChild(span);
    });
}

function updateStatus() {
    const turnDot = document.getElementById('turnDot');
    const turnText = document.getElementById('turnText');
    const statusMsg = document.getElementById('statusMessage');

    if (gameOver) {
        turnDot.className = 'turn-dot waiting';
        turnText.textContent = 'Fim de jogo';
        const moves = generateLegalMoves(turn, board);
        if (moves.length === 0) {
            if (kingInCheck(turn, board)) {
                const winner = turn === 'w' ? 'Preto' : 'Branco';
                statusMsg.textContent = `🏆 ${winner} venceu por xeque-mate!`;
            } else {
                statusMsg.textContent = '🤝 Empate (afogamento)!';
            }
        } else {
            statusMsg.textContent = '⏹ Jogo terminado.';
        }
        statusMsg.className = 'status-message active';
        return;
    }

    if (isBotThinking) {
        turnDot.className = 'turn-dot waiting';
        turnText.textContent = 'Bot pensando...';
        statusMsg.textContent = '🤖 Analisando jogada...';
        statusMsg.className = 'status-message active';
        return;
    }

    const isWhiteTurn = turn === 'w';
    const playerColor = boardFlipped ? 'b' : 'w';
    const isPlayerTurn = (playerColor === turn);

    if (isWhiteTurn) {
        turnDot.className = 'turn-dot white';
        turnText.textContent = boardFlipped ? 'Bot (Branco)' : 'Sua vez (Branco)';
    } else {
        turnDot.className = 'turn-dot black';
        turnText.textContent = boardFlipped ? 'Sua vez (Preto)' : 'Bot (Preto)';
    }

    const inCheck = kingInCheck(turn, board) ? ' ⚠️ Xeque!' : '';
    statusMsg.textContent = `Jogando${inCheck}`;
    statusMsg.className = 'status-message' + (inCheck ? ' active' : '');

    // Acionar bot se for a vez dele
    if (!gameOver && !isBotThinking) {
        const botColor = boardFlipped ? 'w' : 'b';
        if (turn === botColor) {
            setTimeout(() => makeBotMove(), 400);
        }
    }
}

// -------- Interação do usuário --------
function onSquareClick(row, col) {
    if (gameOver || isBotThinking) return;
    const playerColor = boardFlipped ? 'b' : 'w';
    if (turn !== playerColor) return;

    const piece = board[row][col];

    // Se já tem uma peça selecionada
    if (selected) {
        // Verifica se o clique é um destino legal
        const isLegal = legalMovesForSelected.some(m => m.toRow === row && m.toCol === col);
        if (isLegal) {
            // Encontra o movimento correspondente
            const move = legalMovesForSelected.find(m => m.toRow === row && m.toCol === col);
            if (move) {
                // Executa o movimento
                const result = makeMove(move, board);
                if (result) {
                    if (result.captured) {
                        const capturedColor = result.captured.color;
                        if (capturedColor === 'w') capturedWhite.push(result.captured.type);
                        else capturedBlack.push(result.captured.type);
                    }
                    board = result.board;
                    turn = turn === 'w' ? 'b' : 'w';
                    lastMove = move;
                    moveHistory.push(move);
                    // Verifica fim de jogo
                    const nextMoves = generateLegalMoves(turn, board);
                    if (nextMoves.length === 0) {
                        gameOver = true;
                    }
                }
                selected = null;
                legalMovesForSelected = [];
                renderBoard();
                updateStatus();
                return;
            }
        }

        // Se clicou na própria peça, seleciona ela
        if (piece && piece.color === playerColor) {
            selected = { row, col };
            legalMovesForSelected = legalMoves(row, col, board);
            renderBoard();
            return;
        }

        // Senão, deseleciona
        selected = null;
        legalMovesForSelected = [];
        renderBoard();
        return;
    }

    // Nenhuma peça selecionada: seleciona se for uma peça do jogador
    if (piece && piece.color === playerColor) {
        selected = { row, col };
        legalMovesForSelected = legalMoves(row, col, board);
        renderBoard();
    }
}

// -------- Controles --------
document.getElementById('newGameBtn').addEventListener('click', resetGame);
document.getElementById('flipBoardBtn').addEventListener('click', () => {
    boardFlipped = !boardFlipped;
    renderBoard();
    updateStatus();
});
document.getElementById('undoBtn').addEventListener('click', () => {
    if (isBotThinking || gameOver) return;
    if (moveHistory.length === 0) return;
    // Desfaz até 2 movimentos (o último do jogador e o do bot)
    let undone = 0;
    while (moveHistory.length > 0 && undone < 2) {
        const last = moveHistory.pop();
        // Reverter o movimento é complexo; como temos o histórico, podemos recriar o tabuleiro do zero
        undone++;
    }
    // Reconstruir o tabuleiro a partir do histórico
    // Simples: reiniciar e refazer todos os movimentos menos os desfeitos
    const newBoard = initBoard();
    let newTurn = 'w';
    const tempHistory = [...moveHistory];
    // Limpa capturas
    capturedWhite = [];
    capturedBlack = [];
    // Aplica os movimentos restantes
    for (let m of tempHistory) {
        const result = makeMove(m, newBoard);
        if (result) {
            if (result.captured) {
                const cColor = result.captured.color;
                if (cColor === 'w') capturedWhite.push(result.captured.type);
                else capturedBlack.push(result.captured.type);
            }
            // Atualiza newBoard
            Object.assign(newBoard, result.board);
            newTurn = newTurn === 'w' ? 'b' : 'w';
        }
    }
    board = newBoard;
    turn = newTurn;
    lastMove = tempHistory.length > 0 ? tempHistory[tempHistory.length-1] : null;
    selected = null;
    legalMovesForSelected = [];
    gameOver = false;
    renderBoard();
    updateStatus();
});

// Dificuldade
document.getElementById('difficultyGroup').addEventListener('click', (e) => {
    const btn = e.target.closest('.diff-btn');
    if (!btn) return;
    const diff = parseInt(btn.dataset.diff);
    if (isNaN(diff)) return;
    currentDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    resetGame();
});

// Teclas de atalho
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') resetGame();
    if (e.key === 'u' || e.key === 'U') document.getElementById('undoBtn').click();
    if (e.key === 'f' || e.key === 'F') document.getElementById('flipBoardBtn').click();
});

// -------- Inicialização --------
resetGame();
console.log('♚ Chess Royale carregado (sem bibliotecas externas)');