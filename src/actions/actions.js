import Redis from "ioredis";
import JSONCache from "redis-json";

const redis = new Redis();
const jsonCache = new JSONCache(redis, { prefix: "cache" });
const filterBotCommand = (entity) => entity.type == "bot_command";

function checkMultipleCommandEntities(message) {
	if ("entities" in message) return message.entities.filter(filterBotCommand).length > 1;
	return false;
}

function extractCommand(message) {
	if (!("entities" in message)) return "";
	const [command] = message.entities.filter(filterBotCommand);
	const { offset, length } = command;
	return message.text.slice(offset, length + offset);
}

export async function getCommandAction({ message, callback_data }) {
	if (checkMultipleCommandEntities(message)) return noMultipleCommandsAnswer;

	const command = extractCommand(message);
	if (command == "/setvideolanguage") return promptVideoLanguage;
	else if (command == "/setmylanguage") return promptUserLanguage;
	else if (command == "/setvoice") return promptPreferredVoice;
	else return invalidCommand;
}

async function promptPreferredVoice(message) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);

	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setvoice",
	});

	return {
		text: "Choose a voice",
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "Male", callback_data: "male" },
					{ text: "Female", callback_data: "female" },
				],
			],
		},
	};
}

async function promptUserLanguage(message) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setmylanguage",
	});

	return {
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
	};
}

async function promptVideoLanguage(message) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: "/setvideolanguage",
	});

	return {
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
	};
}

async function invalidCommand(message) {
	return { text: "That's not a valid command." };
}

async function changeVideoLanguage(message) {
	return { text: "Video language set." };
}

async function changeUserLanguage(message) {
	return { text: "Your preferred language was set." };
}

async function setPreferredVoice(message) {
	return { text: "Your preferred voice was set." };
}

async function noMultipleCommandsAnswer() {
	return {
		text: "You can't send multiple commands.",
	};
}

export async function getOrCreateUserSettings(chat) {
	let userSettings = await jsonCache.get(chat.id);

	if (!userSettings) {
		userSettings = {
			videoLang: "en-US",
			targetLang: "pt-BR",
			lastCommand: null,
			preferredVoice: "female",
		};
		await jsonCache.set(chat.id, userSettings);
	}

	return userSettings;
}
