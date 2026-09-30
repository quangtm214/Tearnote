import type { Lang } from './index';

/**
 * Từ điển tiếng Việt — khuôn cho mọi từ điển khác. Giọng văn: PRODUCT.md (nhẹ, ít lời, không
 * khuyên, xưng "bạn"; "lần khóc", "lời từ / cho người lạ" thay Entry, Comfort).
 */
const TEN: Record<Lang, string> = { vi: 'tiếng Việt', en: 'tiếng Anh', ja: 'tiếng Nhật' };
const noi = (ds: string[]) =>
  ds.length < 2 ? ds.join('') : `${ds.slice(0, -1).join(', ')} và ${ds[ds.length - 1]}`;

const vi = {
  /** Locale cho Intl: ngày, giờ. */
  locale: 'vi-VN',
  /** Nối nhiều Tag — vài nhãn có dấu phẩy bên trong. */
  noiTag: '; ',

  chung: {
    quayLai: 'Quay lại',
    loiMang: 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
    dangTai: 'Đang tải',
    giuLai: 'Giữ lại',
    canTroGiup: 'Cần trợ giúp ngay',
    troGiupGoiY: 'Số đường dây nóng, mở được cả khi không có mạng',
    daCamOn: 'đã cảm ơn',
    daDich: 'đã dịch tự động',
    cuongDo: (n: number) => `cường độ ${n} trên 5`,
    dangNhap: 'Đăng nhập',
    loiDaViet: 'Lời bạn đã viết',
    vietLoi: 'Viết một lời cho người lạ',
    email: 'Email',
    emailMau: 'ban@vidu.com',
    matKhau: 'Mật khẩu',
    matKhauGoiY: 'Ít nhất 6 ký tự',
    loiEmail: 'Cần một email hợp lệ và mật khẩu ít nhất 6 ký tự.',
  },

  tab: { index: 'Nhật ký', viet: 'Viết lời', lich: 'Lịch', settings: 'Cài đặt' },

  /** Tấm Entry và dải Nghe lại (ui.tsx). */
  tam: {
    anh: (n: number) => `${n} ảnh`,
    ghiAm: 'ghi âm',
    kep: 'có một lời kẹp ở đây',
    coLoi: 'có lời từ người lạ',
    coLoiCamOn: 'có lời từ người lạ, đã cảm ơn',
    nghe: 'Nghe lại',
    dung: 'Dừng',
    ngheA11y: (nhan: string, giay: number) =>
      `${nhan} ghi âm, dài ${giay >= 60 ? `${Math.floor(giay / 60)} phút ` : ''}${giay % 60} giây`,
  },

  /** Nhãn thời lượng đã chọn; giá trị lạ (không có trong THOI_LUONG) thì ghi số phút. */
  thoiLuong: (phut: number | null) =>
    phut === null
      ? 'Không nhớ'
      : phut === 5
        ? 'Vài phút'
        : phut === 30
          ? 'Nửa tiếng'
          : phut === 60
            ? 'Hơn nửa tiếng'
            : `${phut} phút`,

  timeline: {
    tieuDe: 'Những lần đã khóc',
    trong: 'Chưa có gì ở đây. Khi nào muốn ghi thì ghi, không thì thôi.',
    ghi: 'Ghi lại nhật ký',
  },

  ghi: {
    lui: (phut: number) =>
      phut === 0 ? 'Vừa xong' : phut === 60 * 24 ? 'Hôm qua' : `${phut / 60} giờ trước`,
    ghiNgat: 'Ghi âm bị ngắt giữa chừng. Thử ghi lại.',
    bo: 'Bỏ',
    chuaCoCamera: 'Tearnote chưa được dùng camera. Có thể cho phép trong Cài đặt của máy.',
    loiCamera: 'Chưa mở được camera.',
    loiThuVien: 'Chưa mở được thư viện ảnh.',
    chuaCoMic: 'Tearnote chưa được dùng micro. Có thể cho phép trong Cài đặt của máy.',
    dangGhiAm: 'Đang ghi âm',
    loiGhiAm: 'Chưa ghi âm được. Thử lại.',
    loiLuu: 'Chưa lưu được ảnh hoặc ghi âm. Bấm Lưu lại lần nữa, hoặc bỏ bớt rồi lưu.',
    tieuDe: 'Lúc nãy thế nào?',
    moDau: 'Không cần điền hết. Bấm Lưu lúc nào cũng được.',
    lucNao: 'Lúc nào?',
    baoLau: 'Kéo dài bao lâu?',
    nangDenDau: 'Nặng đến đâu?',
    /** Slider cường độ: nhãn và giá trị cho screen reader. */
    cuongDo: 'Cường độ',
    cuongDoGiaTri: (n: number) => `${n} trên 5`,
    viChuyenGi: 'Vì chuyện gì?',
    toiDaTag: (n: number) => `Tối đa ${n}. Không chọn cũng được.`,
    ghiThem: 'Muốn ghi thêm gì không?',
    ghiThemGoiY: 'Muốn viết gì thì viết. Chỉ bạn đọc được.',
    kem: 'Kèm ảnh hay ghi âm?',
    kemGioiHan: (anh: number, phut: number) =>
      `Tối đa ${anh} ảnh và một đoạn ghi âm ${phut} phút. Chỉ nằm trong máy.`,
    boAnhHoi: 'Bỏ ảnh này?',
    anhSo: (i: number) => `Ảnh ${i}`,
    boAnhGoiY: 'Bấm để bỏ ảnh này',
    dangGhi: (da: string, toiDa: string) => `Đang ghi · ${da} / ${toiDa}`,
    dungGhi: 'Dừng ghi',
    loiDung: 'Chưa dừng được. Thử lại.',
    boGhiAm: 'Bỏ ghi âm',
    boGhiAmHoi: 'Bỏ đoạn ghi âm này?',
    chupAnh: 'Chụp ảnh',
    chonAnh: 'Chọn ảnh',
    ghiAm: 'Ghi âm',
    luu: 'Lưu lại',
    thoi: 'Thôi, không ghi nữa',
  },

  lich: {
    tieuDe: 'Lịch',
    chonNam: (nam: number) => `Năm ${nam}, chọn năm khác`,
    /** Nhãn cột tháng: ô rộng ~22, không được quá 3 ký tự hẹp. */
    cot: (thang: number) => `T${thang}`,
    thang: (thang: number, soNgay: number, max: number) =>
      `Tháng ${thang}: khóc ${soNgay} ngày. Ngày nặng nhất, cường độ cộng lại là ${max}.`,
    thangTrong: (thang: number) => `Tháng ${thang}: không có ngày nào khóc.`,
    muc: (tu: number, den?: number) => (den === undefined ? `từ ${tu} trở lên` : `${tu} đến ${den}`),
    chuGiai: (muc: string[]) => `Màu đậm dần theo tổng cường độ trong ngày: ${muc.join(', ')}`,
    dong: 'Đóng',
  },

  caiDat: {
    tieuDe: 'Cài đặt',
    daDangXuat: 'Đã đăng xuất.',
    nhanLoi: 'Nhận lời từ người lạ',
    nhanLoiPhu: 'Tắt thì không nhận thêm lời nào từ người lạ. Việc ghi lại vẫn như cũ.',
    loiDaVietPhu: 'Xem lại, hoặc thu hồi lời đã viết.',
    vietLoiPhu: 'Cần đăng nhập. Tối đa 5 lời trong 24 giờ.',
    taiKhoan: 'Tài khoản',
    dangXuat: 'Đăng xuất',
    dangXuatPhu: 'Những lần khóc vẫn nằm nguyên trên máy.',
    dangNhapPhu: 'Chưa đăng nhập. Chỉ cần khi viết lời cho người lạ.',
    ngonNgu: 'Ngôn ngữ',
  },

  /** Màn một lần khóc (comfort/[entryId].tsx). */
  lanKhoc: {
    loiNhan: 'Chưa nhận được. Thử lại sau một lát.',
    poolRong: (chiVui: boolean) =>
      `Lúc này chưa có lời nào cho ${chiVui ? 'niềm vui' : 'chuyện'} này. Lần này không tính vào lượt của bạn.`,
    hetLuot: 'Bạn đã nhận đủ 3 lời trong 24 giờ qua. Chưa nhận thêm được.',
    khongThay: 'Không tìm thấy',
    khongThayPhu: 'Lần khóc này không còn trong máy.',
    loiTuNguoiLa: 'Lời từ người lạ',
    chuaKep: 'Chưa có lời nào kẹp ở đây.',
    camOn: 'Cảm ơn',
    xin: 'Nhận một lời từ người lạ',
    daTat: 'Bạn đã tắt nhận lời từ người lạ. Có thể đổi trong Cài đặt.',
  },

  viet: {
    hetPhien: 'Phiên đăng nhập đã hết. Đăng nhập lại rồi gửi — chữ bạn gõ vẫn còn đây.',
    hetLuot: 'Bạn đã gửi đủ 5 lời trong 24 giờ qua. Chưa gửi thêm được.',
    loiGui: 'Chưa gửi được. Lời vẫn còn đây — thử gửi lại sau một lát.',
    xongTieuDe: 'Đã nhận lời của bạn',
    xongPhu:
      'Lời này sẽ được duyệt trước, rồi mới tới tay một người lạ. Muốn rút lại thì vào Cài đặt → Lời bạn đã viết.',
    xong: 'Xong',
    moDau: 'Lời này sẽ tới một người lạ vừa khóc vì chuyện tương tự. Hai bên không biết nhau.',
    goiY: 'Kể điều từng giúp bạn, không cần khuyên. Đừng để lại tên, số điện thoại hay mạng xã hội.',
    oNhap: 'Lời cho người lạ',
    oNhapGoiY: 'Viết điều bạn từng muốn nghe.',
    demA11y: (n: number, max: number) => `${n} trên ${max} ký tự`,
    conThieu: (n: number) => ` · còn thiếu ${n} ký tự`,
    vietBang: 'Bạn viết bằng tiếng gì?',
    danhCho: 'Lời này dành cho chuyện gì?',
    chonTag: (max: number, chung: string) =>
      `Chọn 1 hoặc ${max}. Lời hợp với bất kỳ ai đang buồn thì chọn “${chung}”.`,
    /** `khac`: các ngôn ngữ lời sẽ được dịch sang — mọi ngôn ngữ trừ ngôn ngữ người viết chọn. */
    dongY: (khac: Lang[]) =>
      `Bấm Gửi là bạn đồng ý: lời này được duyệt, dịch sang ${noi(khac.map((l) => TEN[l]))}, rồi gửi ẩn danh tới người lạ. Thu hồi được trong Cài đặt → Lời bạn đã viết; ai đã nhận thì vẫn giữ bản của họ.`,
    dangNhapLai: 'Đăng nhập lại',
    gui: 'Gửi',
  },

  /** Lời mình đã viết (comfort/cua-toi.tsx). */
  cuaToi: {
    trangThai: {
      pending: 'Đang chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Không được gửi đi',
      retracted: 'Đã thu hồi',
    },
    loiTai: 'Chưa lấy được danh sách. Kiểm tra mạng rồi thử lại.',
    hoiThuHoi: 'Thu hồi lời này?',
    hoiThuHoiPhu:
      'Lời này sẽ không tới tay thêm ai nữa. Ai đã nhận thì vẫn giữ được. Thu hồi rồi không mở lại được.',
    thuHoi: 'Thu hồi',
    loiThuHoi: 'Chưa thu hồi được. Kiểm tra mạng rồi thử lại.',
    theoTaiKhoan: 'Lời bạn viết được giữ theo tài khoản.',
    dangNhapXem: 'Đăng nhập để xem',
    trong: 'Chưa có lời nào.',
    thuHoiA11y: (dau: string) => `Thu hồi lời: ${dau}`,
    khongHoanTac: 'Không hoàn tác được',
    dangThuHoi: 'Đang thu hồi…',
    thuLai: 'Thử lại',
  },

  dangNhap: {
    daGuiXacMinh: 'Đã gửi thư xác minh tới email của bạn. Xác minh xong thì đăng nhập ở đây.',
    loi: 'Không đăng nhập được. Kiểm tra lại email, mật khẩu và kết nối mạng.',
    giaiThich:
      'Viết cho người lạ thì cần đăng nhập, để giữ an toàn cho người đọc. Người đọc không bao giờ thấy email của bạn. Ghi lại những lần khóc thì không cần.',
    taoMoi: 'Tạo tài khoản mới',
    deSau: 'Để sau',
  },

  taoTaiKhoan: {
    tieuDe: 'Tạo tài khoản',
    khongKhop: 'Hai lần nhập mật khẩu chưa khớp.',
    loiTao:
      'Không tạo được tài khoản. Có thể email này đã có tài khoản — thử Đăng nhập. Hoặc kiểm tra mạng.',
    giaiThich: 'Tài khoản chỉ để viết cho người lạ. Người đọc không bao giờ thấy email của bạn.',
    nhapLai: 'Nhập lại mật khẩu',
    daCo: 'Đã có tài khoản? Đăng nhập',
  },

  /** Màn hotline (help.tsx). Tên đường dây và giờ trực nằm trong hotlines.ts. */
  troGiup: {
    moDau: 'Nếu bạn hoặc ai đó đang gặp nguy hiểm ngay lúc này, gọi cấp cứu.',
    goi: (so: string) => `Gọi ${so}`,
    goiA11y: (ten: string, so: string) => `Gọi ${ten}, số ${so}`,
    moWeb: (ten: string) => `Mở trang web ${ten}`,
    cuoi: 'Danh sách có sẵn trong máy, mở được cả khi không có mạng. Số nào không gọi được thì thử số khác.',
  },
};

export default vi;
export type TuDien = typeof vi;
