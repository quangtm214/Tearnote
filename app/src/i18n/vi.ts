import type { Lang } from './index';

/**
 * Từ điển tiếng Việt — khuôn cho mọi từ điển khác. Giọng văn: PRODUCT.md (nhẹ, ít lời, không
 * khuyên, xưng "bạn"; "lần khóc", "lời từ / cho người lạ" thay Entry, Comfort).
 */
const LANG_NAMES: Record<Lang, string> = { vi: 'tiếng Việt', en: 'tiếng Anh', ja: 'tiếng Nhật' };
const joinList = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`;

const vi = {
  /** Locale cho Intl: ngày, giờ. */
  locale: 'vi-VN',
  /** Nối nhiều Tag — vài nhãn có dấu phẩy bên trong. */
  tagSeparator: '; ',

  common: {
    back: 'Quay lại',
    networkError: 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
    loading: 'Đang tải',
    keep: 'Giữ lại',
    needHelp: 'Cần trợ giúp ngay',
    needHelpHint: 'Số đường dây nóng, mở được cả khi không có mạng',
    thanked: 'đã cảm ơn',
    autoTranslated: 'đã dịch tự động',
    intensity: (n: number) => `cường độ ${n} trên 5`,
    signIn: 'Đăng nhập',
    wordsYouWrote: 'Lời bạn đã viết',
    writeForStranger: 'Viết một lời cho người lạ',
    email: 'Email',
    emailPlaceholder: 'ban@vidu.com',
    password: 'Mật khẩu',
    passwordHint: 'Ít nhất 6 ký tự',
    emailError: 'Cần một email hợp lệ và mật khẩu ít nhất 6 ký tự.',
    leave: 'Thoát',
    remove: 'Xoá',
  },

  tab: { index: 'Nhật ký', write: 'Viết lời', calendar: 'Lịch', settings: 'Cài đặt' },

  /** Tấm Entry và dải Nghe lại (ui.tsx). */
  card: {
    photos: (n: number) => `${n} ảnh`,
    recording: 'ghi âm',
    clipped: 'có một lời kẹp ở đây',
    hasComfort: 'có lời từ người lạ',
    hasComfortThanked: 'có lời từ người lạ, đã cảm ơn',
    listen: 'Nghe lại',
    pause: 'Tạm dừng',
    listenA11y: (label: string, seconds: number) =>
      `${label} đoạn ghi âm, dài ${seconds >= 60 ? `${Math.floor(seconds / 60)} phút ` : ''}${seconds % 60} giây`,
  },

  /** Nhãn thời lượng đã chọn; giá trị lạ (không có trong THOI_LUONG) thì ghi số phút. */
  duration: (minutes: number | null) =>
    minutes === null
      ? 'Không nhớ'
      : minutes === 5
        ? 'Vài phút'
        : minutes === 30
          ? 'Nửa tiếng'
          : minutes === 60
            ? 'Hơn nửa tiếng'
            : `${minutes} phút`,

  timeline: {
    title: 'Những lần đã khóc',
    empty: 'Chưa có gì ở đây. Khi nào muốn ghi thì ghi, không thì thôi.',
    newEntry: 'Ghi lại nhật ký',
  },

  newEntry: {
    ago: (minutes: number) =>
      minutes === 0 ? 'Vừa xong' : minutes === 60 * 24 ? 'Hôm qua' : `${minutes / 60} giờ trước`,
    recordingInterrupted: 'Ghi âm bị ngắt giữa chừng. Thử ghi lại.',
    discard: 'Bỏ',
    noCameraPermission: 'Tearnote chưa được dùng camera. Có thể cho phép trong Cài đặt của máy.',
    cameraError: 'Chưa mở được camera. Thử lại.',
    libraryError: 'Chưa mở được thư viện ảnh. Thử lại.',
    noMicPermission: 'Tearnote chưa được dùng micro. Có thể cho phép trong Cài đặt của máy.',
    recordingStarted: 'Đang ghi âm',
    recordingError: 'Chưa ghi âm được. Thử lại.',
    saveError: 'Chưa lưu được ảnh hoặc ghi âm. Bấm Lưu lại lần nữa, hoặc bỏ bớt rồi lưu.',
    title: 'Lúc nãy thế nào?',
    intro: 'Không cần điền hết. Bấm Lưu lại lúc nào cũng được.',
    whenLabel: 'Lúc nào?',
    howLongLabel: 'Kéo dài bao lâu?',
    howHeavyLabel: 'Nặng đến đâu?',
    /** Slider cường độ: nhãn và giá trị cho screen reader. */
    intensityLabel: 'Cường độ',
    intensityValue: (n: number) => `${n} trên 5`,
    whyLabel: 'Vì chuyện gì?',
    maxTags: (n: number) => `Tối đa ${n}. Không chọn cũng được.`,
    notesLabel: 'Muốn ghi thêm gì không?',
    notesPlaceholder: 'Muốn viết gì thì viết. Chỉ bạn đọc được.',
    attachLabel: 'Kèm ảnh hay ghi âm?',
    attachLimit: (photos: number, minutes: number) =>
      `Tối đa ${photos} ảnh và một đoạn ghi âm ${minutes} phút. Chỉ nằm trong máy.`,
    removePhotoQuestion: 'Bỏ ảnh này?',
    photoN: (index: number) => `Ảnh ${index}`,
    removePhotoHint: 'Bấm để bỏ ảnh này',
    recordingProgress: (elapsed: string, limit: string) => `Đang ghi âm · ${elapsed} / ${limit}`,
    stopRecording: 'Dừng ghi',
    stopError: 'Chưa dừng được. Thử lại.',
    removeRecording: 'Bỏ ghi âm',
    removeRecordingQuestion: 'Bỏ đoạn ghi âm này?',
    takePhoto: 'Chụp ảnh',
    pickPhoto: 'Chọn ảnh',
    recordButton: 'Ghi âm',
    save: 'Lưu lại',
    cancel: 'Thôi, không ghi nữa',
    leaveQuestion: 'Thoát mà chưa lưu?',
    leaveDetail: 'Chữ, ảnh và ghi âm chưa lưu sẽ mất.',
    keepWriting: 'Ghi tiếp',
    saved: 'Đã lưu.',
  },

  calendar: {
    title: 'Lịch',
    /** Nhãn cột tháng: ô rộng ~22, không được quá 3 ký tự hẹp. */
    monthLabel: (month: number) => `T${month}`,
    monthSummary: (month: number, days: number, max: number) =>
      `Tháng ${month}: khóc ${days} ngày. Ngày nặng nhất, cường độ cộng lại là ${max}.`,
    monthEmpty: (month: number) => `Tháng ${month}: không có ngày nào khóc.`,
    levelRange: (from: number, to?: number) => (to === undefined ? `từ ${from} trở lên` : `${from} đến ${to}`),
    legendA11y: (levels: string[]) => `Màu đậm dần theo tổng cường độ trong ngày: ${levels.join(', ')}`,
    prevYear: 'Năm trước',
    nextYear: 'Năm sau',
    legendTitle: 'Tổng cường độ trong ngày',
  },

  settings: {
    title: 'Cài đặt',
    signedOut: 'Đã đăng xuất.',
    receiveComforts: 'Nhận lời từ người lạ',
    receiveComfortsDetail: 'Tắt thì không nhận thêm lời nào từ người lạ. Việc ghi lại vẫn như cũ.',
    wordsYouWroteDetail: 'Xem lại, hoặc thu hồi lời đã viết.',
    writeForStrangerDetail: 'Cần đăng nhập. Tối đa 5 lời trong 24 giờ.',
    account: 'Tài khoản',
    signOut: 'Đăng xuất',
    signOutDetail: 'Những lần khóc vẫn nằm nguyên trên máy.',
    signInDetail: 'Chưa đăng nhập. Chỉ cần khi viết lời cho người lạ.',
    language: 'Ngôn ngữ',
  },

  /** Màn một lần khóc (comfort/[entryId].tsx). */
  entry: {
    receiveError: 'Chưa nhận được. Thử lại sau một lát.',
    poolEmpty: (joyOnly: boolean) =>
      `Lúc này chưa có lời nào cho ${joyOnly ? 'niềm vui' : 'chuyện'} này. Lần này không tính vào lượt của bạn.`,
    limitReached: 'Bạn đã nhận đủ 3 lời trong 24 giờ qua. Chưa nhận thêm được.',
    notFound: 'Không tìm thấy',
    notFoundDetail: 'Lần khóc này không còn trong máy.',
    wordsFromStranger: 'Lời từ người lạ',
    noneYet: 'Chưa có lời nào kẹp ở đây.',
    thank: 'Cảm ơn',
    request: 'Nhận một lời từ người lạ',
    receivingOff: 'Bạn đã tắt nhận lời từ người lạ. Có thể đổi trong Cài đặt.',
    searching: 'Đang tìm một lời…',
    remove: 'Xoá lần khóc này',
    removeQuestion: 'Xoá lần khóc này?',
    removeDetail: (hasComfort: boolean) =>
      `Chữ, ảnh và ghi âm sẽ bị xoá khỏi máy, không lấy lại được.${hasComfort ? ' Lời từ người lạ kẹp ở đây cũng mất theo.' : ''}`,
    removed: 'Đã xoá.',
  },

  write: {
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại rồi gửi — chữ bạn gõ vẫn còn đây.',
    limitReached: 'Bạn đã gửi đủ 5 lời trong 24 giờ qua. Chưa gửi thêm được.',
    sendError: 'Chưa gửi được. Lời vẫn còn đây — thử gửi lại sau một lát.',
    title: 'Viết một lời cho người lạ',
    doneTitle: 'Đã nhận lời của bạn',
    doneDetail:
      'Lời này sẽ được duyệt trước, rồi mới tới tay một người lạ. Muốn thu hồi thì vào Cài đặt → Lời bạn đã viết.',
    done: 'Xong',
    intro: 'Lời này sẽ tới một người lạ vừa khóc vì chuyện tương tự. Hai bên không biết nhau.',
    guidance: 'Kể điều từng giúp bạn, không cần khuyên. Đừng để lại tên, số điện thoại hay tài khoản mạng xã hội.',
    inputLabel: 'Lời cho người lạ',
    inputPlaceholder: 'Viết điều bạn từng muốn nghe.',
    counterA11y: (n: number, max: number) => `${n} trên ${max} ký tự`,
    shortBy: (n: number) => ` · còn thiếu ${n} ký tự`,
    languageLabel: 'Bạn viết bằng tiếng gì?',
    topicLabel: 'Lời này dành cho chuyện gì?',
    pickTags: (max: number, unknownLabel: string) =>
      `Chọn 1 hoặc ${max}. Lời hợp với bất kỳ ai đang buồn thì chọn “${unknownLabel}”.`,
    /** `khac`: các ngôn ngữ lời sẽ được dịch sang — mọi ngôn ngữ trừ ngôn ngữ người viết chọn. */
    consent: (others: Lang[]) =>
      `Bấm Gửi là bạn đồng ý: lời này được duyệt, dịch sang ${joinList(others.map((lang) => LANG_NAMES[lang]))}, rồi gửi ẩn danh tới người lạ. Thu hồi được trong Cài đặt → Lời bạn đã viết; ai đã nhận thì vẫn giữ bản của họ.`,
    signInAgain: 'Đăng nhập lại',
    send: 'Gửi',
    leaveQuestion: 'Thoát mà chưa gửi?',
    leaveDetail: 'Lời bạn đang viết sẽ mất.',
    keepWriting: 'Viết tiếp',
    needTag: 'Chọn ít nhất một chuyện ở trên.',
  },

  /** Lời mình đã viết (comfort/cua-toi.tsx). */
  myComforts: {
    status: {
      pending: 'Đang chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Không được gửi đi',
      retracted: 'Đã thu hồi',
    },
    loadError: 'Chưa lấy được danh sách. Kiểm tra mạng rồi thử lại.',
    retractQuestion: 'Thu hồi lời này?',
    retractDetail:
      'Lời này sẽ không tới tay thêm ai nữa. Ai đã nhận thì vẫn giữ được. Thu hồi rồi không mở lại được.',
    retract: 'Thu hồi',
    retractError: 'Chưa thu hồi được. Kiểm tra mạng rồi thử lại.',
    keptByAccount: 'Lời bạn viết được giữ theo tài khoản.',
    signInToView: 'Đăng nhập để xem',
    empty: 'Chưa có lời nào.',
    retractA11y: (excerpt: string) => `Thu hồi lời: ${excerpt}`,
    irreversible: 'Không hoàn tác được',
    retracting: 'Đang thu hồi…',
    retry: 'Thử lại',
    retracted: 'Đã thu hồi.',
  },

  login: {
    verificationSent: 'Đã gửi thư xác minh tới email của bạn. Xác minh xong thì đăng nhập ở đây.',
    error: 'Không đăng nhập được. Kiểm tra lại email, mật khẩu và kết nối mạng.',
    explanation:
      'Viết cho người lạ thì cần đăng nhập, để giữ an toàn cho người đọc. Người đọc không bao giờ thấy email của bạn. Ghi lại những lần khóc thì không cần.',
    createAccount: 'Tạo tài khoản mới',
    later: 'Để sau',
  },

  register: {
    title: 'Tạo tài khoản',
    mismatch: 'Hai lần nhập mật khẩu chưa khớp.',
    createError:
      'Không tạo được tài khoản. Có thể email này đã có tài khoản — thử Đăng nhập. Hoặc kiểm tra mạng.',
    explanation: 'Tài khoản chỉ để viết cho người lạ. Người đọc không bao giờ thấy email của bạn.',
    confirmPassword: 'Nhập lại mật khẩu',
    haveAccount: 'Đã có tài khoản? Đăng nhập',
  },

  /** Màn hotline (help.tsx). Tên đường dây và giờ trực nằm trong hotlines.ts. */
  help: {
    intro: 'Nếu bạn hoặc ai đó đang gặp nguy hiểm ngay lúc này, gọi cấp cứu.',
    call: (phone: string) => `Gọi ${phone}`,
    callA11y: (name: string, phone: string) => `Gọi ${name}, số ${phone}`,
    openWebsite: (name: string) => `Mở trang web ${name}`,
    footer: 'Danh sách có sẵn trong máy, mở được cả khi không có mạng. Số nào không gọi được thì thử số khác.',
  },
};

export default vi;
export type Dictionary = typeof vi;
