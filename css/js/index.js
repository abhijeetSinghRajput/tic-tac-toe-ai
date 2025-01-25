const guiCells = [...document.querySelectorAll('#board .cell')];
const guiPositionKey = document.querySelector('.poskey');
const windows = document.querySelector('.windows');

function showWindow(winner){
    windows.classList.add('show');
    windows.querySelector('.winner').className = `winner cell ${winner}`;
}
function closeWindow(){
    windows.classList.remove('show');
}

let side = 1;
let bitBoard = [0, 0]
let winner = 0;
let positionKey = 0;

function newGame() {
    guiCells.forEach(cell => cell.className = "cell");
    side = 1;
    bitBoard = [0, 0];
    winner = 0;
    positionKey = 0;
    guiPositionKey.textContent = positionKey.toString(16);
    closeWindow();
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
        if(isDraw()){
            return showWindow("Match Draw");
        }
        if(winner) return;
        
        if (isEmpty(i)) {
            cell.classList.add(side === 1 ? 'x' : 'o');
            makeMove(i);
            winner = isWin();
            guiPositionKey.textContent = positionKey.toString(16);
            if (winner) {
                drawWinLine()
                return showWindow(winner === 1 ? 'x' : 'o');
            }
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
    if (isDraw()) return 0;
    let score = isWin();
    if (score == 1) return 10 - depth;
    if (score == -1) return depth - 10;

    let bestScore = -Infinity;
    for (let i = 0; i < 9; ++i) {
        if (!isEmpty(i)) continue;

        makeMove(i);
        score = -negaMax(depth + 1);
        undoMove(i);
        
        bestScore = Math.max(bestScore, score);
    }
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

        if(score > bestScore){
            bestScore = score;
            bestMove = i;
        }
    }
    return bestMove;
}

function isWin() {
    for (const mask of bitMasks) {
        if ((bitBoard[0] & mask) === mask) return -1;
        if ((bitBoard[1] & mask) === mask) return 1;
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
    bitBoard[side] &= ~(1 << index);
    side ^= 1;
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
