import jsonCache from "../redis.js";
import { availableLanguages } from "../constants.js";

function userLanguagesToButtons() {
	return Object.keys(availableLanguages).map((languageName) => {
		return [{ text: languageName, callback_data: availableLanguages[languageName] }];
	});
}

async function promptUserLanguage({ message }) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setmylanguage",
	});

	return [
		{
			text: "Choose a language",
			reply_markup: {
				inline_keyboard: userLanguagesToButtons(),
			},
		},
		"sendMessage",
	];
}

export default promptUserLanguage;
