const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});

// var corsOptions = {
//   origin: "http://localhost:3001",
//   optionsSuccessStatus: 200, // For legacy browser support
// };
app.use("/static", express.static("./static/"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/index.html");
});
let rooms = 0;

class Player {
  #id;
  #name;
  #score;
  #turn;
  constructor() {
    this.#score = 0;
    this.#turn = false;
  }

  setId(id) {
    this.#id = id;
  }

  setTurn(turn) {
    this.#turn = turn;
  }

  swapTurn() {
    this.#turn = !this.#turn;
  }

  setName(name) {
    this.#name = name;
  }

  setScore(score) {
    this.#score = score;
  }

  incrScore(score) {
    this.#score = this.#score + score;
  }

  getTurn() {
    return this.#turn;
  }

  getId() {
    return this.#id;
  }

  getName() {
    return this.#name;
  }

  getScore() {
    return this.#score;
  }
}

class Game {
  #answerBoard;
  #questionBoard;
  constructor(answerBoard, questionBoard) {
    this.#answerBoard = answerBoard;
    this.#questionBoard = questionBoard;
  }
  setAnswerBoard(board) {
    this.#answerBoard = board;
  }

  setQuestionBoard(row, column, value) {
    this.#questionBoard[row][column] = value;
  }

  getAnswerBoard() {
    return this.#answerBoard;
  }

  getQuestionBoard() {
    return this.#questionBoard;
  }
  isGameOver() {
    return this.#questionBoard.every((item) => {
      return item.every((item2) => {
        return item2;
      });
    });
  }
}

let answerBoard = [
  [9, 5, 7, 1, 2, 4, 8, 6, 3],
  [1, 4, 8, 9, 3, 6, 7, 5, 2],
  [3, 2, 6, 8, 7, 5, 4, 1, 9],
  [8, 6, 2, 7, 9, 1, 3, 4, 5],
  [4, 7, 1, 3, 5, 8, 2, 9, 6],
  [5, 9, 3, 4, 6, 2, 1, 8, 7],
  [2, 1, 5, 6, 4, 7, 9, 3, 8],
  [6, 3, 4, 2, 8, 9, 5, 7, 1],
  [7, 8, 9, 5, 1, 3, 6, 2, 4],
];

let questionBoard = [
 [9, "", 7, "", 2, "", 8, 6, 3],
 ["", 4, 8, 9, 3, 6, "", "", 2],
 [3, 2, 6, "", 7, 5, 4, 1, ""],
 ["", "", "", 7, 9, "", "", "", 5],
 [4, 7, 1, 3, "", "", "", 9, ""],
 [5, "", 3, 4, 6, 2, "", "", 7],
 [2, "", 5, "", "", 7, 9, 3, ""],
 ["", 3, 4, 2, 8, 9, "", "", 1],
 [7, "", "", "", "", 3, 6, "", 4],
];
let game = new Game(answerBoard, questionBoard);
let player1 = new Player();
let player2 = new Player();

io.on("connection", (socket) => {
  socket.on("createGame", (data) => {
    socket.join(`room-${++rooms}`);
    socket.emit("newGame", { name: data.name, room: `room-${rooms}` });
    player1.setId(socket.id);
    player1.setName(data.name);
    player1.setTurn(true);
  });

  socket.on("joinGame", function (data) {
    if (socket.rooms.size === 1) {
      socket.join(data.room);
      player2.setId(socket.id);
      player2.setName(data.name);
      io.sockets.emit("player1", {
        name: player1.getName(),
        score: player1.getScore(),
      });
      io.sockets.emit("player2", {
        name: player2.getName(),
        score: player2.getScore(),
      });
      io.sockets.emit("getBoard", {
        board: game.getQuestionBoard(),
      });
    } else {
      socket.emit("err", { message: "Sorry, The room is full!" });
    }
  });

  socket.on("submitNumber", (data) => {
    let row = data.row;
    let column = data.column;
    let number = Number(data.number);
    let boardNumber = game.getAnswerBoard()[row][column];
    if (socket.id === player1.getId()) {
      if (player1.getTurn()) {
        if (game.getQuestionBoard()[row][column])
          return socket.emit("invalidBox");
        player1.swapTurn();
        player2.swapTurn();
        if (boardNumber === number) {
          game.setQuestionBoard(row, column, number);
          player1.incrScore(50);
          io.sockets.emit("player1CorrectNumber", {
            score: player1.getScore(),
            row: row,
            column: column,
            number: number,
          });
        } else
          io.sockets.emit("wrongNumber", {
            row: row,
            column: column,
            number: number,
          });
      } else socket.emit("notYourTurn");
    } else {
      if (player2.getTurn()) {
        if (game.getQuestionBoard()[row][column])
          return socket.emit("invalidBox");
        else {
          player1.swapTurn();
          player2.swapTurn();
        }
        if (boardNumber === number) {
          game.setQuestionBoard(row, column, number);
          player2.incrScore(50);
          io.sockets.emit("player2CorrectNumber", {
            score: player2.getScore(),
            row: row,
            column: column,
            number: number,
          });
        } else
          io.sockets.emit("wrongNumber", {
            row: row,
            column: column,
            number: number,
          });
      } else socket.emit("notYourTurn");
    }
    if (game.isGameOver()) {
      if (player1.getScore() > player2.getScore()) {
        io.to(player1.getId()).emit("winningGame");
        io.to(player2.getId()).emit("lostingGame");
      } else if (player1.getScore() < player2.getScore()) {
        io.to(player2.getId()).emit("winningGame");
        io.to(player1.getId()).emit("lostingGame");
      } else {
        io.sockets.emit("equalResult");
      }
    }
  });

  // socket.on("disconnect", () => {
  //   socket.broadcast.emit("userDisconnected");
  // });
});
