import type { Lang } from './index';
import type { TuDien } from './vi';

/**
 * です・ます nhẹ, tránh あなた khi bỏ được. "泣いたこと" thay Entry, "見知らぬ人からの / へのことば"
 * thay Comfort (PRODUCT.md). Chưa có người bản ngữ soát — phải soát trước khi có người dùng Nhật.
 */
const TEN: Record<Lang, string> = { vi: 'ベトナム語', en: '英語', ja: '日本語' };
const noi = (ds: string[]) =>
  ds.length < 2 ? ds.join('') : `${ds.slice(0, -1).join('、')}と${ds[ds.length - 1]}`;

const ja: TuDien = {
  locale: 'ja-JP',
  // Vài nhãn có "、" bên trong.
  noiTag: '／',

  chung: {
    quayLai: '戻る',
    loiMang: '接続できませんでした。ネットワークを確認して、もう一度お試しください。',
    dangTai: '読み込み中',
    giuLai: '残す',
    canTroGiup: 'すぐに助けが必要なとき',
    troGiupGoiY: '相談窓口の電話番号。オフラインでも開けます',
    daCamOn: 'お礼済み',
    daDich: '自動翻訳',
    cuongDo: (n) => `強さは5段階中${n}`,
    dangNhap: 'ログイン',
    loiDaViet: '書いたことば',
    vietLoi: '見知らぬ人へのことばを書く',
    email: 'メールアドレス',
    emailMau: 'you@example.com',
    matKhau: 'パスワード',
    matKhauGoiY: '6文字以上',
    loiEmail: '正しいメールアドレスと、6文字以上のパスワードを入力してください。',
  },

  tab: { index: '日記', viet: '書く', lich: 'カレンダー', settings: '設定' },

  tam: {
    anh: (n) => `写真${n}枚`,
    ghiAm: '録音',
    kep: 'ことばがはさんであります',
    coLoi: '見知らぬ人からのことばあり',
    coLoiCamOn: '見知らぬ人からのことばあり、お礼済み',
    nghe: '聞く',
    dung: '止める',
    ngheA11y: (nhan, giay) =>
      `${nhan}、録音、${giay >= 60 ? `${Math.floor(giay / 60)}分` : ''}${giay % 60}秒`,
  },

  thoiLuong: (phut) =>
    phut === null
      ? '覚えていない'
      : phut === 5
        ? '数分'
        : phut === 30
          ? '30分ほど'
          : phut === 60
            ? '30分以上'
            : `${phut}分`,

  timeline: {
    tieuDe: '泣いた日のこと',
    trong: 'まだ何もありません。書きたいときだけ、書けば大丈夫です。',
    ghi: '書きとめる',
  },

  ghi: {
    lui: (phut) => (phut === 0 ? 'さっき' : phut === 60 * 24 ? '昨日' : `${phut / 60}時間前`),
    ghiNgat: '録音が途中で止まりました。もう一度録音してください。',
    bo: '削除',
    chuaCoCamera: 'Tearnoteはまだカメラを使えません。端末の設定で許可できます。',
    loiCamera: 'カメラを開けませんでした。',
    loiThuVien: '写真を開けませんでした。',
    chuaCoMic: 'Tearnoteはまだマイクを使えません。端末の設定で許可できます。',
    dangGhiAm: '録音中',
    loiGhiAm: '録音できませんでした。もう一度お試しください。',
    loiLuu: '写真か録音を保存できませんでした。もう一度「保存する」を押すか、減らしてから保存してください。',
    tieuDe: 'さっきは、どうでしたか？',
    moDau: '全部書かなくても大丈夫です。いつでも保存できます。',
    lucNao: 'いつ？',
    baoLau: 'どのくらい続いた？',
    nangDenDau: 'どのくらい強かった？',
    viChuyenGi: 'どんなことで？',
    toiDaTag: (n) => `${n}つまで。選ばなくても大丈夫です。`,
    ghiThem: 'ほかに書きたいことは？',
    ghiThemGoiY: '何を書いてもかまいません。読めるのは自分だけです。',
    kem: '写真や録音も残す？',
    kemGioiHan: (anh, phut) =>
      `写真は${anh}枚まで、録音は${phut}分までのものを1つ。この端末の中だけに保存されます。`,
    boAnhHoi: 'この写真を削除しますか？',
    anhSo: (i) => `写真${i}`,
    boAnhGoiY: 'タップするとこの写真を削除します',
    dangGhi: (da, toiDa) => `録音中 · ${da} / ${toiDa}`,
    dungGhi: '録音を止める',
    loiDung: '止められませんでした。もう一度お試しください。',
    boGhiAm: '録音を削除',
    boGhiAmHoi: 'この録音を削除しますか？',
    chupAnh: '写真を撮る',
    chonAnh: '写真を選ぶ',
    ghiAm: '録音する',
    luu: '保存する',
    thoi: 'やっぱり書かない',
  },

  lich: {
    tieuDe: 'カレンダー',
    chonNam: (nam) => `${nam}年、ほかの年を選ぶ`,
    // "10月" không vừa ô 22 ở cỡ 14; 12 cột số là đủ hiểu, nhãn đọc cho screen reader vẫn có "月".
    cot: (thang) => String(thang),
    thang: (thang, soNgay, max) =>
      `${thang}月：泣いた日は${soNgay}日。いちばん強かった日の合計は${max}。`,
    thangTrong: (thang) => `${thang}月：泣いた日はありません。`,
    muc: (tu, den) => (den === undefined ? `${tu}以上` : `${tu}から${den}`),
    chuGiai: (muc) => `1日の強さの合計が大きいほど、色が濃くなります：${muc.join('、')}`,
    dong: '閉じる',
  },

  caiDat: {
    tieuDe: '設定',
    daDangXuat: 'ログアウトしました。',
    nhanLoi: '見知らぬ人からのことばを受け取る',
    nhanLoiPhu: 'オフにすると、見知らぬ人からのことばは届かなくなります。記録はこれまでどおりです。',
    loiDaVietPhu: '読み返したり、取り下げたりできます。',
    vietLoiPhu: 'ログインが必要です。24時間に5件まで。',
    taiKhoan: 'アカウント',
    dangXuat: 'ログアウト',
    dangXuatPhu: '泣いた記録はこの端末に残ります。',
    dangNhapPhu: 'ログインしていません。見知らぬ人へのことばを書くときだけ必要です。',
    ngonNgu: '言語',
  },

  lanKhoc: {
    loiNhan: '受け取れませんでした。少ししてから、もう一度お試しください。',
    poolRong: (chiVui) =>
      `${chiVui ? 'この喜び' : 'このこと'}に寄せられたことばは、まだありません。今回は回数に数えません。`,
    hetLuot: 'この24時間で3件受け取りました。今はこれ以上受け取れません。',
    khongThay: '見つかりません',
    khongThayPhu: 'この記録は、もう端末にありません。',
    loiTuNguoiLa: '見知らぬ人からのことば',
    chuaKep: 'まだ何もはさまれていません。',
    camOn: 'ありがとう',
    xin: '見知らぬ人からことばを受け取る',
    daTat: '見知らぬ人からのことばをオフにしています。設定で変更できます。',
  },

  viet: {
    hetPhien:
      'ログインの有効期限が切れました。もう一度ログインしてから送ってください。書いた文章は残っています。',
    hetLuot: 'この24時間で5件送りました。今はこれ以上送れません。',
    loiGui: '送れませんでした。文章は残っています。少ししてから、もう一度お試しください。',
    xongTieuDe: 'ことばを受け取りました',
    xongPhu: '確認を経てから、見知らぬ人に届きます。取り下げるときは「設定 → 書いたことば」から。',
    xong: '完了',
    moDau:
      'このことばは、似たようなことで泣いたばかりの見知らぬ人に届きます。お互いに相手が誰かはわかりません。',
    goiY: 'アドバイスはいりません。自分の助けになったことを。名前、電話番号、SNSは書かないでください。',
    oNhap: '見知らぬ人へのことば',
    oNhapGoiY: 'あのとき聞きたかったことばを。',
    demA11y: (n, max) => `${max}文字中${n}文字`,
    conThieu: (n) => ` · あと${n}文字`,
    vietBang: '何語で書きますか？',
    danhCho: 'どんなことへのことば？',
    chonTag: (max, chung) => `1つか${max}つ選んでください。誰にでも合うことばなら「${chung}」を。`,
    dongY: (khac) =>
      `「送る」を押すと、このことばが確認を経て${noi(khac.map((l) => TEN[l]))}に翻訳され、匿名で見知らぬ人に届くことに同意したことになります。「設定 → 書いたことば」から取り下げられますが、すでに受け取った人の手元には残ります。`,
    dangNhapLai: 'もう一度ログイン',
    gui: '送る',
  },

  cuaToi: {
    trangThai: {
      pending: '確認待ち',
      approved: '承認済み',
      rejected: '送られませんでした',
      retracted: '取り下げ済み',
    },
    loiTai: '一覧を読み込めませんでした。ネットワークを確認して、もう一度お試しください。',
    hoiThuHoi: 'このことばを取り下げますか？',
    hoiThuHoiPhu:
      'これ以上、誰にも届かなくなります。すでに受け取った人の手元には残ります。取り下げたら元に戻せません。',
    thuHoi: '取り下げる',
    loiThuHoi: '取り下げられませんでした。ネットワークを確認して、もう一度お試しください。',
    theoTaiKhoan: '書いたことばはアカウントに保存されます。',
    dangNhapXem: 'ログインして見る',
    trong: 'まだありません。',
    thuHoiA11y: (dau) => `取り下げる：${dau}`,
    khongHoanTac: '元に戻せません',
    dangThuHoi: '取り下げ中…',
    thuLai: 'もう一度',
  },

  dangNhap: {
    daGuiXacMinh: '確認メールを送りました。確認が済んだら、ここでログインしてください。',
    loi: 'ログインできませんでした。メールアドレス、パスワード、ネットワークを確認してください。',
    giaiThich:
      '見知らぬ人へ書くには、読む人の安全のためにログインが必要です。読む人にメールアドレスが見えることはありません。泣いたことを記録するだけなら必要ありません。',
    taoMoi: 'アカウントを作る',
    deSau: 'あとで',
  },

  taoTaiKhoan: {
    tieuDe: 'アカウントを作る',
    khongKhop: '2つのパスワードが一致しません。',
    loiTao:
      'アカウントを作れませんでした。このメールアドレスはすでに登録されているかもしれません。ログインを試すか、ネットワークを確認してください。',
    giaiThich:
      'アカウントは、見知らぬ人へ書くためだけのものです。読む人にメールアドレスが見えることはありません。',
    nhapLai: 'パスワード（確認）',
    daCo: 'アカウントをお持ちならログイン',
  },

  troGiup: {
    moDau: 'あなたや誰かが今まさに危険な状態なら、救急に電話してください。',
    goi: (so) => `${so} に電話`,
    goiA11y: (ten, so) => `${ten}に電話、番号 ${so}`,
    moWeb: (ten) => `${ten}のウェブサイトを開く`,
    cuoi: 'この一覧は端末に保存されていて、オフラインでも開けます。つながらない番号があれば、別の番号を試してください。',
  },
};

export default ja;
