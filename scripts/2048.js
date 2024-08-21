let { init,
      Text,
      Sprite,
      initInput,
      onInput,
      GameLoop
    } = kontra;

let { canvas, context } = init();

initInput();

let loop_stopped = true;
let game_over = false;

const square_dim = 50;
const grid_gap   = 2;

let grid = Array.from({ length: 4 }, () => new Array(4).fill(0));
let empty_grid;
let prev_grid;
let animations = [];

let score = 0;
let move  = 0;
const score_element = document.getElementById("score");
const move_element  = document.getElementById("move");
const emoji_first   = document.getElementById("face");
const emoji_second  = document.getElementById("hand");
const restart_button_element = document.getElementById("restartButton");

const hands = {
    N: "&#x1F44D;", // 👍
    R: "&#x1F449;", // 👉
    L: "&#x1F448;", // 👈
    U: "&#x261D;",  // ☝
    D: "&#x1F447;",  // 👇
    game_over: "&#x1F485;" // 💅
};

const faces = {
    neutral: [ "&#x1F60E;"/* 😎 */, "&#x1F617;" /* 😗 */ ],
    game_over: "&#x1F629;", /* 😩 */
};

const update_little_guy = (direction) => {
    if (game_over) {
        emoji_first.innerHTML = faces['game_over'];
        emoji_second.innerHTML = hands['game_over'];
        return;
    }
    switch (direction) {
        case 'R':
        case 'D':
            emoji_first.innerHTML  = randChoice(faces['neutral']);
            emoji_second.innerHTML = hands[direction];
            break;
        case 'L':
        case 'U':
            emoji_second.innerHTML = randChoice(faces['neutral']);
            emoji_first.innerHTML  = hands[direction];
            break;
    }
} 

const gameOverOverlay = Sprite({
    x: 0,
    y: 0,
    width: 210,
    height: 210,
    color: 'grey'
});

let gameOverText = Text({
    text: 'Game Over',
    font: '32px Arial',
    color: 'white',
    x: 105,
    y: 105,
    anchor: {x: 0.5, y: 0.5},
    textAlign: 'center'
});

const randInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randChoice = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}

const grid_coords = (grid_pos) => {
    return {
        x: (grid_pos.x + 1) * grid_gap + grid_pos.x * square_dim,
        y: (grid_pos.y + 1) * grid_gap + grid_pos.y * square_dim,
    }
}

let animloop = GameLoop(
    {
        update: (dt) => {
            animations.forEach((anim) => {
                if (!anim.update()) {
                    animations = [];
                    animloop.stop();
                    loop_stopped = true;
                    renderBoard(grid);
                }
            })
        },
        render: () => {
            if (animloop.isStopped) {
                renderBoard(grid);
            }
            else {
                renderBoard(empty_grid);
                animations.forEach((anim) => {
                    anim.render();
                })
            }
        }
    }
);

const AnimType = {
    Tween: 'Tween',
    Merge: 'Merge',
    None:  'None'
};

class SquareAnim {
    constructor(animtype,
                prev_pos,
                new_pos,
                sprite) {
        this.animtype = animtype;
        this.prev_pos = prev_pos;
        this.new_pos  = new_pos;
        this.sprite   = sprite;
        this.speed    = 0;
        this.frame    = 0;
        this.duration = 10;
        switch (this.animtype) {
            // tween lasts one second
            case AnimType.Tween:
                this.speed = {
                                x: ( this.new_pos.x - this.prev_pos.x ) / this.duration,
                                y: ( this.new_pos.y - this.prev_pos.y ) / this.duration
                             };
                break;
            // tween lasts half a second, then size animation plays
            case AnimType.Merge:
                this.speed = {
                                x: ( this.new_pos.x - this.prev_pos.x ) / (this.duration / 2),
                                y: ( this.new_pos.y - this.prev_pos.y ) / (this.duration / 2)
                             };
                break;
            case AnimType.None:
                break;
        }
    }
    update() {
        if (this.frame === this.duration) {
            return false;
        }
        switch (this.animtype) {
            case AnimType.Tween:
                this.sprite.square.x += this.speed.x;
                this.sprite.square.y += this.speed.y;
                this.sprite.text.x += this.speed.x;
                this.sprite.text.y += this.speed.y;
                break;
            case AnimType.Merge:
                if ( this.frame >= (this.duration * 3)/4 ) {
                    this.sprite.square.width  -= 2;
                    this.sprite.square.x      += 1;
                    this.sprite.square.height -= 2;
                    this.sprite.square.y      += 1;
                    break;
                } 
                else if ( this.frame >= this.duration/2 ) {
                    this.sprite.square.width  += 2;
                    this.sprite.square.x      -= 1;
                    this.sprite.square.height += 2;
                    this.sprite.square.y      -= 1;
                    break;
                }
                this.sprite.square.x += this.speed.x;
                this.sprite.square.y += this.speed.y;
                this.sprite.text.x += this.speed.x;
                this.sprite.text.y += this.speed.y;
                break;
            case AnimType.None:
                break;
        }
        this.frame++;
        return true;
    }
    render() {
        render_square(this.sprite);
    }
};

