const httpServer = require("http").createServer();
const PORT = process.env.PORT || 3000;
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
});

const users = [];
const messages = [];
io.on("connection", (socket) => {
  socket.on("register", (user) => {
    console.log("connected User:", user);
    if (users.find((u) => u.email === user.email)) {
      return socket.emit("already-exist", {
        message: "Email Id Already Register !",
      });
    }
    if (users.find((u) => u.name === user.name)) {
      return socket.emit("already-exist", {
        message: "User Name Already Taken !",
      });
    }
    socket.join(user.name);
    socket.username = user.name;
    socket.emit("already-exist", false);
    user.active = true;
    users.push(user);
    socket.emit("login-user", user);
    socket.emit("users", users);
    socket.broadcast.emit("connected user", user);
  });

  socket.on("login", (user) => {
    const index = users.findIndex(
      (u) => u.email === user.email && u.password === user.password
    );

    if (index !== -1) {
      socket.emit("already-exist", false);
      user.active = true;
      socket.username = users[index].name;
      socket.join(users[index].name);
      users[index].active = true;
      socket.emit("login-user", users[index]);
      socket.emit("users", users);
      socket.broadcast.emit("reconnected user", users[index].name);
    } else {
      socket.emit("already-exist", {
        message: "email or password invalid !",
      });
    }
  });

  socket.on("private message", (data) => {
    const id = data.to > data.from ? data.to + data.from : data.from + data.to;
    const index = messages.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      messages[index].message.push(data.message);
    } else {
      messages.push({ id: id, message: [data.message] });
    }
    socket.to(data.to).emit("private-message", {
      message: data.message,
      senderName: data.from,
    });
  });

  socket.on("get conversation", (data) => {
    const id = data.to > data.from ? data.to + data.from : data.from + data.to;
    const message = messages.find((msg) => msg.id === id);
    socket.emit("get conversation", message);
  });

  socket.on("typing", ({ to, type }) => {
    socket
      .to(to)
      .emit("typing", { typierName: socket.username, isTyping: type });
  });

  socket.on("disconnect", () => {
    users.forEach((user) => {
      if (user.name === socket.username) {
        user.active = false;
      }
    });
    socket.broadcast.emit("disconnect user", socket.username);
  });
});

httpServer.listen(PORT, () => {
  console.log(`server Running on http://localhost:${PORT} `);
});
