document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryCard = document.getElementById('summaryCard');
    const summaryOutput = document.getElementById('summaryOutput');

    summarizeButton.disabled = true;

    urlInput.addEventListener('input', () => {
        summarizeButton.disabled = urlInput.value.trim() === "";
        summaryCard.style.display = 'none'; // 新しいURL入力時に結果を隠す
        summaryOutput.textContent = ''; // 前回の結果をクリア
    });

    summarizeButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (url === "") {
            return;
        }

        summarizeButton.disabled = true;
        summarizeButton.innerHTML = '<span class="button-icon">⏳</span> 要約中...';
        summaryCard.style.display = 'none';
        summaryOutput.textContent = '';

        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'サーバーから不明なエラーが返されました。' }));
                throw new Error(errorData.error || `サーバーエラー: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.oneLiner) {
                summaryOutput.textContent = data.oneLiner;
                summaryCard.style.display = 'block';
            } else {
                throw new Error('サーバーから有効な要約結果が得られませんでした。');
            }

        } catch (error) {
            console.error("要約処理中にエラーが発生しました:", error);
            summaryOutput.textContent = `エラー: ${error.message}`;
            summaryCard.style.display = 'block'; // エラーメッセージもカードに表示
        } finally {
            summarizeButton.disabled = false;
            summarizeButton.innerHTML = '<span class="button-icon">⚡</span> 要約する';
        }
    });
});
