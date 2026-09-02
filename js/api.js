/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / API Bridge
 * FILE         : api.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Jembatan komunikasi antara Frontend (GitHub Pages) dan Backend
 * Apps Script. Semua pemanggilan ke CONFIG_EXEC_URL wajib lewat
 * file ini, supaya format request/response konsisten.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - config.js
 *
 * Used By
 * - admin.js
 * - generate.js
 * - kasir.js
 *
 ******************************************************************/

/******************************************************************
 * LOW LEVEL REQUEST
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : callBackendGet()
 * Tujuan   : Memanggil backend lewat GET, dipakai untuk action
 *            yang sifatnya membaca data saja.
 ******************************************************************/
async function callBackendGet(action, paramsObject) {
  const queryParams = new URLSearchParams(Object.assign({ action: action }, paramsObject || {}));
  const requestUrl = CONFIG_EXEC_URL + "?" + queryParams.toString();

  const httpResponse = await fetch(requestUrl, { method: "GET" });
  const responseJson = await httpResponse.json();

  if (!responseJson.ok) {
    console.error("[API GET]", action, responseJson.message);
    throw new Error(responseJson.message || "REQUEST_GAGAL");
  }

  return responseJson.data;
}

/******************************************************************
 * Function : callBackendPost()
 * Tujuan   : Memanggil backend lewat POST, dipakai untuk action
 *            yang mengubah data. Content-Type sengaja "text/plain"
 *            supaya browser tidak mengirim preflight OPTIONS yang
 *            tidak didukung Apps Script.
 ******************************************************************/
async function callBackendPost(action, paramsObject) {
  const requestBody = Object.assign({ action: action }, paramsObject || {});

  const httpResponse = await fetch(CONFIG_EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(requestBody)
  });

  const responseJson = await httpResponse.json();

  if (!responseJson.ok) {
    console.error("[API POST]", action, responseJson.message);
    throw new Error(responseJson.message || "REQUEST_GAGAL");
  }

  return responseJson.data;
}

/******************************************************************
 * PUBLIC API FUNCTIONS
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : apiPing()
 * Tujuan   : Mengecek apakah backend hidup.
 ******************************************************************/
function apiPing() {
  return callBackendGet("ping", {});
}

/******************************************************************
 * Function : apiAdminLogin()
 * Tujuan   : Login Admin, mengembalikan sessionToken.
 ******************************************************************/
function apiAdminLogin(username, password) {
  return callBackendPost("adminLogin", { username: username, password: password });
}

/******************************************************************
 * Function : apiAdminLogout()
 * Tujuan   : Logout Admin, menghapus session di server.
 ******************************************************************/
function apiAdminLogout(sessionToken) {
  return callBackendPost("adminLogout", { sessionToken: sessionToken });
}

/******************************************************************
 * Function : apiGetVoucherTypes()
 * Tujuan   : Mengambil daftar jenis voucher ACTIVE.
 ******************************************************************/
function apiGetVoucherTypes() {
  return callBackendGet("getVoucherTypes", {});
}

/******************************************************************
 * Function : apiAdminGenerateBatch()
 * Tujuan   : Generate 1-100 voucher lewat Admin App.
 ******************************************************************/
function apiAdminGenerateBatch(sessionToken, typeId, recipientName, organization, quantity) {
  return callBackendPost("adminGenerateBatch", {
    sessionToken: sessionToken,
    typeId: typeId,
    recipientName: recipientName,
    organization: organization,
    quantity: quantity
  });
}

/******************************************************************
 * Function : apiUserGenerate()
 * Tujuan   : Generate 1 voucher lewat User QR Portal.
 ******************************************************************/
function apiUserGenerate(generatorToken, recipientName, organization, deviceInfo) {
  return callBackendPost("userGenerate", Object.assign({
    generatorToken: generatorToken,
    recipientName: recipientName,
    organization: organization
  }, deviceInfo || {}));
}

/******************************************************************
 * Function : apiCashierCheck()
 * Tujuan   : Mengecek status voucher (VALID/EXPIRED/dsb).
 ******************************************************************/
function apiCashierCheck(identifier) {
  return callBackendGet("cashierCheck", { identifier: identifier });
}

/******************************************************************
 * Function : apiCashierUse()
 * Tujuan   : Memakai voucher (hanya boleh sekali).
 ******************************************************************/
function apiCashierUse(identifier, cashierId) {
  return callBackendPost("cashierUse", { identifier: identifier, cashierId: cashierId });
}

/******************************************************************
 * DEVICE INFO (RINGAN)
 * ----------------------------------------------------------------
 * Sesuai Blueprint Bagian 12: tidak fingerprinting berat, tidak
 * GPS, cukup info dasar dari navigator/browser.
 ******************************************************************/

/******************************************************************
 * Function : buildDeviceInfo()
 * Tujuan   : Mengumpulkan info ringan perangkat untuk LOG_GENERATE
 *            pada alur User QR (DEVICE_TYPE, OS, BROWSER, TIMEZONE).
 ******************************************************************/
function buildDeviceInfo() {
  const userAgent = navigator.userAgent || "";

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(userAgent);
  const deviceType = isMobile ? "MOBILE" : "DESKTOP";

  let os = "UNKNOWN";
  if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(userAgent)) os = "iOS";
  else if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Mac OS/i.test(userAgent)) os = "Mac";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  let browser = "UNKNOWN";
  if (/Edg\//i.test(userAgent)) browser = "Edge";
  else if (/Chrome\//i.test(userAgent)) browser = "Chrome";
  else if (/Safari\//i.test(userAgent)) browser = "Safari";
  else if (/Firefox\//i.test(userAgent)) browser = "Firefox";

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  return { deviceType: deviceType, os: os, browser: browser, timezone: timezone };
}

/******************************************************************
 * DATE FORMAT HELPER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : formatDateIndo()
 * Tujuan   : Mengubah ISO date string menjadi format DD-MM-YYYY.
 ******************************************************************/
function formatDateIndo(isoDateString) {
  const dateObject = new Date(isoDateString);
  const day = String(dateObject.getDate()).padStart(2, "0");
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const year = dateObject.getFullYear();
  return day + "-" + month + "-" + year;
}