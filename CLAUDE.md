# Dự án Bản đồ (Map Viewer)

## Tổng quan

Website bản đồ tương tác một file duy nhất (`index.html`), không cần backend, không cần API key, không cần billing.

- **File chính:** `index.html`
- **Ngôn ngữ giao diện:** Tiếng Việt
- **Thư viện bản đồ:** Leaflet.js v1.9.4
- **Tile layers:**
  - Bản đồ: OpenStreetMap
  - Vệ tinh: ESRI World Imagery (miễn phí, không cần API key)
  - Vệ tinh + đường: ESRI + OSM overlay opacity 0.45
- **Layer control:** `L.control.layers()` góc trên phải, không thu gọn
- **Geocoding / Tìm kiếm:** Nominatim API (OpenStreetMap, miễn phí)
- **Lưu trữ dữ liệu:** File `data.xml` (tải xuống tự động sau mỗi thay đổi)
- **Cách chạy:** Mở `index.html` trực tiếp trên trình duyệt (không cần server)

---

## Cấu trúc layout

```
┌─────────────────────────────────────────────┐
│  Header (xanh #1a73e8) + nút toggle sidebar │
├─────────────────────────────────────────────┤
│  Search bar (trắng, flex-wrap)              │
├────────────────────────────┬────────────────┤
│                            │  Sidebar       │
│         Map (flex:1)       │  280px         │
│                            │  (ẩn/hiện)     │
└────────────────────────────┴────────────────┘
  Modal overlay (fixed, z-index 5000) — ẩn mặc định
```

---

## Màu sắc & Design

| Thành phần | Màu |
|---|---|
| Primary / Header | `#1a73e8` (xanh Google) |
| Primary hover | `#1557b0` |
| Button gray | `#5f6368` |
| Button gray hover | `#3c4043` |
| Nền sidebar | `#f8f9fa` |
| Border | `#e0e0e0` |
| Text chính | `#202124` |
| Text phụ | `#666`, `#999` |
| Xóa / nguy hiểm | `#d93025` |

**Font:** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`

---

## Màu marker (5 lựa chọn)

| Tên | Hex |
|---|---|
| Đỏ (mặc định) | `#e53935` |
| Xanh lam | `#1a73e8` |
| Xanh lá | `#43a047` |
| Cam | `#f57c00` |
| Tím | `#8e24aa` |

Marker hình pin SVG (`28×36px`), có vòng tròn trắng ở giữa. Icon tạo bằng `L.divIcon`.

---

## Tính năng

### 1. Tìm kiếm địa điểm (Nominatim)
- Gợi ý tự động sau 400ms khi gõ ≥ 3 ký tự
- Nhấn Enter hoặc nút "Tìm kiếm" để search
- Nhấn Escape để đóng dropdown
- Kết quả trả về tiếng Việt (`accept-language=vi`)
- Chỉ di chuyển bản đồ đến kết quả, **không tự động thêm marker**

### 2. Tìm kiếm theo tọa độ
- 2 ô nhập số: Lat (`-90` đến `90`), Lng (`-180` đến `180`)
- Nút "Đến tọa độ" → `map.setView([lat, lng], 15)`
- Chỉ di chuyển bản đồ, **không tự động thêm marker**

### 3. Vị trí tôi
- Dùng `navigator.geolocation.getCurrentPosition`
- Chỉ di chuyển bản đồ đến vị trí GPS, **không tự động thêm marker**

### 4. Thêm địa điểm (click map)
- Click bất kỳ vị trí trên bản đồ → mở modal form
- Form gồm: Tên (*bắt buộc*), Mô tả ngắn, Ghi chú, Hình ảnh (URL), Đường link web, Màu marker
- Trường hình ảnh: nhập URL → hiện preview ảnh ngay trong modal; ẩn nếu URL lỗi
- Trường link web: hiển thị trong popup dạng `<a>` mở tab mới
- Lưu object vào mảng `locations` → `localStorage`
- Tên trường: `{ id, lat, lng, name, desc, note, image, link, color }`
- `id` = `Date.now()`

### 5. Popup thông tin marker
- Hiển thị: Tên, Mô tả, Ghi chú, Tọa độ
- Có nút **Sửa** và **Xóa** trong popup
- Tọa độ hiển thị đến 5 chữ số thập phân

### 6. Chỉnh sửa địa điểm
- Mở modal với dữ liệu đã điền sẵn
- Gọi từ popup trên bản đồ hoặc từ sidebar

