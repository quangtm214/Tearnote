import type { Lang } from './index';
import type { Dictionary } from './vi';

/**
 * です・ます nhẹ, tránh あなた khi bỏ được. "泣いたこと" thay Entry, "見知らぬ人からの / へのことば"
 * thay Comfort (PRODUCT.md). Chưa có người bản ngữ soát — phải soát trước khi có người dùng Nhật.
 */
const LANG_NAMES: Record<Lang, string> = { vi: 'ベトナム語', en: '英語', ja: '日本語' };
const joinList = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join('、')}と${names[names.length - 1]}`;

const ja: Dictionary = {
  locale: 'ja-JP',
  // Vài nhãn có "、" bên trong.
  tagSeparator: '／',

  common: {
    back: '戻る',
    networkError: '接続できませんでした。ネットワークを確認して、もう一度お試しください。',
    loading: '読み込み中',
    keep: '残す',
    needHelp: '助けが必要なとき',
    needHelpHint: '相談窓口の電話番号。オフラインでも開けます',
    thanked: 'お礼済み',
    autoTranslated: '自動翻訳済み',
    intensity: (n) => `強さは5段階中${n}`,
    signIn: 'ログイン',
    wordsYouWrote: '書いたことば',
    writeForStranger: '見知らぬ人へのことばを書く',
    email: 'メールアドレス',
    emailPlaceholder: 'you@example.com',
    password: 'パスワード',
    passwordHint: '6文字以上',
    leave: '戻る',
    remove: '削除する',
  },

  tab: { index: '日記', write: '見知らぬ人へ', calendar: 'カレンダー', settings: '設定' },

  card: {
    photos: (n) => `写真${n}枚`,
    recording: '録音',
    clipped: 'ことばがはさんであります',
    hasComfort: '見知らぬ人からのことばあり',
    hasComfortThanked: '見知らぬ人からのことばあり、お礼済み',
    listen: '聞く',
    pause: '一時停止',
    listenA11y: (label, seconds) =>
      `${label}、録音、${seconds >= 60 ? `${Math.floor(seconds / 60)}分` : ''}${seconds % 60}秒`,
  },

  duration: (minutes) =>
    minutes === null
      ? '覚えていない'
      : minutes === 5
        ? '数分'
        : minutes === 30
          ? '30分ほど'
          : minutes === 60
            ? '30分以上'
            : `${minutes}分`,

  timeline: {
    title: '泣いた日のこと',
    empty: 'まだ何もありません。書きたいときだけ、書けば大丈夫です。',
    newEntry: '書きとめる',
  },

  newEntry: {
    ago: (minutes) => (minutes === 0 ? 'さっき' : minutes === 60 * 24 ? '昨日' : `${minutes / 60}時間前`),
    recordingInterrupted: '録音が途中で止まりました。もう一度録音してください。',
    discard: '削除',
    noCameraPermission: 'Tearnoteはまだカメラを使えません。端末の設定で許可できます。',
    cameraError: 'カメラを開けませんでした。もう一度お試しください。',
    libraryError: '写真を開けませんでした。もう一度お試しください。',
    noMicPermission: 'Tearnoteはまだマイクを使えません。端末の設定で許可できます。',
    recordingStarted: '録音中',
    recordingError: '録音できませんでした。もう一度お試しください。',
    saveError: '写真か録音を保存できませんでした。もう一度「保存する」を押すか、減らしてから保存してください。',
    title: 'さっきは、\nどうでしたか？',
    intro: '全部書かなくても大丈夫です。いつでも保存できます。',
    whenLabel: 'いつ？',
    howLongLabel: 'どのくらい続いた？',
    howHeavyLabel: 'どのくらい強かった？',
    intensityLabel: '強さ',
    intensityValue: (n) => `5段階中${n}`,
    whyLabel: 'どんなことで？',
    maxTags: (n) => `${n}つまで。選ばなくても大丈夫です。`,
    notesLabel: 'ほかに書きたいことは？',
    notesPlaceholder: '何を書いてもかまいません。読めるのは自分だけです。',
    attachLabel: '写真や録音も残す？',
    attachLimit: (photos, minutes) =>
      `写真は${photos}枚まで、録音は1つ（${minutes}分まで）。この端末の中だけに保存されます。`,
    removePhotoQuestion: 'この写真を削除しますか？',
    photoN: (index) => `写真${index}`,
    removePhotoHint: 'タップするとこの写真を削除します',
    recordingProgress: (elapsed, limit) => `録音中 · ${elapsed} / ${limit}`,
    stopRecording: '録音を止める',
    stopError: '止められませんでした。もう一度お試しください。',
    removeRecording: '録音を削除',
    removeRecordingQuestion: 'この録音を削除しますか？',
    takePhoto: '写真を撮る',
    pickPhoto: '写真を選ぶ',
    recordButton: '録音する',
    save: '保存する',
    cancel: 'やっぱり書かない',
    leaveQuestion: '保存せずに戻りますか？',
    leaveDetail: '保存していない文章、写真、録音は消えます。',
    keepWriting: '続ける',
    saved: '保存しました。',
  },

  calendar: {
    title: 'カレンダー',
    // "10月" không vừa ô 22 ở cỡ 14; 12 cột số là đủ hiểu, nhãn đọc cho screen reader vẫn có "月".
    monthLabel: (month) => String(month),
    monthSummary: (month, days, max) =>
      `${month}月：泣いた日は${days}日。いちばん強かった日の合計は${max}。`,
    monthEmpty: (month) => `${month}月：泣いた日はありません。`,
    levelRange: (from, to) => (to === undefined ? `${from}以上` : `${from}から${to}`),
    legendA11y: (levels) => `1日の強さの合計が大きいほど、色が濃くなります：${levels.join('、')}`,
    prevYear: '前の年',
    nextYear: '次の年',
    legendTitle: '1日の強さの合計',
  },

  settings: {
    title: '設定',
    signedOut: 'ログアウトしました。',
    receiveComforts: '見知らぬ人からのことばを受け取る',
    receiveComfortsDetail: 'オフにすると、見知らぬ人からのことばは届かなくなります。記録はこれまでどおりです。',
    wordsYouWroteDetail: '読み返したり、取り下げたりできます。',
    writeForStrangerDetail: 'ログインが必要です。24時間に5件まで。',
    account: 'アカウント',
    signOut: 'ログアウト',
    signOutDetail: '泣いた記録はこの端末に残ります。',
    signInDetail: 'ログインしていません。見知らぬ人へのことばを書くときだけ必要です。',
    language: '言語',
  },

  entry: {
    receiveError: '受け取れませんでした。少ししてから、もう一度お試しください。',
    poolEmpty: (joyOnly) =>
      `${joyOnly ? 'この喜び' : 'このこと'}に寄せられたことばは、まだありません。今回は回数に数えません。`,
    limitReached: 'この24時間で3件受け取りました。今はこれ以上受け取れません。',
    notFound: '見つかりません',
    notFoundDetail: 'この記録は、もう端末にありません。',
    wordsFromStranger: '見知らぬ人からのことば',
    noneYet: 'まだ何もはさまれていません。',
    thank: 'ありがとう',
    request: '見知らぬ人からことばを受け取る',
    receivingOff: '見知らぬ人からのことばをオフにしています。設定で変更できます。',
    searching: 'ことばを探しています…',
    remove: 'この記録を削除する',
    removeQuestion: 'この記録を削除しますか？',
    removeDetail: (hasComfort: boolean) =>
      `文章、写真、録音がこの端末から削除されます。元に戻せません。${hasComfort ? 'はさまれていた見知らぬ人からのことばも消えます。' : ''}`,
    removed: '削除しました。',
  },

  write: {
    sessionExpired:
      'ログインの有効期限が切れました。もう一度ログインしてから送ってください。書いた文章は残っています。',
    limitReached: 'この24時間で5件送りました。今はこれ以上送れません。',
    sendError: '送れませんでした。文章は残っています。少ししてから、もう一度お試しください。',
    title: '見知らぬ人への\nことばを書く',
    doneTitle: 'ことばを\n預かりました',
    doneDetail: '確認を経てから、見知らぬ人に届きます。取り下げるときは「設定 → 書いたことば」から。',
    done: '完了',
    intro:
      'このことばは、似たようなことで泣いたばかりの見知らぬ人に届きます。お互いに相手が誰かはわかりません。',
    guidance: 'アドバイスはしなくて大丈夫です。自分の助けになったことを。名前、電話番号、SNSのアカウントは書かないでください。',
    inputLabel: '見知らぬ人へのことば',
    inputPlaceholder: 'あのとき聞きたかったことばを。',
    counterA11y: (n, max) => `${max}文字中${n}文字`,
    shortBy: (n) => ` · あと${n}文字`,
    languageLabel: '何語で書きますか？',
    topicLabel: 'どんなことへのことば？',
    pickTags: (max, unknownLabel) => `1つか${max}つ選んでください。誰にでも合うことばなら「${unknownLabel}」を。`,
    consent: (others) =>
      `「送る」を押すと、このことばが確認を経て${joinList(others.map((lang) => LANG_NAMES[lang]))}に翻訳され、匿名で見知らぬ人に届くことに同意したことになります。「設定 → 書いたことば」から取り下げられますが、すでに受け取った人の手元には残ります。`,
    signInAgain: 'もう一度ログイン',
    send: '送る',
    leaveQuestion: '送らずに戻りますか？',
    leaveDetail: 'いま書いていることばは消えます。',
    keepWriting: '書き続ける',
    needTag: '上から1つ以上選んでください。',
  },

  myComforts: {
    status: {
      pending: '確認待ち',
      approved: '承認済み',
      rejected: '送られませんでした',
      retracted: '取り下げ済み',
    },
    loadError: '一覧を読み込めませんでした。ネットワークを確認して、もう一度お試しください。',
    retractQuestion: 'このことばを取り下げますか？',
    retractDetail:
      'これ以上、誰にも届かなくなります。すでに受け取った人の手元には残ります。取り下げたら元に戻せません。',
    retract: '取り下げる',
    retractError: '取り下げられませんでした。ネットワークを確認して、もう一度お試しください。',
    keptByAccount: '書いたことばはアカウントに保存されます。',
    signInToView: 'ログインして見る',
    empty: 'まだありません。',
    retractA11y: (excerpt) => `取り下げる：${excerpt}`,
    irreversible: '元に戻せません',
    retracting: '取り下げ中…',
    retry: 'もう一度試す',
    retracted: '取り下げました。',
  },

  login: {
    verificationSent: '確認メールを送りました。確認が済んだら、ここでログインしてください。',
    error: 'ログインできませんでした。メールアドレス、パスワード、ネットワークを確認してください。',
    explanation:
      '見知らぬ人へ書くには、読む人の安全のためにログインが必要です。読む人にメールアドレスが見えることはありません。泣いたことを記録するだけなら必要ありません。',
    createAccount: 'アカウントを作る',
    later: 'あとで',
  },

  register: {
    title: 'アカウントを作る',
    createError:
      'アカウントを作れませんでした。このメールアドレスはすでに登録されているかもしれません。ログインを試すか、ネットワークを確認してください。',
    explanation:
      'アカウントは、見知らぬ人へ書くためだけのものです。読む人にメールアドレスが見えることはありません。',
    confirmPassword: 'パスワード（確認）',
    haveAccount: 'アカウントをお持ちの方はログイン',
  },

  help: {
    intro: '自分や誰かが今まさに危険な状態なら、救急に電話してください。',
    call: (phone) => `${phone} に電話`,
    callA11y: (name, phone) => `${name}に電話、番号 ${phone}`,
    openWebsite: (name) => `${name}のウェブサイトを開く`,
    footer: 'この一覧は端末に保存されていて、オフラインでも開けます。つながらない番号があれば、別の番号を試してください。',
  },
  validation: {
    emailInvalid: 'メールアドレスの形式が正しくないようです。もう一度確かめてください。',
    passwordRequired: 'パスワードを入力してください。',
    passwordTooShort: 'パスワードは6文字以上にしてください。',
    passwordMismatch: '2つのパスワードが一致しません。',
    bodyTooShort: '少し短いようです。もう少し書き足してください。',
    bodyTooLong: '長すぎます。少し短くしてください。',
    tagsNone: 'テーマを1つ以上選んでください。',
    tagsTooMany: 'テーマは2つまで選べます。',
    langInvalid: '書いた言語を選んでください。',
  },
};

export default ja;
