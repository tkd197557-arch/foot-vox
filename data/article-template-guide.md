# FOOT VOX 記事データ作成ガイド

`article-template.json`を複製して値を入力し、完成したオブジェクトを`articles.json`の最上位配列へ追加します。`articleId`は他の記事と重複しない英数字とハイフンの値にしてください。

既存先頭記事の`homeSidebar`はサイト共通データです。新規記事オブジェクトへ複製する必要はありません。

## 必須項目

| 項目 | 形式 | 用途 |
|---|---|---|
| `articleId` | 文字列 | URLの`article.html?id=...`と記事識別 |
| `listOnHome` | 真偽値 | トップページへ掲載する場合は`true` |
| `relatedEligible` | 真偽値 | 関連記事の候補に含める場合は`true`。動作確認用・ダミー記事は`false` |
| `title` | 文字列 | 記事タイトル |
| `category` | 文字列 | 主カテゴリー |
| `tags` | 文字列配列 | タグ一覧。現在のカードでは3件を使用 |
| `publishedDate` | `YYYY-MM-DD` | 公開日 |
| `updatedDate` | `YYYY-MM-DD` | 更新日 |
| `listing` | オブジェクト | トップページ掲載用。`listOnHome: true`の場合は必須 |
| `contentBlocks` | 配列 | 個別記事の本文データ |

`listing.reactions`は現在のトップページ仕様に合わせて8件にします。個別記事の`reactions`は合計14件とし、現在の構造では前半7件と後半7件の2ブロックに分けます。

## contentBlocksの入力形式

### text

概要は`role: "summary"`、出典は`role: "source"`を使用します。

```json
{
  "type": "text",
  "role": "summary",
  "text": "概要本文"
}
```

```json
{
  "type": "text",
  "role": "source",
  "text": "出典名",
  "href": "https://example.com/source"
}
```

### image

```json
{
  "type": "image",
  "src": "assets/image-name.jpg",
  "alt": "画像の内容を説明する文章",
  "caption": "画像キャプション"
}
```

### video

未設定の場合は`provider`と`embedUrl`を`null`にします。設定時の`provider`は`youtube`または`x`を使用します。
未設定時に余白ごと隠す場合は`hideWhenUnset: true`を指定します。

```json
{
  "type": "video",
  "provider": "youtube",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "title": "動画タイトル"
}
```

### gif

未設定の場合はテンプレートの`null`と空文字を維持します。
未設定時に余白ごと隠す場合は`hideWhenUnset: true`を指定します。

```json
{
  "type": "gif",
  "src": "assets/animation.gif",
  "alt": "GIFの内容を説明する文章",
  "caption": "GIFキャプション"
}
```

### reactions

```json
{
  "type": "reactions",
  "items": [
    {
      "number": 1,
      "name": "投稿者名",
      "text": "コメント本文"
    }
  ]
}
```

番号は記事全体で`1`から`14`まで重複なく連番にします。`number`は数値、`name`と`text`は文字列です。

## 現在の標準ブロック順

1. `text`（summary）
2. `image`
3. `text`（source）
4. `video`
5. `reactions`（1〜7）
6. `gif`
7. `reactions`（8〜14）

画像・動画・GIFのデータ領域は準備済みですが、現在の個別記事ページでJSONから表示切替しているのはタイトル、概要、メタ情報、コメントです。メディアの完全なJSON描画は今後の実装対象です。

## 追加前チェック

- `articleId`が既存記事と重複していない
- 動作確認用・ダミー記事は`relatedEligible: false`になっている
- 日付が`YYYY-MM-DD`
- `listOnHome: true`の場合、`listing`と8件のコメントがある
- `contentBlocks`に必要なブロックがある
- 個別記事コメントが合計14件で、番号が1〜14の連番
- JSONの末尾カンマがない
