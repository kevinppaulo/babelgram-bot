import jsonCache from "../redis.js";

async function promptPreferredVoice({message, callback_data}) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);

	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setvoice",
	});

	return [{
		text: "Choose a voice",
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "Male", callback_data: "male" },
					{ text: "Female", callback_data: "female" },
				],
			],
		},
	}, 'sendMessage'];
}

export default promptPreferredVoice;
