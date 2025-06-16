document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryCard = document.getElementById('summaryCard');
    const summaryOutput = document.getElementById('summaryOutput');

    // 初期状態ではボタンを無効化
    summarizeButton.disabled = true;

    urlInput.addEventListener('input', () => {
        summarizeButton.disabled = urlInput.value.trim() === "";
    });

    summarizeButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (url === "") {
            return;
        }

        // ローディング表示などをここに追加可能
        summarizeButton.disabled = true;
        summarizeButton.innerHTML = '<span class="button-icon">⏳</span> 要約中...';

        try {
            // --- ロジック / アクション ---
            // actions.generateSummary(urlInput.value)

            // ① URL から本文を取得 (バックエンド処理が必要)
            // const rawArticle = await fetchArticleContent(url);
            console.log(`Fetching content for URL: ${url}`);
            // この部分はバックエンド実装後に置き換えます
            // ダミーの本文
            const rawArticle = "これは取得した記事の本文です。非常に興味深い内容が書かれています。"; 
            
            if (!rawArticle) {
                throw new Error("記事本文を取得できませんでした。");
            }

            // ② Gemini で 1 行要約を生成（60 文字以内）(バックエンド処理が必要)
            // const oneLine = await generateGeminiSummary(rawArticle);
            console.log("Generating summary with Gemini...");
            // この部分はバックエンド実装後に置き換えます
            // ダミーの要約
            const oneLine = "記事の本文を1行で要約した結果です。";

            // ③ 要約を保存して画面に出す
            // create Summary { url: url, oneLiner: oneLine }
            // 実際にはデータモデルへの保存処理が入るが、ここではUI表示のみ
            summaryOutput.textContent = oneLine;
            summaryCard.style.display = 'block';

        } catch (error) {
            console.error("Error generating summary:", error);
            summaryOutput.textContent = `エラーが発生しました: ${error.message}`;
            summaryCard.style.display = 'block';
        } finally {
            summarizeButton.disabled = false;
            summarizeButton.innerHTML = '<span class="button-icon">⚡</span> 要約する';
        }
    });

    // バックエンドへのリクエストを行う関数のスタブ (後で実装)
    // async function fetchArticleContent(url) {
    //     // ここでバックエンドAPIを呼び出して記事本文を取得
    //     // 例: const response = await fetch(`/api/fetch-article?url=${encodeURIComponent(url)}`);
    //     // const data = await response.json();
    //     // return data.articleText;
    //     console.warn("fetchArticleContent: バックエンド実装が必要です");
    //     return "これは取得した記事の本文です。(スタブ)"; // ダミーデータ
    // }

    // async function generateGeminiSummary(articleText) {
    //     // ここでバックエンドAPIを呼び出してGeminiで要約
    //     // 例: const response = await fetch('/api/summarize', {
    //     //     method: 'POST',
    //     //     headers: { 'Content-Type': 'application/json' },
    //     //     body: JSON.stringify({ text: articleText })
    //     // });
    //     // const data = await response.json();
    //     // return data.summary;
    //     console.warn("generateGeminiSummary: バックエンド実装が必要です");
    //     return "Geminiによる1行要約結果です。(スタブ)"; // ダミーデータ
    // }
});
