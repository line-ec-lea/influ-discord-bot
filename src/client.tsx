import { useCallback, useEffect, useMemo, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";

const validateChannelId = (id: string): boolean => {
	if (!id.trim()) return false;
	// DiscordのチャンネルIDは数字のみで、通常17-19桁
	return /^\d{17,19}$/.test(id.trim());
};

export default function App() {
	const [discordChannelId, setDiscordChannelId] = useState("");
	const [title, setTitle] = useState("");
	const [isGuideExpanded, setIsGuideExpanded] = useState(false);
	const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
		"idle",
	);

	const normalizedChannelId = discordChannelId.trim();
	const normalizedTitle = title.trim();

	const isValidChannelId = useMemo(
		() => validateChannelId(normalizedChannelId),
		[normalizedChannelId],
	);

	const url = useMemo(() => {
		if (!isValidChannelId) return "";
		const baseUrl = window.location.origin;
		const generated = new URL(`/${normalizedChannelId}`, baseUrl);
		if (normalizedTitle) {
			generated.searchParams.set("title", normalizedTitle);
		}
		return generated.toString();
	}, [isValidChannelId, normalizedChannelId, normalizedTitle]);

	const copyToClipboard = useCallback(async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			setCopyState("copied");
		} catch (err) {
			console.error("コピーに失敗しました:", err);
			setCopyState("failed");
		}
	}, [url]);

	// Reset copy state after delay
	useEffect(() => {
		if (copyState === "idle") return;

		const timeoutId = window.setTimeout(
			() => setCopyState("idle"),
			copyState === "copied" ? 1500 : 2000,
		);

		return () => window.clearTimeout(timeoutId);
	}, [copyState]);

	return (
		<div
			className="app"
			style={{
				padding: "var(--page-padding)",
				maxWidth: "800px",
				margin: "0 auto",
				lineHeight: "1.6",
			}}
		>
			<style>
				{`
.app{
  --page-padding: 2rem;
  --h1-size: 2rem;
  --lead-size: 1rem;
  --card-padding: 2rem;
  --card-margin-bottom: 2.5rem;
  --card-title-size: 1.5rem;
  --card-title-margin: 1.5rem;
  --field-gap: 1rem;
  --url-gap: 0.75rem;
  --url-flex-basis: 420px;
  --url-min-width: 240px;
  --copy-min-width: 140px;
}
@media (max-width: 600px){
  .app{
    --page-padding: 1rem;
    --h1-size: 1.6rem;
    --lead-size: 0.95rem;
    --card-padding: 1.25rem;
    --card-margin-bottom: 1.75rem;
    --card-title-size: 1.25rem;
    --card-title-margin: 1rem;
    --field-gap: 0.75rem;
    --url-gap: 0.5rem;
    --url-flex-basis: 100%;
    --url-min-width: 0px;
    --copy-min-width: 0px;
  }
}
`}
			</style>
			<header>
				<h1
					style={{
						marginBottom: "0.5rem",
						fontSize: "var(--h1-size)",
						fontWeight: "bold",
						textAlign: "center",
					}}
				>
					NotionからDiscord通知の設定
				</h1>
				<p
					style={{
						color: "#666",
						marginBottom: "var(--card-margin-bottom)",
						fontSize: "var(--lead-size)",
						textAlign: "center",
					}}
				>
					DiscordチャンネルIDを入力して、Webhook URLを生成してください
				</p>
			</header>

			<main>
				{/* メインカード: Webhook URL生成フォーム */}
				<section
					style={{
						marginBottom: "var(--card-margin-bottom)",
						backgroundColor: "#fff",
						padding: "var(--card-padding)",
						borderRadius: "12px",
						border: "2px solid #5865F2",
						boxShadow: "0 4px 12px rgba(88, 101, 242, 0.15)",
					}}
				>
					<h2
						style={{
							fontSize: "var(--card-title-size)",
							fontWeight: "bold",
							marginBottom: "var(--card-title-margin)",
							color: "#5865F2",
						}}
					>
						Webhook URL生成
					</h2>

					<div
						style={{
							display: "flex",
							gap: "var(--field-gap)",
							flexWrap: "wrap",
							alignItems: "flex-start",
						}}
					>
						<div style={{ flex: "1 1 320px" }}>
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
								inputMode="numeric"
								autoComplete="off"
								spellCheck={false}
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
							<div style={{ minHeight: "1.25rem", marginTop: "0.5rem" }}>
								{discordChannelId && !isValidChannelId ? (
									<p
										style={{
											color: "#dc3545",
											fontSize: "0.875rem",
											margin: 0,
										}}
									>
										チャンネルIDは17-19桁の数字で入力してください
									</p>
								) : (
									<p style={{ color: "#666", fontSize: "0.875rem", margin: 0 }}>
										チャンネル名を右クリック →「IDをコピー」
									</p>
								)}
							</div>
						</div>

						<div style={{ flex: "1 1 320px" }}>
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
							<textarea
								id="title"
								rows={1}
								value={title}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
									}
								}}
								onInput={(e) => {
									const target = e.currentTarget as HTMLTextAreaElement;
									if (target) {
										// 改行文字を削除
										const valueWithoutNewlines = target.value.replace(
											/\n/g,
											"",
										);
										setTitle(valueWithoutNewlines);
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
									resize: "none",
									overflowWrap: "break-word",
									wordBreak: "break-word",
									whiteSpace: "pre-wrap",
									lineHeight: "1.4",
									fieldSizing: "content",
									minHeight: "calc(1rem + 1.5rem)",
								}}
							/>
							<p
								style={{
									color: "#666",
									fontSize: "0.875rem",
									margin: "0.5rem 0 0 0",
								}}
							>
								Notionの通知文に添える短いタイトル（任意）
							</p>
						</div>
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
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: "0.75rem",
								marginBottom: "0.5rem",
								flexWrap: "wrap",
							}}
						>
							<p
								style={{
									fontWeight: "bold",
									fontSize: "0.95rem",
									color: "#333",
									margin: 0,
								}}
							>
								生成されたWebhook URL:
							</p>
							<span
								style={{
									fontSize: "0.875rem",
									color:
										copyState === "copied"
											? "#198754"
											: copyState === "failed"
												? "#dc3545"
												: "#666",
									minHeight: "1.1rem",
								}}
							>
								{copyState === "copied"
									? "コピーしました"
									: copyState === "failed"
										? "コピーに失敗しました"
										: url
											? "URLをクリックしてコピーできます"
											: "チャンネルIDを入力してください"}
							</span>
						</div>

						<div
							style={{
								display: "flex",
								gap: "var(--url-gap)",
								alignItems: "stretch",
								flexWrap: "wrap",
							}}
						>
							<button
								type="button"
								onClick={copyToClipboard}
								disabled={!url}
								aria-label="Webhook URLをコピー"
								style={{
									flex: "1 1 var(--url-flex-basis)",
									minWidth: "var(--url-min-width)",
									display: "flex",
									alignItems: "center",
									padding: "0.75rem 0.875rem",
									backgroundColor: "#fff",
									borderRadius: "6px",
									fontSize: "0.9rem",
									wordBreak: "break-all",
									border: "1px solid #ddd",
									fontFamily: "monospace",
									minHeight: "2.75rem",
									color: url ? "#333" : "#999",
									cursor: url ? "pointer" : "not-allowed",
									boxSizing: "border-box",
									textAlign: "left",
									appearance: "none",
								}}
							>
								{url ||
									(discordChannelId && !isValidChannelId
										? "正しいチャンネルIDを入力してください"
										: "チャンネルIDを入力してください")}
							</button>

							<button
								type="button"
								onClick={copyToClipboard}
								disabled={!url}
								style={{
									flex: "0 0 auto",
									minWidth: "var(--copy-min-width)",
									padding: "0 1.25rem",
									backgroundColor: url ? "#5865F2" : "#ccc",
									color: "white",
									border: "none",
									borderRadius: "6px",
									cursor: url ? "pointer" : "not-allowed",
									fontSize: "1rem",
									fontWeight: "bold",
									transition: "background-color 0.2s",
									minHeight: "2.75rem",
									appearance: "none",
								}}
							>
								{copyState === "copied" ? "コピー済み" : "コピー"}
							</button>
						</div>
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
			</main>
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	render(<App />, root);
}
