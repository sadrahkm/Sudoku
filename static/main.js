/* eslint-disable no-undef */
$(document).ready(function () {
  function sendMessageIndex(message) {
    $("#room-message").removeClass("hidden");
    $("#room-message").addClass("block");
    $("#room-message p").html(message);
  }

  function sendMessageGame(message) {
    $("#game-message").removeClass("hidden");
    $("#game-message").addClass("block");
    $("#game-message p").text(message);
  }

  function hideMessageGame() {
    $("#game-message").removeClass("block");
    $("#game-message").addClass("hidden");
    $("#game-message p").text("");
  }

  const socket = io.connect("http://localhost:3000");
  $("#create").click((event) => {
    event.preventDefault();
    let name = $("#createName").val();
    if (!name) return sendMessageIndex(`Please enter your name`);
    socket.emit("createGame", { name: name });
  });

  $("#join").click((event) => {
    event.preventDefault();
    let name = $("#joinName").val();
    let roomNumber = $("#roomNumber").val();
    if (!name || !roomNumber)
      return sendMessageIndex(`Please enter your name or room number`);
    socket.emit("joinGame", { name: name, room: roomNumber });
  });

  $("#sendBtn").click((event) => {
    event.preventDefault();
    let row = $("#row").val();
    let column = $("#column").val();
    let number = $("#numberValue").val();
    if (!row || !column || !number)
      return sendMessageGame(`Please enter required fields`);
    socket.emit("submitNumber", { row: row, column: column, number: number });
  });

  socket.on("newGame", (data) => {
    sendMessageIndex(`Hello ${data.name}, Your room is: ${data.room}`);
  });

  socket.on("player1", (data) => {
    $("#player1Wrapper").find("h3").text(data.name);
    $("#player1Wrapper").find("p > span").text(data.score);
  });

  socket.on("player2", (data) => {
    $("#player2Wrapper").find("h3").text(data.name);
    $("#player2Wrapper").find("p > span").text(data.score);
  });

  socket.on("getBoard", (data) => {
    $("#board").css("display", "block");
    $("#welcome").css("display", "none");
    data.board.map((arrayItem, arrayIndex) => {
      arrayItem.map((item, index) => {
        $("#boardWrapper").append(`
        <button id="btn-${
          arrayIndex + "" + index
        }" class="bg-primary rounded-md bg-opacity-50 w-14 h-14 mb-1 -mr-1 flex justify-center items-center">
        <span class="text-gray-700 font-bold text-2xl">${item}</span>
        </button>
        `);
      });
    });
  });

  socket.on("player1CorrectNumber", (data) => {
    $(`#btn-${data.row + "" + data.column} span`).text(data.number);
    $(`#btn-${data.row + "" + data.column}`).removeClass("bg-primary");
    $(`#btn-${data.row + "" + data.column}`).removeClass("bg-opacity-50");
    $(`#btn-${data.row + "" + data.column}`).addClass("bg-green-400");
    $("#player1Wrapper p > span").text(data.score);
  });
  socket.on("player2CorrectNumber", (data) => {
    $(`#btn-${data.row + "" + data.column} span`).text(data.number);
    $(`#btn-${data.row + "" + data.column}`).removeClass("bg-primary");
    $(`#btn-${data.row + "" + data.column}`).removeClass("bg-opacity-50");
    $(`#btn-${data.row + "" + data.column}`).addClass("bg-secondary");
    $("#player2Wrapper p > span").text(data.score);
  });
  socket.on("wrongNumber", (data) => {
    $(`#btn-${data.row + "" + data.column} span`).text(data.number);
    $(`#btn-${data.row + "" + data.column}`).removeClass("bg-primary");
    $(`#btn-${data.row + "" + data.column}`).addClass("bg-red-800");
    setTimeout(() => {
      $(`#btn-${data.row + "" + data.column} span`).text("");
      $(`#btn-${data.row + "" + data.column}`).removeClass("bg-red-800");
      $(`#btn-${data.row + "" + data.column}`).addClass("bg-primary");
    }, 3000);
  });

  socket.on("invalidBox", () => {
    sendMessageGame("The box you've selected already has a value");
    setTimeout(() => {
      hideMessageGame();
    }, 3000);
  });

  socket.on("winningGame", () => {
    sendMessageGame("Congrats ! You won the game");
  });
  socket.on("lostingGame", () => {
    sendMessageGame("Sorry ! You lost the game ");
  });
  socket.on("equalResult", () => {
    sendMessageGame("Equal Results");
  });

  socket.on("notYourTurn", () => {
    sendMessageGame("It's not your turn");
    setTimeout(() => {
      hideMessageGame();
    }, 3000);
  });

  // socket.on("userDisconnected", () => {
  //   alert("Your competitor has left the game");
  //   window.location.reload();
  // });
});