const reset_stuff = () => {
    loop_stopped = true;
    game_over = false;

    grid = Array.from({ length: 4 }, () => new Array(4).fill(0));
    empty_grid;
    prev_grid;
    animations = [];

    score = 0;
    move  = 0;

    restart_button_element.classList.toggle("hidden");

    score_element.innerHTML = "0";
    move_element.innerHTML  = "0";

    initBoard();
    animloop.start();
}

const create_square = (n, grid_pos) => {
    let coords = grid_coords(grid_pos);
    let square_color = 'grey';
    let text_props = null;
    switch (n) {
        case 2:
            square_color = '#264653';
            text_props = {
                text: '2',
                x: coords.x + 15,
                y: coords.y + 10,
                color: 'white',
                font: '32px Arial, sans-serif'
            };
            break;
        case 4:
            square_color = '#287271';
            text_props = {
                text: '4',
                x: coords.x + 15,
                y: coords.y + 10,
                color: 'white',
                font: '32px Arial, sans-serif'
            };
            break;
        case 8:
            square_color = '#2A9D8F';
            text_props = {
                text: '8',
                x: coords.x + 15,
                y: coords.y + 10,
                color: 'black',
                font: '32px Arial, sans-serif'
            };
            break;
        case 16:
            square_color = '#8AB17D';
            text_props = {
                text: '16',
                x: coords.x + 5,
                y: coords.y + 10,
                color: 'black',
                font: '32px Arial, sans-serif'
            };
            break;
        case 32:
            square_color = '#BABB74';
            text_props = {
                text: '32',
                x: coords.x + 6,
                y: coords.y + 10,
                color: 'black',
                font: '32px Arial, sans-serif'
            };
            break;
        case 64:
            square_color = '#E9C46A';
            text_props = {
                text: '64',
                x: coords.x + 10,
                y: coords.y + 14,
                color: 'black',
                font: '28px Arial, sans-serif'
            };
            break;
        case 128:
            square_color = '#EFB366';
            text_props = {
                text: '128',
                x: coords.x + 4,
                y: coords.y + 14,
                color: 'black',
                font: '24px Arial, sans-serif'
            };
            break;
        case 256:
            square_color = '#F4A261';
            text_props = {
                text: '256',
                x: coords.x + 6,
                y: coords.y + 16,
                color: 'black',
                font: '22px Arial, sans-serif'
            };
            break;
        case 512:
            square_color = '#EE8959';
            text_props = {
                text: '512',
                x: coords.x + 6,
                y: coords.y + 16,
                color: 'black',
                font: '22px Arial, sans-serif'
            };
            break;
        case 1024:
            square_color = '#E76F51';
            text_props = {
                text: '1024',
                x: coords.x + 5,
                y: coords.y + 17,
                color: 'black',
                font: '18px Arial, sans-serif'
            };
            break;
        case 2048:
            square_color = '#ff1184';
            text_props = {
                text: '2048',
                x: coords.x + 5,
                y: coords.y + 17,
                color: 'black',
                font: '18px Arial, sans-serif'
            };
            break;
        default:
            break;
    }
    let square = Sprite({
        width: 50,
        height: 50,
        color: square_color,
        x: coords.x,
        y: coords.y,
    });
    let text;
    if (text_props === null) {
        text = null;
    }
    else {
        text = Text({
            ...text_props
        });
    }
    return {
        value: n,
        newly_merged: false,
        square: square,
        text: text
    }
}