### 7. Xóa địa điểm
- Xác nhận bằng `confirm()` trước khi xóa
- Gọi từ popup hoặc sidebar

### 8. Sidebar danh sách
- Hiển thị tất cả địa điểm đã lưu
- Toggle ẩn/hiện bằng nút trên header (có badge số lượng)
- Mỗi item: màu pin, tên, mô tả, tọa độ
- Click item → `map.flyTo()` zoom đến marker, mở popup sau 850ms
- Hover → hiện nút Sửa/Xóa
- Animation toggle: `width 0.25s ease, opacity 0.25s ease`

### 9. Lưu trữ XML
- File: `data.xml` trong cùng thư mục với `index.html`
- Format: XML với root `<locations>`, mỗi địa điểm là thẻ `<location>`
- Trường: `id, lat, lng, name, desc, note, image, link, color`
- **Auto-save**: mỗi khi add/edit/delete → tự tải xuống `data.xml` (debounce 800ms)
- **Lưu thủ công**: nút "💾 Lưu XML" trên toolbar
- **Mở file**: nút "📂 Mở XML" → file picker chọn `data.xml`
- **Auto-load khi mở trang**: `fetch('./data.xml')` — chỉ hoạt động khi chạy qua HTTP server (không hoạt động từ `file://`)

---

## Các hàm JavaScript chính

| Hàm | Mục đích |
|---|---|
| `renderMarkers()` | Xóa và vẽ lại toàn bộ marker từ `locations` |
| `renderSidebar()` | Render lại danh sách sidebar |
| `save()` | Lưu `locations` vào localStorage, gọi render |
| `openModal(title, name, desc, note, color, lat, lng)` | Mở modal thêm/sửa |
| `closeModal()` | Đóng modal, reset `pendingLatLng` và `editingId` |
| `saveLocation()` | Xử lý submit form (thêm mới hoặc cập nhật) |
| `flyTo(id)` | Bay đến marker theo id, mở popup |
| `editLocation(id)` | Mở modal sửa với dữ liệu điền sẵn |
| `deleteLocation(id)` | Xóa địa điểm sau confirm |
| `createIcon(color)` | Tạo Leaflet divIcon dạng pin SVG theo màu |
| `setImagePreview(url)` | Hiển thị/ẩn preview ảnh trong modal theo URL |
| `makePopupHtml(loc)` | Tạo HTML nội dung popup (có escape XSS) |
| `esc(str)` | Escape HTML để chống XSS |
| `toggleSidebar()` | Toggle ẩn/hiện sidebar |
| `goToCoords()` | Di chuyển bản đồ theo tọa độ nhập tay |
| `goToMyLocation()` | Di chuyển bản đồ đến vị trí GPS |
| `fetchSuggestions(query)` | Gọi Nominatim lấy gợi ý |
| `selectResult(item)` | Chọn kết quả tìm kiếm, di chuyển bản đồ |
| `searchLocation()` | Tìm kiếm khi nhấn Enter/button |

---

## Biến trạng thái

| Biến | Kiểu | Mô tả |
|---|---|---|
| `locations` | `Array` | Danh sách địa điểm đã lưu |
| `leafletMarkers` | `Object` | Map `id → L.marker` |
| `pendingLatLng` | `Object\|null` | Tọa độ đang chờ lưu từ click map |
| `editingId` | `number\|null` | ID đang chỉnh sửa (`null` = thêm mới) |
| `selectedColor` | `string` | Màu hex đang chọn trong modal |
| `sidebarVisible` | `boolean` | Trạng thái hiển thị sidebar |
| `STORAGE_KEY` | `string` | `'map_locations'` |

---

## Cấu hình bản đồ mặc định

```javascript
center: [21.0285, 105.8542]  // Hà Nội
zoom: 13
maxZoom: 19
```

---

## Lưu ý kỹ thuật

- **XSS**: Mọi dữ liệu người dùng đều đi qua hàm `esc()` (HTML) hoặc `xmlEsc()` (XML) trước khi render
- **Nominatim rate limit**: 1 request/giây — debounce 400ms đã xử lý
- **file:// protocol**: Leaflet hoạt động bình thường từ `file://`, không cần server
- **Google Maps**: Đã thử nhưng bỏ vì yêu cầu billing riêng cho tài khoản ở India; chuyển sang Leaflet + OpenStreetMap hoàn toàn miễn phí
- **Geolocation**: Hoạt động trên `file://` trên hầu hết trình duyệt hiện đại; nếu không được cần chạy qua `localhost`
