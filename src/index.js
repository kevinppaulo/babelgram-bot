import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import onMessageReceived from './webhook.js';

// config
dotenv.config();
const app = express();
const appSecretToken = process.env.WEBHOOK_SECRET;
app.use(bodyParser.json());

// endpoints
app.post('/' + appSecretToken + '/update', onMessageReceived);

// start listenning
app.listen(process.env.APP_PORT, () => {
	console.log(
		`Example app listening at http://localhost:${process.env.APP_PORT}`
	);
});
