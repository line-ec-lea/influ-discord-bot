import { Client as NotionClient } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { Hono } from "hono";
import * as v from "valibot";
import { formatProperty } from "./formatter";
import * as repo from "./repo";

interface NotionWebhookBody {
	data: PageObjectResponse;
}

const EnvSchema = v.object({
	DISCORD_BOT_TOKEN: v.string(),
	NOTION_API_KEY: v.string(),
	NOTION_MEMBER_DATABASE_ID: v.string(),
});

interface DiscordErrorResponse {
	code: number;
	message: string;
}

async function sendDiscordMessage(
	token: string,
	channelId: string,
	message: RESTPostAPIChannelMessageJSONBody,
) {
	const response = await fetch(
		`https://discord.com/api/v10/channels/${channelId}/messages`,
		{
			method: "POST",
			headers: {
				Authorization: `Bot ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		},
	);

	if (!response.ok) {
		const errorBody = (await response.json()) as DiscordErrorResponse;
		console.error(errorBody);

		throw new Error(
			`Discord API error: ${response.status} - ${errorBody.message}`,
		);
	}

	return response;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
	return c.json({ message: "ok" }, 200);
});

app.post("/:discordChannelId", async (c) => {
	const env = v.parse(EnvSchema, c.env);

	const title = c.req.query("title");
	const discordChannelId = c.req.param("discordChannelId");
	const body = await c.req.json<NotionWebhookBody>();

	const notionClient = new NotionClient({
		auth: env.NOTION_API_KEY,
	});
	const getDiscordUserIdByNotionUserId = (notionUserId: string) => {
		return repo.getDiscordUserIdByNotionUserId(
			notionClient,
			env.NOTION_MEMBER_DATABASE_ID,
			notionUserId,
		);
	};

	const formattedProperties = (
		await Promise.all(
			Object.entries(body.data.properties).map(
				async ([key, property]) =>
					`${key}: ${await formatProperty(getDiscordUserIdByNotionUserId, property)}`,
			),
		)
	).join("\n");

	await sendDiscordMessage(env.DISCORD_BOT_TOKEN, discordChannelId, {
		content: [
			title,
			formattedProperties || "[No properties to display]",
			body.data.url,
		]
			.filter(Boolean)
			.join("\n"),
	});

	return c.body(null, 204);
});

export default app;
