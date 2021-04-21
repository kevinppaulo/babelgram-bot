import jsonCache from "../redis.js";

async function promptUserLanguage({ message }) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setmylanguage",
	});

	return [{
		text: "Choose a language",
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "Português (Brasil)", callback_data: "pt-BR" },
					{ text: "English", callback_data: "en-US" },
				],
				[
					{ text: "Deutsch", callback_data: "de" },
					{ text: "Росски", callback_data: "ru" },
				],
			],
		},
	}, 'sendMessage'];
}

export default promptUserLanguage;
