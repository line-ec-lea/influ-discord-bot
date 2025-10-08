import { Client as NotionClient } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
	ButtonStyle,
	ComponentType,
	RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";
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
		const errorBody = await response.text();
		console.error(errorBody);

		throw new Error(`Discord API error: ${response.status}`, {
			cause: errorBody,
		});
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

	const getDiscordUserIdByNotionUserId = async (notionUserId: string) => {
		const cached = await c.env.NOTION_MEMBERS.get(notionUserId);
		if (cached) {
			return cached;
		}

		const discordUserId = await repo.getDiscordUserIdByNotionUserId(
			notionClient,
			env.NOTION_MEMBER_DATABASE_ID,
			notionUserId,
		);

		if (!discordUserId) {
			return;
		}

		await c.env.NOTION_MEMBERS.put(notionUserId, discordUserId, {
			expirationTtl: 60 * 60, // 1 hour
		});

		return discordUserId;
	};

	const fields = await Promise.all(
		Object.entries(body.data.properties).map(async ([key, property]) => ({
			name: key,
			value: await formatProperty(getDiscordUserIdByNotionUserId, property),
			inline: true,
		})),
	);

	await sendDiscordMessage(env.DISCORD_BOT_TOKEN, discordChannelId, {
		embeds: [
			{
				title,
				color: 0xad7f4b,
				url: body.data.url,
				fields,
			},
		],
		components: [
			{
				type: 1 satisfies ComponentType.ActionRow,
				components: [
					{
						type: 2 satisfies ComponentType.Button,
						label: "Notionで開く",
						style: 5 satisfies ButtonStyle.Link,
						url: body.data.url,
					},
				],
			},
		],
	});

	return c.body(null, 204);
});

export default app;
