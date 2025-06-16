require('dotenv').config(); // .envファイルから環境変数を読み込む (開発環境用)
const express = require('express');
const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// PORT環境変数が設定されていればそれを使用し、なければ3000を使用 (Renderで自動設定される)
const port = process.env.PORT || 3000;

// Gemini APIの初期化
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error("エラー: GEMINI_API_KEYが環境変数に設定されていません。");
    // process.exit(1); // デプロイ環境では起動失敗を避けるため、一旦コメントアウト。Render側で設定必須とする。
                     // ローカルで.envがない場合は起動はするがAPI呼び出しでエラーになる。
    console.warn("警告: GEMINI_API_KEYが未設定です。API呼び出しは失敗します。");
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
