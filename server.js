import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Cấu hình __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 2626;
const HOST = '0.0.0.0'; // 0.0.0.0 cho phép truy cập từ các thiết bị khác cùng mạng

// Phục vụ các file tĩnh từ thư mục 'dist' (Thư mục build của Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Cấu hình fallback xử lý routing cho SPA (React/Vue/Svelte)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 GalleryFlow Server đang chạy!`);
  console.log(`🌍 Local:      http://localhost:${PORT}`);
  console.log(`📡 Mạng LAN:   http://192.168.110.2:${PORT}`);
  console.log(`\n💡 Lưu ý: Hãy chắc chắn bạn đã chạy lệnh 'yarn build' để tạo thư mục dist/`);
});