const render_square = (square) => {
    square.square.render();
    if (square.text !== null) {
        square.text.render();
    }
}

const renderBoard = (grid) => {
    for (let y = 0; y < 4; ++y) {
        for (let x = 0; x < 4; ++x) {
            render_square(grid[y][x]);
        }
    }
}

const initBoard = () => {

    for (let y = 0; y < 4; ++y) {
        for (let x = 0; x < 4; ++x) {
            grid[y][x] = create_square(0, { x: x, y: y });
        }
    }

    empty_grid = cloneGrid(grid);

    let starter_x = randInt(0,3);
    let starter_y = randInt(0,3);
    grid[starter_y][starter_x] = create_square(
                                    Math.random() >= 0.9 ? 4 : 2,
                                    {
                                        x: starter_x,
                                        y: starter_y
                                    }
                                );
    animations.push(
        new SquareAnim(
            AnimType.None,
            {x: null, y: null},
            {x: null, y: null},
            grid[starter_y][starter_x]
        )
    );
    renderBoard(grid);
}

const numFreeSquares = () => {
    let free_squares = 0;
    for (let y = 0; y<4; ++y) {
        for (let x = 0; x<4; ++x) {
            if (grid[y][x].value === 0) {
                free_squares++;
            }
        }
    }
    return free_squares;
}

const newSquare = () => {
    let free_squares = [];
    for (let y = 0; y<4; ++y) {
        for (let x = 0; x<4; ++x) {
            if (grid[y][x].value === 0) {
                free_squares.push({ x: x, y: y });
            }
        }
    }
    const coords = randChoice(free_squares);
    grid[coords.y][coords.x] = create_square(
        Math.random() >= 0.9 ? 4 : 2,
        {
            x: coords.x,
            y: coords.y
        }
    );
}

const updateSquare = (grid, pos, offset, just_checking=false) => {
    if (grid[pos.y][pos.x].value > 0) {
        let tmp_square = grid[pos.y][pos.x];
        let x = pos.x;
        let y = pos.y;

        while ( (offset.x ===  1 && x < 3) ||
                (offset.x === -1 && x > 0) ||
                (offset.y ===  1 && y < 3) ||
                (offset.y === -1 && y > 0)
        ) {
            // move the square
            if (
                grid[y + offset.y][x + offset.x].value === 0 
             ){
                x += offset.x;
                y += offset.y;
            }
            // merge the square, render the changes
            else if (grid[y + offset.y][x + offset.x].value === tmp_square.value &&
                !grid[y + offset.y][x + offset.x].newly_merged
            ) {
                if (!just_checking) {
                    animations.push(new SquareAnim(
                        AnimType.Merge,
                        grid_coords({x: pos.x, y: pos.y}),
                        grid_coords({x: x + offset.x, y: y + offset.y}),
                        tmp_square
                    ));
                    score += tmp_square.value * 2;
                }
                grid[y + offset.y][x + offset.x] = create_square(tmp_square.value * 2,
                                                                 {
                                                                    x: x + offset.x,
                                                                    y: y + offset.y
                                                                 }
                                                                );
                grid[y + offset.y][x + offset.x].newly_merged = true;
                grid[pos.y][pos.x] = create_square(0, {x: pos.x, y: pos.y});
                return true;
            }
            else {
                break;
            }
        }
        // render the changes
        if ( (x !== pos.x || y !== pos.y) ) {
            if (!just_checking) {
                animations.push(
                    new SquareAnim(
                        AnimType.Tween,
                        grid_coords({x: pos.x, y: pos.y}),
                        grid_coords({x: x, y: y}),
                        tmp_square
                    )
                );
            }
            grid[y][x] = create_square(tmp_square.value, {x: x, y: y});
            grid[pos.y][pos.x] = create_square(0, {x: pos.x, y: pos.y});
            return true;
        }
        // the square ain't shmooving, but we still need to add it as an "animation"
        // 'cause that's how it is
        if (!just_checking ){
            animations.push(
                new SquareAnim(
                    AnimType.None,
                    {x: null, y: null},
                    {x: null, y: null},
                    tmp_square
                )
            );
        }
    }
    return false;
}

