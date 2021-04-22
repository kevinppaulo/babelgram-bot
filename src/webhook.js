import { API_BASE_URL } from './constants.js'
import axios from 'axios';
import { getCommandAction, getOrCreateUserSettings } from './actions/actions.js';

// receives an endpoint such as /sendMessage and returns the whole uri.
const endpoint = (endpoint) => API_BASE_URL + process.env.BOT_TOKEN + '/' + endpoint;

async function onMessageReceived(req, res) {
	let message, chat, callback_data;
	if ('callback_query' in req.body) {
		callback_data = req.body.callback_query;
		message = callback_data.message;
		chat = message.chat;
	} else {
		try {
			message = req.body.message;
			chat = message.chat;
		} catch (e) {
			res.sendStatus(200);
			return null;
		}
	}

	const userSettings = await getOrCreateUserSettings(chat);
	getCommandAction({ message, callback_data })
		.then((action) => action({ message, callback_data }))
		.then(([answer, endpoint]) => reply(chat, answer, endpoint))
		.catch(console.error);

	res.sendStatus(200);
}

export async function reply(chat, answer, msgEndpoint) {
	if (Array.isArray(answer)) {
		for (const { audio } of answer) {
			const payload = { chat_id: chat.id, audio };
			console.log('replying with audio: ', payload);
			await axios.post(endpoint(msgEndpoint), payload);
		}
	} else {
		await axios.post(endpoint(msgEndpoint), {
			chat_id: chat.id,
			...answer,
		});
	}
}

export default onMessageReceived;
