const { google } = require('googleapis');
const creds = require('../google-service-account.json');

const SPREADSHEET_ID = '10eUWTeN5AmmOkEG4K2gc2DQEF-3PZtSQs1QOtHfiCF4';

const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function seed() {
  console.log('Đang nạp dữ liệu khởi tạo lên Google Sheets...');

  // 1. NHAN_SU
  const staffRows = [
    ['u-admin-1', 'Nguyễn Hùng (Admin)', 'hung@matmotmi.vn', '0901 234 567', 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '2025-01-01T08:00:00Z'],
    ['u-mgr-1', 'Trần Thùy Linh (Quản lý thiết bị)', 'linh@matmotmi.vn', '0902 345 678', 'manager', 'active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '2025-01-05T09:00:00Z'],
    ['u-staff-1', 'Lê Minh Tuấn (Photographer)', 'tuan.photo@matmotmi.vn', '0903 456 789', 'staff', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '2025-01-10T10:00:00Z'],
    ['u-staff-2', 'Phạm Hải Đăng (Videographer)', 'dang.film@matmotmi.vn', '0904 567 890', 'staff', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '2025-01-12T11:00:00Z'],
    ['u-staff-3', 'Vũ Phương Thảo (Trợ lý & Ánh sáng)', 'thao.styling@matmotmi.vn', '0905 678 901', 'staff', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '2025-02-01T08:30:00Z'],
    ['u-staff-old', 'Đặng Văn Nam (Đã nghỉ việc)', 'nam.cu@matmotmi.vn', '0906 789 012', 'staff', 'locked', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', '2024-11-01T08:00:00Z']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'NHAN_SU!A2:H7',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: staffRows },
  });
  console.log('✅ Đã nạp danh sách nhân sự lên sheet NHAN_SU');

  // 2. THIET_BI
  const assetRows = [
    ['MMM-CAM-001', 'Body Sony Alpha A7 IV (Chính)', 'camera', 'Sony ILCE-7M4', 'SN-78492019', 'Tủ chống ẩm Tầng 1 - Ngăn A1', 'Trần Thùy Linh', '', 'available', '', '', 'Kèm 2 pin FZ100, 1 sạc đôi, dây đeo Peak Design', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-CAM-002', 'Sony FX3 Cinema Line (Quay Phim)', 'camera', 'Sony ILME-FX3', 'SN-FX3-993821', 'Túi máy quay Show Khách Sạn InterContinental', 'Trần Thùy Linh', 'Lê Minh Tuấn', 'in_use', '', '2026-10-23T18:00:00Z', 'Kèm Top Handle XLR, cage SmallRig, 3 pin FZ100', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-CAM-003', 'Body Canon EOS R6 Mark II', 'camera', 'Canon R6 II Body', 'SN-CN-884920', 'Bàn giao nhận Studio Tầng 1', 'Trần Thùy Linh', 'Lê Minh Tuấn', 'pending_transfer', '', '2026-10-25T20:00:00Z', 'Đang bàn giao sang cho Phạm Hải Đăng đi phóng sự cưới', 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-LENS-001', 'Sony FE 24-70mm f/2.8 GM II', 'lens', 'SEL2470GM2', 'SN-GM-194820', 'Balo máy Tuấn - Show Khách sạn', 'Trần Thùy Linh', 'Lê Minh Tuấn', 'in_use', '', '2026-10-23T18:00:00Z', 'Kính trong veo, có filter B+W UV Nano', 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-LENS-002', 'Sony FE 70-200mm f/2.8 GM OSS II', 'lens', 'SEL70200GM2', 'SN-GM2-004921', 'Cốp xe Hải Đăng', 'Trần Thùy Linh', 'Phạm Hải Đăng', 'alert', 'overdue', '2026-10-19T18:00:00Z', 'Đã quá hạn trả 3 ngày, cần liên hệ Đăng hoàn trả về kho', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-LENS-003', 'Canon RF 50mm f/1.2 L USM', 'lens', 'RF 50mm L', 'SN-RF50-84920', 'Tủ chống ẩm Tầng 1 - Ngăn A2', 'Trần Thùy Linh', '', 'available', '', '', 'Kèm hood che sáng zin, nắp trước sau', 'https://images.unsplash.com/photo-1599818815124-766782559595?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-LIGHT-001', 'Đèn Flash Ngoại Cảnh Godox AD600 Pro', 'lighting', 'AD600Pro', 'SN-GX-600-019', 'Kệ Đèn Studio Tầng 1', 'Trần Thùy Linh', '', 'available', '', '', 'Kèm chóa nhôm, pin zin, sạc, trigger XPro Sony', 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-LIGHT-002', 'Bộ 2 Đèn Nanlite Pavotube II 30X RGB', 'lighting', 'Pavotube II 30X 2Kit', 'SN-NL-30X-284', 'Cốp xe Hải Đăng - Đi quay Pre-wedding', 'Trần Thùy Linh', 'Phạm Hải Đăng', 'in_use', '', '2026-10-24T12:00:00Z', 'Kèm túi đựng, 2 adapter sạc, 2 gá kẹp', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-GIM-001', 'Gimbal Chống Rung DJI RS 3 Pro', 'gimbal_tripod', 'DJI RS 3 Pro Combo', 'SN-DJI-RS3P-88', 'Khu kỹ thuật bảo trì Tầng 2', 'Trần Thùy Linh', '', 'alert', 'damaged', '', 'Trục Pan hơi gắt sau khi quay biển, đang bảo trì', 'https://images.unsplash.com/photo-1589872765891-364506c9e0cf?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-PC-001', 'MacBook Pro 16" M2 Max (Máy dựng 01)', 'computer_storage', 'Apple MBP 16 M2 Max 64GB', 'SN-APL-M2M-849', 'Bàn Dựng Phim 01 - Tầng 2', 'Nguyễn Hùng', '', 'available', '', '', 'Cài sẵn DaVinci Resolve Studio, Premiere Pro', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-ACC-001', 'Bộ Micro Không Dây DJI Mic 2 (2 TX + 1 RX)', 'audio', 'DJI Mic 2 Combo', 'SN-DJI-MIC2-99', 'Tủ phụ kiện Tầng 1 - Hộp Âm Thanh', 'Trần Thùy Linh', '', 'available', '', '', 'Đủ 2 cục phát màu đen, 1 cục nhận, hộp sạc', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', '2026-10-22T08:00:00Z'],
    ['MMM-ACC-002', 'Thẻ Nhớ Sony Tough CFexpress Type A 160GB', 'accessory', 'CEA-G160T', 'SN-TOUGH-160-01', 'Túi máy Tuấn', 'Trần Thùy Linh', 'Lê Minh Tuấn', 'in_use', '', '2026-10-23T18:00:00Z', 'Tốc độ 800MB/s, kèm đầu đọc Sony MRW-G2', 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=600', '2026-10-22T08:00:00Z']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'THIET_BI!A2:N13',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: assetRows },
  });
  console.log('✅ Đã nạp danh sách 12 thiết bị studio lên sheet THIET_BI');

  // 3. MUON_TRA
  const transferRows = [
    ['tr-001', 'MMM-CAM-003', 'Body Canon EOS R6 Mark II', 'Lê Minh Tuấn', 'Phạm Hải Đăng', 'peer_transfer', 'pending', '2026-10-25T20:00:00Z', 'Bàn giao nhận Studio Tầng 1', 'Chuyển cho Đăng máy và 2 pin Canon LP-E6NH', 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600', '', '', '2026-10-22T00:30:00Z', '', ''],
    ['tr-002', 'MMM-CAM-002', 'Sony FX3 Cinema Line (Quay Phim)', 'Trần Thùy Linh', 'Lê Minh Tuấn', 'borrow', 'completed', '2026-10-23T18:00:00Z', 'Túi máy quay Show Khách Sạn InterContinental', 'Bàn giao đầy đủ phụ kiện top handle và sạc', '', 'Đã nhận máy đầy đủ, cảm biến sạch', '', '2026-10-21T08:30:00Z', '2026-10-21T09:00:00Z', '']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MUON_TRA!A2:P3',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: transferRows },
  });
  console.log('✅ Đã nạp lịch sử bàn giao lên sheet MUON_TRA');

  console.log('🎉 Toàn bộ dữ liệu ban đầu đã được nạp thành công lên Google Sheets!');
}

seed();
