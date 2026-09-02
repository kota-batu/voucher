/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / Configuration
 * FILE         : config.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Menyimpan seluruh CONSTANTS dan CONFIGURATION global untuk
 * frontend: URL Apps Script, dan layout koordinat tiap template
 * voucher (QR, nama, instansi, nomor seri, expired).
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - Menambahkan layout template "OLEHOLEH".
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - (tidak ada)
 *
 * Used By
 * - renderer.js
 * - api.js
 * - admin.js
 * - generate.js
 * - kasir.js
 *
 ******************************************************************/

/******************************************************************
 * BACKEND CONFIGURATION
 * ----------------------------------------------------------------
 ******************************************************************/
const CONFIG_EXEC_URL = "https://script.google.com/macros/s/AKfycbxWrnfsQABBxEFAKUb5gcRS16zgBKCQWacTa-5t5ieFUJrJbarBgWDe0AhPLorhjhTi/exec";

/******************************************************************
 * RENDER CONFIGURATION
 * ----------------------------------------------------------------
 * Pengaturan umum proses render Canvas -> JPG.
 ******************************************************************/
const RENDER_JPEG_QUALITY   = 0.88;
const RENDER_FONT_FAMILY    = "Arial, sans-serif";
const RENDER_FONT_MAX_SIZE  = 40;
const RENDER_FONT_MIN_SIZE  = 18;
const RENDER_LINE_HEIGHT_RATIO = 1.15;
const RENDER_TEXT_COLOR_BLACK = "#000000";
const RENDER_TEXT_COLOR_RED   = "#D32F2F";
const RENDER_BOX_BACKGROUND   = "#FFFFFF";

/******************************************************************
 * TEMPLATE LAYOUTS
 * ----------------------------------------------------------------
 * Setiap key merupakan CODE pada sheet VOUCHER_TYPES / TEMPLATES.
 * Semua koordinat "cx"/"cy" adalah titik tengah area (bukan pojok
 * kiri atas), sesuai data yang diberikan oleh desainer template.
 ******************************************************************/
const TEMPLATE_LAYOUTS = {
  OLEHOLEH: {
    imageUrl: "assets/templates/voucher-oleh-oleh.png",
    qr:        { w: 371, h: 371, cx: 422.50, cy: 930.50 },
    nama:      { w: 592, h: 96,  cx: 413.00, cy: 234.00, color: RENDER_TEXT_COLOR_BLACK, bold: false },
    instansi:  { w: 592, h: 96,  cx: 413.00, cy: 407.00, color: RENDER_TEXT_COLOR_BLACK, bold: false },
    noVoucher: { w: 592, h: 96,  cx: 413.00, cy: 580.00, color: RENDER_TEXT_COLOR_BLACK, bold: false },
    expired:   { w: 592, h: 96,  cx: 413.00, cy: 686.00, color: RENDER_TEXT_COLOR_RED,   bold: true }
  }
};