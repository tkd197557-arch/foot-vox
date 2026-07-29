# FOOT VOX 新規記事データ作成ガイド

`article-template.json`を複製し、完成した記事オブジェクトを`articles.json`の`articles`配列へ追加します。記事固有データは`articles.json`だけで管理します。

## 必須項目

- `articleId`: 英小文字・数字・ハイフンで構成する一意のID
- `title`
- `category`
- `tags`
- `publishedDate`: `YYYY-MM-DD`
- `updatedDate`: `YYYY-MM-DD`
- `description`
- `image.src`
- `image.alt`
- `image.caption`
- `reactions`: 通常30〜60件。`number`は1からの連番
- `contentBlocks`: 出典がなければ空配列でも可

## 公開設定

- `listOnHome`: `false`なら通常一覧・検索・最近の記事から除外
- `relatedEligible`: `false`なら関連記事候補から除外
- `indexable`: `false`なら`noindex`となり、サイトマップから除外

非公開記事では3項目すべてを`false`にします。省略時は`false`ではないものとして公開対象になります。

## コメント

- トップページは先頭8件を表示
- 個別記事は全件を表示
- 「続きを読む」は9件目の`#reaction-9`へ移動
- 本番記事は最低9件、通常30〜60件を推奨
- 14件の固定上限はない

## 画像

- 推奨形式: JPEGまたはPNG
- 推奨サイズ: 1200×675px
- 推奨保存先: `assets/articles/{articleId}.jpg`
- OGPにも同じ画像を使用するため、SVGよりJPEG・PNGを推奨

## 公開手順

1. 画像を保存
2. `articles.json`へ記事を追加
3. `node scripts/generate-sitemap.mjs`
4. `node scripts/generate-sitemap.mjs --check`
5. JSON・XML構文を確認
6. HTTPプレビューでトップ、検索、個別記事、関連記事、SEOを確認
7. 対象ファイルだけをcommit
8. 通常の`git push origin main`
9. GitHub Pagesを確認
