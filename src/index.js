const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const user = users.find((user) => user.username == request.headers.username);
  if (!user) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }
  next();
}

function validateUsername(request, response, next) {
  if (users.find((user) => user.username == request.body.username)) {
    return response.status(400).json({ error: "Username já existe" });
  }
  next();
}

app.post("/users", validateUsername, (request, response) => {
  const { name, username } = request.body;
  const user = createUser(name, username);
  users.push(user);
  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const filteredUser = getUserByUserName(username);
  return response.status(201).json(filteredUser.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;
  const todo = createTODO(title, deadline);
  pushTODOByUsername(username, todo);
  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  const { title, deadline } = request.body;
  try {
    updateTODOTitleById(username, title, id);
    updateTODODeadlineById(username, deadline, id);
    return response.status(200).json(getTODOSFromUser(username, id));
  } catch (err) {
    return response.status(404).json({ error: "TODO não encontrado" });
  }
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;
  try {
    updateTODOToDone(username, id);
    return response.status(200).json(getTODOSFromUser(username, id));
  } catch (err) {
    return response.status(404).json({ error: "TODO não encontrado" });
  }
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;
  try {
    deleteTODOById(username, id);
    return response.status(204).json();
  } catch (err) {
    return response.status(404).json({ error: "TODO não encontrado" });
  }
});

function createUser(name, username) {
  return { id: uuidv4(), name, username, todos: [] };
}

function getUserByUserName(username) {
  return users.find((user) => user.username == username);
}

function getTODOSFromUser(username, id) {
  return users
    .find((user) => user.username == username)
    .todos.find((candidateTODO) => candidateTODO.id == id);
}

function pushTODOByUsername(username, todo) {
  users.find((user) => user.username == username).todos.push(todo);
}

function updateTODOTitleById(username, title, id) {
  users
    .find((user) => user.username == username)
    .todos.find((candidateTODO) => candidateTODO.id == id).title = title;
}

function updateTODODeadlineById(username, deadline, id) {
  users
    .find((user) => user.username == username)
    .todos.find((candidateTODO) => candidateTODO.id == id).deadline = new Date(
    deadline
  );
}

function updateTODOToDone(username, id) {
  users
    .find((user) => user.username == username)
    .todos.find((candidateTODO) => candidateTODO.id == id).done = true;
}

function deleteTODOById(username, id) {
  const index = users
    .find((user) => user.username == username)
    .todos.findIndex((candidateTODO) => candidateTODO.id == id);
  if (index == -1) {
    throw "TODO não encontrado";
  }
  users.find((user) => user.username == username).todos.splice(index, 1);
}

function createTODO(title, deadline) {
  return {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
}

module.exports = app;
