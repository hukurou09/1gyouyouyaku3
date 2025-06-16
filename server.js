const fs = require('fs');
const path = require('path'); // pathモジュールをインポート

// --- .envファイルの手動読み込みと環境変数設定 ---
const envPath = path.resolve(process.cwd(), '.env'); // ここを process.cwd() 基準に変更
let geminiApiKeyFromFile = null;

try {
    if (fs.existsSync(envPath)) {
        console.log(`[手動読み込み] .env ファイルパス: ${envPath} - 存在確認OK`);
        const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
        console.log("[手動読み込み] .env ファイル内容:\n", envFileContent); // 内容を全部表示
        const lines = envFileContent.split(/\r?\n/); // WindowsとUnix系の改行に対応
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) { // コメント行と空行をスキップ
                const parts = trimmedLine.split('=');
                if (parts.length >= 2) { // 値に'='が含まれる場合も考慮
                    const key = parts.shift().trim();
                    const value = parts.join('=').trim();
                    if (key === 'GEMINI_API_KEY') {
                        process.env[key] = value; // process.envに設定
                        geminiApiKeyFromFile = value; // 確認用変数にも代入
                        console.log(`[手動読み込み] ${key} を process.env に設定しました。値: ${value}`);
                        break; // GEMINI_API_KEYが見つかったらループを抜ける
                    }
                }
            }
        }
        if (!geminiApiKeyFromFile) {
            console.log("[手動読み込み] .envファイル内に GEMINI_API_KEY が見つかりませんでした。");
        }
    } else {
        console.log(`[手動読み込み] .env ファイルが見つかりません: ${envPath}`);
    }
} catch (err) {
    console.error("[手動読み込み] .env ファイル読み込み中にエラーが発生しました:", err);
}
// --- 手動読み込みここまで ---

const express = require('express');
const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Gemini APIの初期化
const geminiApiKey = process.env.GEMINI_API_KEY; // 手動設定されたものを読み込む
if (!geminiApiKey) {
    // このエラーメッセージは、手動読み込みが失敗した場合にのみ表示されるはず
    console.error("エラー: GEMINI_API_KEYが環境変数に設定されていません。(手動読み込み後)");
    process.exit(1);
} else {
    console.log("GEMINI_API_KEY が正常に設定されました。");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // モデル名を指定

app.use(express.json()); // リクエストボディをJSONとしてパースする
app.use(express.static('.')); // index.htmlやstyle.cssなどの静的ファイルを提供

// APIエンドポイント: /api/summarize
app.post('/api/summarize', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URLが指定されていません。' });
    }

    try {
        // 1. URLから本文を取得
        console.log(`記事取得中: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;

        // JSDOMとReadabilityを使って記事本文を抽出
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            return res.status(500).json({ error: '記事本文を抽出できませんでした。' });
        }
        const rawArticle = article.textContent.trim();
        console.log(`記事本文抽出完了 (約${rawArticle.length}文字)`);

        // 2. Geminiで1行要約を生成
        console.log("Geminiで要約生成中...");
        const prompt = `以下はウェブ記事の本文です。内容の核心を捉え、箇条書きではなく1行・60文字以内で日本語要約してください。\n---\n${rawArticle}`;
        
        const result = await model.generateContent(prompt);
        const oneLine = result.response.text().trim();
        
        console.log(`要約生成完了: ${oneLine}`);

        // 3. 要約をクライアントに返す
        res.json({ oneLiner: oneLine });

    } catch (error) {
        console.error('要約処理中にエラーが発生しました:', error.message);
        if (error.response) {
            console.error('エラーレスポンス:', error.response.data);
        }
        res.status(500).json({ error: `要約処理中にエラーが発生しました: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`サーバーがポート ${port} で起動しました。 http://localhost:${port}`);
});
