// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persist across program updates. Store data here.
import { nodes, root, state } from "membrane";

state.game = state.game ?? {};

type GameSymbol = "X" | "O" | "";
type GameBoard = GameSymbol[][];

interface GameState {
  board: GameBoard;
  turn: GameSymbol;
  winner: GameSymbol | null;
  over: Boolean;
}

export const Root = {
  setup() {
    const board: GameBoard = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""));
    const turn: GameSymbol = "X";
    let winner: GameSymbol | null = null;

    state.game = { board, turn, winner };
  },
  endpoint: async ({ args: { path, method } }) => {
    // If the path is "/restart", reset the game state and redirect to the root path
    if (path === "/restart") {
      await root.setup();
      return JSON.stringify({ status: 303, headers: { location: "/" } });
    }

    // Parse the requested cell and get the current game state
    const [, cell] = path.split("/");
    const game = state.game;

    // If the game is over, return the current state as HTML
    if (game.winner || game.over) {
      return html(game);
    }

    // If the game board is not set up, return an error message
    if (!game.board) {
      return JSON.stringify({ status: 404, body: "Run :setup action" });
    }

    // check if the requested move is valid
    if (method === "POST") {
      const move = Number(cell);
      if (
        isNaN(move) ||
        move < 1 ||
        move > 9 ||
        game.board[Math.floor((move - 1) / 3)][(move - 1) % 3] !== ""
      ) {
        return JSON.stringify({ status: 400, body: "Invalid move" });
      }

      // Update the game board with the requested move
      game.board[Math.floor((move - 1) / 3)][(move - 1) % 3] = game.turn;
      if (checkWinner(game.board, game.turn)) {
        game.winner = game.turn;
      } else if (checkTie(game.board)) {
        game.over = true;
        return JSON.stringify({ status: 303, headers: { location: "/" } });
      }

      // Update the turn
      game.turn = game.turn === "X" ? "O" : "X";
      return JSON.stringify({ status: 303, headers: { location: "/" } });
    } else if (method === "GET") {
      // If the request method is GET, return the current game state as HTML
      return html(game);
    } else {
      return { status: 405, body: "Method not allowed" };
    }
  },
};

// Check for a tie in the given game board
function checkTie(board: GameBoard): boolean {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      // If any cell is empty, the game is not a tie
      if (board[row][col] === "") {
        return false;
      }
    }
  }
  return true;
}

function checkWinner(board: GameBoard, player: GameSymbol): number[] | null {
  // Check rows
  for (let i = 0; i < board.length; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) {
      return [i * 3 + 1, i * 3 + 2, i * 3 + 3];
    }
  }
  // Check columns
  for (let i = 0; i < board[0].length; i++) {
    if (board[0][i] === player && board[1][i] === player && board[2][i] === player) {
      return [i + 1, i + 4, i + 7];
    }
  }
  // Check diagonals
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
    return [1, 5, 9];
  }
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
    return [3, 5, 7];
  }
  // No winner
  return null;
}

// Generate an HTML view for the Tic Tac Toe game
function html(game: GameState) {
  const board = game.board
    .map((row, i) => {
      return row
        .map((cell, j) => {
          // Calculate the number of the cell based on it's position
          const num = i * 3 + j + 1;
          // Determine whether the button should be disabled based on game state
          const disabled = cell === "X" || cell === "O" || game.winner || game.over;
          let className = "";
          if (game.winner) {
            const isWinner = checkWinner(game.board, game.winner)!.includes(num);
            className = `${isWinner ? "winner" : ""}`;
          }
          // Return the HTML for the cell as a string
          return `
            <td>
              <form action="/${num}" method="POST">
                <button class="${className} ${disabled ? "disabled" : ""}" ${ disabled ? "disabled" : ""}>
                  <span>${cell || "&nbsp;"}</span>
                </button>	
              </form>
            </td>
          `;
        })
        .join("");
    })
    .map((row) => `<tr>${row}</tr>`)
    .join("");

  // Determine the message to display based on game state
  const message = game.over
    ? "It's a Draw"
    : game.winner
    ? `${game.winner} wins!`
    : `Turn: ${game.turn}`;

  // Generate the full HTML document as a string, including game board and message
  return `
    <!DOCTYPE html>
      <head>
        <style>
        .disabled {
          cursor: not-allowed;
          background-color: #fff;
        }
        .winner {
          background-color: #0f0;
        }
        td button {
          padding: 32px;
          font-size: 42px;
          width: 2em;
          height: 2em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        </style>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Tic Tac Toe</title>
        <link rel="stylesheet" href="https://www.membrane.io/light.css"></script>
      </head>
      <body>
        <div style="position: absolute; inset: 0px; display: flex; flex-direction: row; justify-content: center; align-items: center;">
          <div style="display: flex; flex-direction: column; align-items: center; max-width: 800px;">
            <section>
            <h2>Tic Tac Toe</h2>
            <div style="display:flex;padding-bottom: 10px;width: 99%;flex-direction: row-reverse;">
              <form action="/restart" method="POST">
                <button type="submit">Restart</button>
              </form>      
            </div>
            <table>
              ${board}
            </table>
            <div style="display:flex;font-size: x-large;padding-top: .5rem;justify-content: center;width: 100%;">
              <h1 style="margin: 0px;">${message}</h1>
            </div>
          </section>
          </div>
        </div>
      </body>
    </html>
  `;
}
