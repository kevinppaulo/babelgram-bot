import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import onMessageReceived from "./webhook.js";
import path from "path";

// config
dotenv.config();
const app = express();
const appSecretToken = process.env.WEBHOOK_SECRET;
const rootPath = path.resolve(process.cwd());

app.use(bodyParser.json());

// start listenning
app.listen(process.env.PORT, () => {
    console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

// endpoints
app.post("/" + appSecretToken + "/update", onMessageReceived);

app.use(express.static("./media/synthesized/"));

app.get("/", function (req, res) {
    const path = `${rootPath}/src/index.html`;
    res.sendFile(path);
});
