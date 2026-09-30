import type { Lang } from './index';
import type { TuDien } from './vi';

/** "a cry" thay Entry, "words from / for a stranger" thay Comfort (PRODUCT.md). */
const TEN: Record<Lang, string> = { vi: 'Vietnamese', en: 'English', ja: 'Japanese' };
const noi = (ds: string[]) =>
  ds.length < 2 ? ds.join('') : `${ds.slice(0, -1).join(', ')} and ${ds[ds.length - 1]}`;
const dem = (n: number, mot: string, nhieu: string) => `${n} ${n === 1 ? mot : nhieu}`;
const THANG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const en: TuDien = {
  locale: 'en-US',
  noiTag: '; ',

  chung: {
    quayLai: 'Back',
    loiMang: "Couldn't connect. Check your connection and try again.",
    dangTai: 'Loading',
    giuLai: 'Keep',
    canTroGiup: 'Need help now',
    troGiupGoiY: 'Hotline numbers, available even offline',
    daCamOn: 'thanked',
    daDich: 'translated automatically',
    cuongDo: (n) => `intensity ${n} of 5`,
    dangNhap: 'Sign in',
    loiDaViet: 'Words you wrote',
    vietLoi: 'Write words for a stranger',
    email: 'Email',
    emailMau: 'you@example.com',
    matKhau: 'Password',
    matKhauGoiY: 'At least 6 characters',
    loiEmail: 'Enter a valid email and a password of at least 6 characters.',
  },

  tab: { index: 'Journal', viet: 'Write', lich: 'Calendar', settings: 'Settings' },

  tam: {
    anh: (n) => dem(n, 'photo', 'photos'),
    ghiAm: 'voice note',
    kep: 'words tucked in here',
    coLoi: 'has words from a stranger',
    coLoiCamOn: 'has words from a stranger, thanked',
    nghe: 'Listen',
    dung: 'Pause',
    ngheA11y: (nhan, giay) =>
      `${nhan}, voice note, ${giay >= 60 ? `${dem(Math.floor(giay / 60), 'minute', 'minutes')} ` : ''}${dem(giay % 60, 'second', 'seconds')}`,
  },

  thoiLuong: (phut) =>
    phut === null
      ? 'Not sure'
      : phut === 5
        ? 'A few minutes'
        : phut === 30
          ? 'Half an hour'
          : phut === 60
            ? 'Over half an hour'
            : dem(phut, 'minute', 'minutes'),

  timeline: {
    tieuDe: 'Times I cried',
    trong: "Nothing here yet. Write when you feel like it — or don't.",
    ghi: 'Write it down',
  },

  ghi: {
    lui: (phut) =>
      phut === 0 ? 'Just now' : phut === 60 * 24 ? 'Yesterday' : `${dem(phut / 60, 'hour', 'hours')} ago`,
    ghiNgat: 'The recording stopped partway. Try again.',
    bo: 'Remove',
    chuaCoCamera: "Tearnote can't use the camera yet. You can allow it in your phone's Settings.",
    loiCamera: "Couldn't open the camera.",
    loiThuVien: "Couldn't open your photos.",
    chuaCoMic: "Tearnote can't use the microphone yet. You can allow it in your phone's Settings.",
    dangGhiAm: 'Recording',
    loiGhiAm: "Couldn't record. Try again.",
    loiLuu: "Couldn't save the photos or voice note. Tap Save again, or remove some and save.",
    tieuDe: 'How was it?',
    moDau: 'No need to fill in everything. Tap Save whenever you like.',
    lucNao: 'When?',
    baoLau: 'How long did it last?',
    nangDenDau: 'How intense was it?',
    viChuyenGi: 'What was it about?',
    toiDaTag: (n) => `Up to ${n}. Choosing none is fine too.`,
    ghiThem: 'Anything else to write?',
    ghiThemGoiY: 'Write whatever you want. Only you can read it.',
    kem: 'Add a photo or voice note?',
    kemGioiHan: (anh, phut) =>
      `Up to ${anh} photos and one ${phut}-minute voice note. They stay on this phone.`,
    boAnhHoi: 'Remove this photo?',
    anhSo: (i) => `Photo ${i}`,
    boAnhGoiY: 'Tap to remove this photo',
    dangGhi: (da, toiDa) => `Recording · ${da} / ${toiDa}`,
    dungGhi: 'Stop recording',
    loiDung: "Couldn't stop. Try again.",
    boGhiAm: 'Remove voice note',
    boGhiAmHoi: 'Remove this voice note?',
    chupAnh: 'Take a photo',
    chonAnh: 'Choose photos',
    ghiAm: 'Record',
    luu: 'Save',
    thoi: "Never mind, don't save",
  },

  lich: {
    tieuDe: 'Calendar',
    chonNam: (nam) => `${nam}, choose another year`,
    // "Jan"… không vừa ô 22 ở máy hẹp; một chữ cái là cách viết quen của bảng cả năm.
    cot: (thang) => 'JFMAMJJASOND'[thang - 1],
    thang: (thang, soNgay, max) =>
      `${THANG[thang - 1]}: cried on ${dem(soNgay, 'day', 'days')}. Heaviest day, combined intensity ${max}.`,
    thangTrong: (thang) => `${THANG[thang - 1]}: no days with crying.`,
    muc: (tu, den) => (den === undefined ? `${tu} or more` : `${tu} to ${den}`),
    chuGiai: (muc) => `The color deepens with the day's total intensity: ${muc.join(', ')}`,
    dong: 'Close',
  },

  caiDat: {
    tieuDe: 'Settings',
    daDangXuat: 'Signed out.',
    nhanLoi: 'Receive words from strangers',
    nhanLoiPhu:
      "When off, you won't receive any more words from strangers. Your journal stays the same.",
    loiDaVietPhu: 'Look back at, or withdraw, what you wrote.',
    vietLoiPhu: 'Requires signing in. Up to 5 in 24 hours.',
    taiKhoan: 'Account',
    dangXuat: 'Sign out',
    dangXuatPhu: 'Your journal stays on this phone.',
    dangNhapPhu: 'Not signed in. Only needed to write words for strangers.',
    ngonNgu: 'Language',
  },

  lanKhoc: {
    loiNhan: "Couldn't receive any. Try again in a little while.",
    poolRong: (chiVui) =>
      `There are no words for this${chiVui ? ' joy' : ''} yet. This doesn't count toward your limit.`,
    hetLuot: "You've received 3 in the last 24 hours. You can't receive more yet.",
    khongThay: 'Not found',
    khongThayPhu: 'This cry is no longer on this phone.',
    loiTuNguoiLa: 'Words from a stranger',
    chuaKep: 'Nothing tucked in here yet.',
    camOn: 'Thank you',
    xin: 'Receive words from a stranger',
    daTat: "You've turned off words from strangers. You can change this in Settings.",
  },

  viet: {
    hetPhien: 'Your sign-in has expired. Sign in again and send — what you typed is still here.',
    hetLuot: "You've sent 5 in the last 24 hours. You can't send more yet.",
    loiGui: "Couldn't send. Your words are still here — try again in a little while.",
    xongTieuDe: 'Your words were received',
    xongPhu:
      "They'll be reviewed first, then reach a stranger. To withdraw them, go to Settings → Words you wrote.",
    xong: 'Done',
    moDau:
      'Your words will reach a stranger who just cried over something similar. Neither of you knows who the other is.',
    goiY: "Share what once helped you — no advice needed. Don't include names, phone numbers or social media.",
    oNhap: 'Words for a stranger',
    oNhapGoiY: 'Write what you once needed to hear.',
    demA11y: (n, max) => `${n} of ${max} characters`,
    conThieu: (n) => ` · ${dem(n, 'more character', 'more characters')} needed`,
    vietBang: 'What language are you writing in?',
    danhCho: 'What is it for?',
    chonTag: (max, chung) =>
      `Choose 1 or ${max}. If it fits anyone who is sad, choose “${chung}”.`,
    dongY: (khac) =>
      `By tapping Send, you agree that your words will be reviewed, translated into ${noi(khac.map((l) => TEN[l]))}, and sent anonymously to strangers. You can withdraw them in Settings → Words you wrote; anyone who already received them keeps their copy.`,
    dangNhapLai: 'Sign in again',
    gui: 'Send',
  },

  cuaToi: {
    trangThai: {
      pending: 'Waiting for review',
      approved: 'Approved',
      rejected: 'Not sent',
      retracted: 'Withdrawn',
    },
    loiTai: "Couldn't load the list. Check your connection and try again.",
    hoiThuHoi: 'Withdraw these words?',
    hoiThuHoiPhu:
      "They won't reach anyone else. Anyone who already received them keeps them. This can't be undone.",
    thuHoi: 'Withdraw',
    loiThuHoi: "Couldn't withdraw. Check your connection and try again.",
    theoTaiKhoan: 'Words you write are kept with your account.',
    dangNhapXem: 'Sign in to see them',
    trong: 'Nothing yet.',
    thuHoiA11y: (dau) => `Withdraw: ${dau}`,
    khongHoanTac: "Can't be undone",
    dangThuHoi: 'Withdrawing…',
    thuLai: 'Try again',
  },

  dangNhap: {
    daGuiXacMinh: "We've sent a verification email. Once you've verified, sign in here.",
    loi: "Couldn't sign in. Check your email, password and connection.",
    giaiThich:
      'Writing for strangers requires signing in, to keep readers safe. Readers never see your email. Recording your cries needs no account.',
    taoMoi: 'Create an account',
    deSau: 'Not now',
  },

  taoTaiKhoan: {
    tieuDe: 'Create account',
    khongKhop: "The passwords don't match.",
    loiTao:
      "Couldn't create the account. This email may already have one — try signing in. Or check your connection.",
    giaiThich: 'An account is only for writing to strangers. Readers never see your email.',
    nhapLai: 'Confirm password',
    daCo: 'Already have an account? Sign in',
  },

  troGiup: {
    moDau: 'If you or someone else is in danger right now, call emergency services.',
    goi: (so) => `Call ${so}`,
    goiA11y: (ten, so) => `Call ${ten}, number ${so}`,
    moWeb: (ten) => `Open the ${ten} website`,
    cuoi: "This list is stored on your phone and opens even offline. If a number doesn't go through, try another.",
  },
};

export default en;
