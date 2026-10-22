const { google } = require('googleapis');
const creds = require('../google-service-account.json');

const SPREADSHEET_ID = '10eUWTeN5AmmOkEG4K2gc2DQEF-3PZtSQs1QOtHfiCF4';

const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function init() {
  try {
    console.log('1. Đang kết nối tới Google Spreadsheet:', SPREADSHEET_ID);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    console.log('Tiêu đề bảng tính:', meta.data.properties.title);

    const existingSheets = meta.data.sheets.map(s => s.properties.title);
    console.log('Các sheet hiện có:', existingSheets);

    const requiredSheets = ['THIET_BI', 'NHAN_SU', 'MUON_TRA', 'KIEM_KE'];
    const addSheetRequests = [];

    for (const name of requiredSheets) {
      if (!existingSheets.includes(name)) {
        addSheetRequests.push({
          addSheet: {
            properties: {
              title: name,
            },
          },
        });
      }
    }

    if (addSheetRequests.length > 0) {
      console.log('2. Đang tạo các sheet mới:', addSheetRequests.map(r => r.addSheet.properties.title));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: addSheetRequests,
        },
      });
      console.log('Tạo sheet thành công!');
    } else {
      console.log('Tất cả các sheet cần thiết đã tồn tại.');
    }

    // 3. Khởi tạo header và dữ liệu mẫu cho từng sheet
    // A. THIET_BI
    console.log('3. Cập nhật header cho sheet THIET_BI...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'THIET_BI!A1:N1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Mã tài sản',
          'Tên thiết bị',
          'Danh mục',
          'Model',
          'Serial (S/N)',
          'Vị trí hiện tại',
          'Người phụ trách',
          'Người đang giữ',
          'Trạng thái',
          'Lý do sự cố',
          'Hạn trả',
          'Ghi chú phụ kiện',
          'Link ảnh',
          'Ngày cập nhật'
        ]],
      },
    });

    // B. NHAN_SU
    console.log('4. Cập nhật header cho sheet NHAN_SU...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'NHAN_SU!A1:H1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'ID nhân sự',
          'Họ và tên',
          'Email',
          'Số điện thoại',
          'Vai trò (Admin/Manager/Staff)',
          'Trạng thái (active/locked)',
          'Link Avatar',
          'Ngày tạo'
        ]],
      },
    });

    // C. MUON_TRA
    console.log('5. Cập nhật header cho sheet MUON_TRA...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MUON_TRA!A1:P1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Mã giao dịch',
          'Mã tài sản',
          'Tên thiết bị',
          'Người giao',
          'Người nhận',
          'Loại giao dịch',
          'Trạng thái',
          'Hạn trả',
          'Vị trí sau giao',
          'Ghi chú hiện trạng lúc giao',
          'Ảnh hiện trạng lúc giao',
          'Ghi chú hiện trạng lúc nhận',
          'Ảnh hiện trạng lúc nhận',
          'Thời gian tạo',
          'Thời gian xác nhận',
          'Lý do từ chối'
        ]],
      },
    });

    // D. KIEM_KE
    console.log('6. Cập nhật header cho sheet KIEM_KE...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'KIEM_KE!A1:M1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Mã đợt kiểm kê',
          'Tên đợt kiểm kê',
          'Mã tài sản',
          'Tên thiết bị',
          'Thời gian quét',
          'Người quét',
          'Vị trí hệ thống',
          'Vị trí thực tế',
          'Người giữ hệ thống',
          'Người giữ thực tế',
          'Tình trạng thực tế',
          'Có sai lệch?',
          'Chi tiết sai lệch'
        ]],
      },
    });

    console.log('🎉 Hoàn tất kết nối và tạo cấu trúc dữ liệu trên Google Sheets!');
  } catch (err) {
    console.error('Lỗi kết nối Google Sheets:', err.message);
    if (err.message && err.message.includes('The caller does not have permission')) {
      console.error('\n⚠️ LƯU Ý: Vui lòng mở Google Sheets và bấm nút [Chia sẻ] (Share) cho email:');
      console.error(creds.client_email);
      console.error('với quyền "Người chỉnh sửa" (Editor)!\n');
    }
  }
}

init();
