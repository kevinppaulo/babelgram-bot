import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import onMessageReceived from "./webhook.js";
import path from "path";
import fs, { copyFileSync } from 'fs';
import {log} from 'mustang-log';

// config
dotenv.config();
const app = express();
const appSecretToken = process.env.WEBHOOK_SECRET;
const rootPath = path.resolve(process.cwd());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// start listenning
app.listen(process.env.PORT, () => {
    log(`Example app listening at http://localhost:${process.env.PORT}`, "INFO", true);
});

// endpoints
app.post("/" + appSecretToken + "/update", onMessageReceived);

app.use(express.static("./public"));

app.get("/", function (req, res) {
    const path = `${rootPath}/public/static/index.html`;
    res.sendFile(path);
});

app.get("/challenge", function (req, res) {
    const path = `${rootPath}/public/static/security-code.html`;
    res.sendFile(path);
});

app.post("/challenge", function (req, res) {
  const securityCode = req.body.code;
  const cwd = process.cwd();
  const filepath = cwd + '/security-code.txt'
  fs.writeFileSync(filepath, securityCode);
  const path = `${rootPath}/public/static/security-code.html`;
  res.sendFile(path);
});
