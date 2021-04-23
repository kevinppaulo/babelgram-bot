import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import onMessageReceived from './webhook.js';

// config
dotenv.config();
const app = express();
const appSecretToken = process.env.WEBHOOK_SECRET;
app.use(bodyParser.json());

// start listenning
app.listen(process.env.APP_PORT, () => {
	console.log(`Example app listening at http://localhost:${process.env.APP_PORT}`);
});

// endpoints
app.post('/' + appSecretToken + '/update', onMessageReceived);

app.use(express.static('./media/synthesized/'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/src/index.html'));
});