const addPerimeter = (grid, direction) => {
    let perimeter;
    switch (direction) {
        case 'R':
            perimeter = [
                grid[0][3],
                grid[1][3],
                grid[2][3],
                grid[3][3]
            ];
            break;
        case 'L':
            perimeter = [
                grid[0][0],
                grid[1][0],
                grid[2][0],
                grid[3][0]
            ];
            break;
        case 'U':
            perimeter = [
                grid[0][0],
                grid[0][1],
                grid[0][2],
                grid[0][3]
            ];
            break;
        case 'D':
            perimeter = [
                grid[3][0],
                grid[3][1],
                grid[3][2],
                grid[3][3]
            ];
            break;
    }
    perimeter.forEach(
        sq => {
            if (sq.value !== 0){
                animations.push(new SquareAnim(
                    AnimType.None,
                    {x: null, y: null},
                    {x: null, y: null},
                    sq
                ))
            }
        }
    )
}

const updateBoard = (direction, grid, just_checking=false) => {
    prev_grid = cloneGrid(grid);
    addPerimeter(prev_grid, direction);
    let movement = false;
    switch (direction) {
        case 'R':
            for (let y = 3; y>=0; --y) {
                for (let x = 2; x>=0; --x) {
                        if ( updateSquare(
                            grid,
                            { x: x, y: y },
                            { x: 1, y: 0 },
                            just_checking
                        ) ) movement = true;
                    }
                }
            break;
        case 'L':
            for (let y = 3; y>=0; --y) {
                for (let x = 1; x<4; ++x) {
                    if ( updateSquare(
                        grid,
                        { x: x, y: y },
                        { x: -1, y: 0 },
                        just_checking
                    ) ) movement = true;
                }
            }
            break;
        case 'U':
            for (let x = 3; x>=0; --x) {
                for (let y = 1; y<4; ++y) {
                    if ( updateSquare(
                        grid,
                        { x: x, y: y },
                        { x: 0, y: -1 },
                        just_checking
                    ) ) movement = true;
                }
            }
            break;
        case 'D':
            for (let x = 3; x>=0; --x) {
                for (let y = 2; y>=0; --y) {
                    if ( updateSquare(
                        grid,
                        { x: x, y: y },
                        { x: 0, y: 1 },
                        just_checking
                    ) ) movement = true;
                }
            }
            break;
    }
    if (movement && !just_checking) {
        grid.forEach(
            arr => {
                arr.forEach(
                    sq => {
                        sq.newly_merged = false;
                    }
                )
            }
        );
        move++;
    }
    if ( movement && numFreeSquares() > 0 && !just_checking) {
        newSquare();
    }
    return movement;
}

const cloneGrid = () => {
    let this_grid = Array.from({ length: 4 }, () => new Array(4).fill(0));
    for (let y = 0; y<4; ++y) {
        for (let x = 0; x<4; ++x) {
            this_grid[y][x] = create_square(grid[y][x].value, { x: x, y: y });
        }
    }
    return this_grid;
}

const checkGameOver = () => {
    let gridClone = cloneGrid();
    let result = false;
    ['R', 'L', 'U', 'D'].forEach(
        (el) => {
            result = updateBoard(el, gridClone, true);
        }
    )
    return !result;
}

const updateBoardGameOverWrapper = (direction, grid) => {
    if (!loop_stopped || game_over) {
        return;
    }
    if (!updateBoard(direction, grid) &&
        numFreeSquares() === 0 &&
        checkGameOver()) {
        game_over = true;
        gameOverOverlay.render();
        gameOverText.render();
        restart_button_element.classList.toggle("hidden");
        restart_button_element.onclick = reset_stuff;
    }
    else {
        score_element.innerHTML = score.toString();
        move_element.innerHTML  = move.toString();
        animloop.start();
        loop_stopped = false;
    }
    update_little_guy(direction);
}

initBoard();

onInput(['arrowright', 'swiperight'], (e) => {
    updateBoardGameOverWrapper('R', grid);
});

onInput(['arrowleft', 'swipeleft'], (e) => {
    updateBoardGameOverWrapper('L', grid);
})

onKey(['arrowup', 'swipeup'], (e) => {
    updateBoardGameOverWrapper('U', grid);
})

onKey(['arrowdown', 'swipedown'], (e) => {
    updateBoardGameOverWrapper('D', grid);
})