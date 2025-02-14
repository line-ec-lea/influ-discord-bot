import { Command, register } from "discord-hono";

const commands = [
	new Command("in", "出勤する（in）").name_localizations({
		ja: "出勤",
	}),
	new Command("out", "退勤する（out）").name_localizations({
		ja: "退勤",
	}),
	new Command("bi", "休憩を開始する（bi）").name_localizations({
		ja: "休憩開始",
	}),
	new Command("bo", "休憩を終了する（bo）").name_localizations({
		ja: "休憩終了",
	}),
];

register(
	commands,
	process.env.DISCORD_APPLICATION_ID,
	process.env.DISCORD_BOT_TOKEN,
	//process.env.DISCORD_TEST_GUILD_ID,
);
