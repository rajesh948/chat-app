const httpServer = require("http").createServer();
const PORT = process.env.PORT || 3000;
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ["http://localhost:8080"],
  },
});

const users = [];
const messages = [];
const groups = [];
let jointRoom = [];
io.on("connection", (socket) => {
  socket.on("register", (user) => {
    console.log("register user::", user);
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
    console.log("lOGIN:::", socket.rooms.has("rajesh"));
    console.log("rooms####:::", io.sockets.adapter.rooms);
    const index = users.findIndex(
      (u) => u.email === user.email && u.password === user.password
    );

    if (index !== -1) {
      socket.emit("already-exist", false);
      user.active = true;
      socket.username = users[index].name;
      const joinGroups = users[index].groups
        ? groups.filter((group) => users[index].groups.includes(group.name))
        : [];
      jointRoom = joinGroups.map((group) => group.name);
      jointRoom.push(users[index].name);
      socket.join(jointRoom);

      users[index].active = true;
      socket.emit("login-user", users[index]);
      socket.emit("users", [...users, ...joinGroups]);
      socket.broadcast.emit("reconnected user", users[index].name);
    } else {
      socket.emit("already-exist", {
        message: "email or password invalid !",
      });
    }
  });

  socket.on("private message", (data) => {
    const id = groups.find((g) => g.name === data.to)
      ? data.to
      : data.to > data.from
      ? data.to + data.from
      : data.from + data.to;
    const sender = groups.find((g) => g.name === data.to) ? data.to : data.from;

    const index = messages.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      messages[index].message.push(data.message);
    } else {
      messages.push({ id: id, message: [data.message] });
    }
    socket.to(data.to).emit("private-message", {
      message: data.message,
      senderName: sender,
    });
  });

  socket.on("get conversation", (data) => {
    let id = data.to > data.from ? data.to + data.from : data.from + data.to;
    if (groups.find((g) => g.name === data.to)) {
      id = data.to;
    }
    const message = messages.find((msg) => msg.id === id);
    socket.emit("get conversation", message);
  });

  socket.on("typing", ({ to, type }) => {
    if (!groups.length || groups.find((g) => g.name !== to))
      socket
        .to(to)
        .emit("typing", { typierName: socket.username, isTyping: type });
  });

  socket.on("create group", (group) => {
    socket.join(group.name);
    users.forEach((user) => {
      if (group.members.includes(user.name) || user.name === socket.name) {
        user.groups
          ? user.groups.push(group.name)
          : (user.groups = [group.name]);
      }
    });
    groups.push(group);
    socket.to(group.members).emit("create group", group);
  });

  socket.on("join group", (groupName) => {
    console.log(socket.username, "join", groupName);
    socket.join(groupName);
  });

  socket.on("disconnect", async () => {
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
