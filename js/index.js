const guiCells = [...document.querySelectorAll('#board .cell')];
const guiPositionKey = document.querySelector('.poskey');
const gameOverWindow = document.querySelector('#game-over');
const guiWinner = document.querySelector('#winner');
const guiTurn = document.querySelector('#turn');

function showWindow(data){
    const para = gameOverWindow.querySelector('p');
    
    if(data.draw){
        para.textContent = "Match Draw";
        gameOverWindow.className = 'show draw';
        return;
    }

    gameOverWindow.className = `show ${data.winner}`;
    guiWinner.className = `cell ${data.winner}`;
    para.textContent = `Wins the match`;
}
function closeWindow(){
    gameOverWindow.classList.remove('show', 'o', 'x', 'draw');
}

let side = 1;
let bitBoard = [0, 0]
let winner = 0;
let positionKey = 0;
let transpositionTable = {};

function newGame() {
    guiCells.forEach(cell => cell.className = "cell");
    side = 1;
    bitBoard = [0, 0];
    winner = 0;
    positionKey = 0;
    guiPositionKey.textContent = positionKey.toString(16);
    guiTurn.className = "cell x";
    closeWindow();
    transpositionTable = {};
}
const zobristKeys = [
    [0x1a2b3c4d, 0x9a8b7c6d],
    [0x2b3c4d5e, 0x8b7c6d5e],
    [0x3c4d5e6f, 0x7c6d5e4f],
    [0x4d5e6f78, 0x6d5e4f32],
    [0x5e6f7890, 0x5e4f3210],
    [0x6f7890a1, 0x4f3210a2],
    [0x7890a1b2, 0x3210a2b3],
    [0x90a1b2c3, 0x10a2b3c4],
    [0xa1b2c3d4, 0xa2b3c4d5]
];

guiCells.forEach((cell, i) => {
    cell.addEventListener('click', () => {
        
        if(winner) return;

        if (isEmpty(i)) {
            cell.classList.add(side === 1 ? 'x' : 'o');
            
            makeMove(i);
            winner = isWin();
            if (winner) {
                drawWinLine()
                return showWindow({draw: false, winner: winner === 1 ? 'x' : 'o'});
            }
            if(isDraw()){
                return showWindow({draw: true, winner: false});
            }

            guiPositionKey.textContent = positionKey.toString(16);
            guiTurn.className = "cell "  + (side === 1? 'x' : 'o');
        }
    });
})

const bitMasks = [7, 56, 448, 73, 146, 292, 273, 84];
// 7        56      448
// 1 1 1    0 0 0   0 0 0
// 0 0 0    1 1 1   0 0 0
// 0 0 0    0 0 0   1 1 1

// 73       146     292
// 1 0 0    0 1 0   0 0 1
// 1 0 0    0 1 0   0 0 1
// 1 0 0    0 1 0   0 0 1

// 273      84      511
// 1 0 0    0 0 1   1 1 1
// 0 1 0    0 1 0   1 1 1
// 0 0 1    1 0 0   1 1 1

function drawWinLine(){
    let winLine = 0;
    for(const mask of bitMasks){
        if((mask & bitBoard[0]) === mask){
            winLine = mask;
            break;
        }
        else if((mask & bitBoard[1]) === mask){
            winLine = mask;
            break;
        }
    }
    for(let i = 0; i<9; ++i){
        if(winLine & (1 << i)){
            guiCells[i].classList.add('active');
        }
    }
}

function negaMax(depth) {
    let winner = isWin();
    if (winner) {
        // X wins, return positive score
        // O wins, return negative
        return (winner === 1 ? 10 - depth:  depth - 10); 
    }

    //memoization
    if(positionKey in transpositionTable){
        return transpositionTable[positionKey];
    }

    if (isDraw()) return 0;

    let bestScore = -Infinity;
    for (let i = 0; i < 9; ++i) {
        if (!isEmpty(i)) continue;

        makeMove(i);
        let score = -negaMax(depth + 1);
        undoMove(i);
        
        bestScore = Math.max(bestScore, score);
    }
    transpositionTable[positionKey] = bestScore;
    return bestScore;
}

function getBestMove(){
    let bestMove = -1;
    let bestScore = -Infinity;
    for(let i = 0; i<9; ++i){
        if(!isEmpty(i)) continue;

        makeMove(i);
        let score = negaMax(0);
        undoMove(i);
        console.log(i, score);
        if(score > bestScore){
            bestScore = score;
            bestMove = i;
        }
    }
    return bestMove;
}

function isWin() {
    for (const mask of bitMasks) {
        if ((bitBoard[0] & mask) === mask) return -1;   // Player 'O' wins
        if ((bitBoard[1] & mask) === mask) return 1;    // Player 'X' wins
    }
    return 0;
}
function isDraw() {
    return (bitBoard[0] | bitBoard[1]) === 511
}

function isEmpty(index) {
    return !((bitBoard[0] | bitBoard[1]) & (1 << index));
}
function makeMove(index) {
    bitBoard[side] |= (1 << index);
    side ^= 1;
    hashKey(index);
}
function undoMove(index) {
    side ^= 1;
    bitBoard[side] &= ~(1 << index);
    hashKey(index);
}

function hashKey(index) {
    positionKey ^= zobristKeys[index][side];
}


// ====================== dev tools ================
function parseBit(mask) {
    return parseInt(mask.split(/\s+/).reverse().join(''), 2)
}
function printBitBoard(bitBoard) {
    for (let i = 0; i < 3; ++i) {
        let line = '';
        for (let j = 0; j < 3; ++j) {
            let k = i * 3 + j;
            line += (bitBoard & (1 << k)) ? '1' : '_';
            line += '\t';
        }
        console.log(line);
    }
    console.log('\n');
}




// X _ O
// _ _ _
// _ _ X
// turn = O

// expected bestMove = 4
// output 1 