import type {
	PageObjectResponse,
	PartialUserObjectResponse,
	UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { Hono } from "hono";
import { Client as NotionClient } from "@notionhq/client";
import * as v from "valibot";
import * as notion from "./notion";

type RemoveId<T> = T extends unknown ? Omit<T, "id"> : never;
type Property = PageObjectResponse["properties"][number];

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

async function formatPerson(
	getDiscordUserIdByNotionUserId: notion.GetDiscordUserIdByNotionUserId,
	person: PartialUserObjectResponse | UserObjectResponse,
): Promise<string> {
	if (!("type" in person)) {
		return person.id;
	}

	const discordUserId = await getDiscordUserIdByNotionUserId(person.id);
	if (!discordUserId) {
		return person.name ?? person.id;
	}

	return `<@${discordUserId}>`;
}

async function formatProperty(
	getDiscordUserIdByNotionUserId: notion.GetDiscordUserIdByNotionUserId,
	property: RemoveId<Property>,
): Promise<string> {
	switch (property.type) {
		case "title":
			return (
				property.title.map((title) => title.plain_text).join("") ||
				"[Empty Title]"
			);
		case "rich_text":
			return (
				property.rich_text.map((text) => text.plain_text).join("") ||
				"[Empty Text]"
			);
		case "url":
			return property.url ?? "[No URL]";
		case "select":
			return property.select?.name ?? "[No Selection]";
		case "multi_select":
			return (
				property.multi_select?.map((select) => select.name).join(", ") ||
				"[No Selections]"
			);
		case "date":
			if (!property.date) return "[No Date]";
			return property.date.end
				? `${property.date.start} - ${property.date.end}`
				: (property.date.start ?? "[Invalid Date]");
		case "checkbox":
			return property.checkbox ? "✅" : "❌";
		case "email":
			return property.email ?? "[No Email]";
		case "phone_number":
			return property.phone_number ?? "[No Phone]";
		case "number":
			return property.number?.toString() ?? "[No Number]";
		case "status":
			return property.status?.name ?? "[No Status]";
		case "created_time":
			return property.created_time ?? "[No Time]";
		case "last_edited_time":
			return property.last_edited_time ?? "[No Time]";
		case "created_by":
			return await formatPerson(
				getDiscordUserIdByNotionUserId,
				property.created_by,
			);
		case "last_edited_by":
			return await formatPerson(
				getDiscordUserIdByNotionUserId,
				property.last_edited_by,
			);
		case "unique_id":
			return property.unique_id.number === null
				? "[No ID]"
				: property.unique_id.prefix === null
					? property.unique_id.number.toString()
					: `${property.unique_id.prefix}-${property.unique_id.number}`;
		case "relation":
			return (
				property.relation.map((relation) => relation.id).join(", ") ||
				"[No Relations]"
			);
		case "people":
			return (
				(
					await Promise.all(
						property.people.map((person) =>
							formatPerson(getDiscordUserIdByNotionUserId, person),
						),
					)
				).join(", ") || "[No People]"
			);
		case "rollup":
			switch (property.rollup.type) {
				case "number":
					return property.rollup.number?.toString() ?? "[No Rollup Number]";
				case "date":
					return property.rollup.date?.start
						? `${property.rollup.date.start} - ${property.rollup.date.end}`
						: (property.rollup.date?.start ?? "[Invalid Date]");
				case "array":
					return (
						(
							await Promise.all(
								property.rollup.array?.map((value) =>
									formatProperty(getDiscordUserIdByNotionUserId, value),
								),
							)
						).join(", ") || "[Empty Rollup Array]"
					);
				default:
					return "[Unsupported Rollup Type]";
			}
		default:
			return `[Unsupported Type: ${JSON.stringify(property, null, 2)}]`;
	}
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

	const getDiscordUserIdByNotionUserId = (notionUserId: string) => {
		const notionClient = new NotionClient({
			auth: env.NOTION_API_KEY,
		});

		return notion.getDiscordUserIdByNotionUserId(
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
