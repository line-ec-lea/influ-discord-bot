import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";

export default function App() {
	const [discordChannelId, setDiscordChannelId] = useState("");
	const [title, setTitle] = useState("");
	const [isGuideExpanded, setIsGuideExpanded] = useState(false);

	const generateUrl = () => {
		if (!discordChannelId) {
			return "";
		}
		const baseUrl = window.location.origin;
		const url = new URL(`/${discordChannelId}`, baseUrl);
		if (title.trim()) {
			url.searchParams.set("title", title.trim());
		}
		return url.toString();
	};

	const url = generateUrl();

	const validateChannelId = (id: string): boolean => {
		if (!id.trim()) return false;
		// DiscordのチャンネルIDは数字のみで、通常17-19桁
		return /^\d{17,19}$/.test(id.trim());
	};

	const isValidChannelId = validateChannelId(discordChannelId);

	const copyToClipboard = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
		} catch (err) {
			console.error("コピーに失敗しました:", err);
		}
	};

	return (
		<div
			style={{
				padding: "2rem",
				maxWidth: "800px",
				margin: "0 auto",
				lineHeight: "1.6",
			}}
		>
			<h1
				style={{
					marginBottom: "0.5rem",
					fontSize: "2rem",
					fontWeight: "bold",
					textAlign: "center",
				}}
			>
				NotionからDiscord通知の設定
			</h1>
			<p
				style={{
					color: "#666",
					marginBottom: "2.5rem",
					fontSize: "1rem",
					textAlign: "center",
				}}
			>
				DiscordチャンネルIDを入力して、Webhook URLを生成してください
			</p>

			{/* メインカード: Webhook URL生成フォーム */}
			<section
				style={{
					marginBottom: "2.5rem",
					backgroundColor: "#fff",
					padding: "2rem",
					borderRadius: "12px",
					border: "2px solid #5865F2",
					boxShadow: "0 4px 12px rgba(88, 101, 242, 0.15)",
				}}
			>
				<h2
					style={{
						fontSize: "1.5rem",
						fontWeight: "bold",
						marginBottom: "1.5rem",
						color: "#5865F2",
					}}
				>
					Webhook URL生成
				</h2>

				<div style={{ marginBottom: "1.5rem" }}>
					<label
						htmlFor="discord-channel-id"
						style={{
							display: "block",
							marginBottom: "0.5rem",
							fontWeight: "bold",
							fontSize: "1rem",
						}}
					>
						DiscordチャンネルID <span style={{ color: "red" }}>*</span>
					</label>
					<input
						id="discord-channel-id"
						type="text"
						value={discordChannelId}
						onInput={(e) => {
							const target = e.currentTarget as HTMLInputElement;
							if (target) {
								setDiscordChannelId(target.value);
							}
						}}
						placeholder="例: 1328948311809589312"
						style={{
							width: "100%",
							padding: "0.75rem",
							border: `1px solid ${
								discordChannelId && !isValidChannelId ? "#dc3545" : "#ccc"
							}`,
							borderRadius: "6px",
							fontSize: "1rem",
							boxSizing: "border-box",
						}}
					/>
					{discordChannelId && !isValidChannelId && (
						<p
							style={{
								color: "#dc3545",
								fontSize: "0.875rem",
								marginTop: "0.5rem",
								marginBottom: 0,
							}}
						>
							チャンネルIDは17-19桁の数字で入力してください
						</p>
					)}
				</div>

				<div style={{ marginBottom: "1.5rem" }}>
					<label
						htmlFor="title"
						style={{
							display: "block",
							marginBottom: "0.5rem",
							fontWeight: "bold",
							fontSize: "1rem",
						}}
					>
						タイトル（オプション）
					</label>
					<input
						id="title"
						type="text"
						value={title}
						onInput={(e) => {
							const target = e.currentTarget as HTMLInputElement;
							if (target) {
								setTitle(target.value);
							}
						}}
						placeholder="例: おすすめの本が追加されました"
						style={{
							width: "100%",
							padding: "0.75rem",
							border: "1px solid #ccc",
							borderRadius: "6px",
							fontSize: "1rem",
							boxSizing: "border-box",
						}}
					/>
				</div>

				<div
					style={{
						marginTop: "1.5rem",
						padding: "1.25rem",
						backgroundColor: "#f8f9fa",
						borderRadius: "8px",
						border: "1px solid #e0e0e0",
					}}
				>
					<p
						style={{
							fontWeight: "bold",
							marginBottom: "0.75rem",
							fontSize: "0.95rem",
							color: "#333",
						}}
					>
						生成されたWebhook URL:
					</p>
					<code
						style={{
							display: "block",
							padding: "0.875rem",
							backgroundColor: "#fff",
							borderRadius: "6px",
							fontSize: "0.9rem",
							wordBreak: "break-all",
							marginBottom: "1rem",
							border: "1px solid #ddd",
							fontFamily: "monospace",
							minHeight: "2.5rem",
							color: url ? "#333" : "#999",
						}}
					>
						{url || "チャンネルIDを入力してください"}
					</code>
					<button
						type="button"
						onClick={copyToClipboard}
						disabled={!url}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: url ? "#5865F2" : "#ccc",
							color: "white",
							border: "none",
							borderRadius: "6px",
							cursor: url ? "pointer" : "not-allowed",
							fontSize: "1rem",
							fontWeight: "bold",
							width: "100%",
							transition: "background-color 0.2s",
						}}
						onMouseOver={(e) => {
							if (!url) return;
							const target = e.currentTarget as HTMLButtonElement;
							if (target) {
								target.style.backgroundColor = "#4752C4";
							}
						}}
						onMouseOut={(e) => {
							if (!url) return;
							const target = e.currentTarget as HTMLButtonElement;
							if (target) {
								target.style.backgroundColor = "#5865F2";
							}
						}}
						onFocus={(e) => {
							if (!url) return;
							const target = e.currentTarget as HTMLButtonElement;
							if (target) {
								target.style.backgroundColor = "#4752C4";
							}
						}}
						onBlur={(e) => {
							if (!url) return;
							const target = e.currentTarget as HTMLButtonElement;
							if (target) {
								target.style.backgroundColor = "#5865F2";
							}
						}}
					>
						URLをコピー
					</button>
				</div>
			</section>

			{/* 参考情報: 折りたたみ可能なセクション */}
			<section
				style={{
					marginBottom: "2rem",
					backgroundColor: "#f8f9fa",
					borderRadius: "8px",
					border: "1px solid #e0e0e0",
					overflow: "hidden",
				}}
			>
				<button
					type="button"
					onClick={() => setIsGuideExpanded(!isGuideExpanded)}
					style={{
						width: "100%",
						padding: "1rem 1.5rem",
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						fontSize: "1.1rem",
						fontWeight: "bold",
						color: "#333",
					}}
				>
					<span>設定手順を見る</span>
					<span style={{ fontSize: "1.2rem" }}>
						{isGuideExpanded ? "▼" : "▶"}
					</span>
				</button>

				{isGuideExpanded && (
					<div style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
						<div style={{ marginBottom: "2rem" }}>
							<h3
								style={{
									fontSize: "1.1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#555",
								}}
							>
								1. 開発者モードを有効化
							</h3>
							<p
								style={{
									color: "#666",
									marginBottom: "0.75rem",
									fontSize: "0.95rem",
								}}
							>
								Discordの設定から開発者モードを有効化してください。
							</p>
							<img
								src="/enable-developer-mode.gif"
								alt="開発者モードを有効化する手順"
								style={{
									maxWidth: "100%",
									height: "auto",
									border: "1px solid #ddd",
									borderRadius: "6px",
								}}
							/>
						</div>

						<div style={{ marginBottom: "2rem" }}>
							<h3
								style={{
									fontSize: "1.1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#555",
								}}
							>
								2. チャンネルIDをコピー
							</h3>
							<p
								style={{
									color: "#666",
									marginBottom: "0.75rem",
									fontSize: "0.95rem",
								}}
							>
								通知を送信したいDiscordチャンネルで、チャンネル名を右クリックして「IDをコピー」を選択してください。
							</p>
							<img
								src="/copy-channel-id.gif"
								alt="チャンネルIDをコピーする手順"
								style={{
									maxWidth: "100%",
									height: "auto",
									border: "1px solid #ddd",
									borderRadius: "6px",
								}}
							/>
						</div>

						<div style={{ marginBottom: "2rem" }}>
							<h3
								style={{
									fontSize: "1.1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#555",
								}}
							>
								3. Botをチャンネルに招待（プライベートチャンネルの場合）
							</h3>
							<p
								style={{
									color: "#666",
									marginBottom: "0.75rem",
									fontSize: "0.95rem",
								}}
							>
								プライベートチャンネルを使用する場合は、INFLU
								Botをチャンネルに招待してください。
							</p>
							<img
								src="/invite-bot-to-channel.gif"
								alt="INFLU Botをチャンネルに招待する手順"
								style={{
									maxWidth: "100%",
									height: "auto",
									border: "1px solid #ddd",
									borderRadius: "6px",
								}}
							/>
						</div>

						<div>
							<h3
								style={{
									fontSize: "1.1rem",
									fontWeight: "bold",
									marginBottom: "0.75rem",
									color: "#555",
								}}
							>
								4. NotionでWebhook URLを設定
							</h3>
							<p
								style={{
									color: "#666",
									marginBottom: "0.75rem",
									fontSize: "0.95rem",
								}}
							>
								上記のフォームで生成したWebhook
								URLを、NotionのWebhook設定に貼り付けてください。
							</p>
							<img
								src="/configure-notion-automation.gif"
								alt="NotionでWebhook URLを設定する手順"
								style={{
									maxWidth: "100%",
									height: "auto",
									border: "1px solid #ddd",
									borderRadius: "6px",
								}}
							/>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	render(<App />, root);
}
