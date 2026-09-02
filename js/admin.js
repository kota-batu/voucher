/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / Admin App
 * FILE         : admin.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Admin App: login, generate voucher batch (1-100),
 * lalu render + download tiap voucher sebagai JPG di browser.
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
 * - api.js
 * - renderer.js
 * - Library eksternal "qrcode" (dimuat di admin.html)
 *
 * Used By
 * - admin.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 ******************************************************************/
const ADMIN_SESSION_STORAGE_KEY = "voucher_admin_session";

/******************************************************************
 * SESSION HANDLING
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : saveAdminSession()
 * Tujuan   : Menyimpan sessionToken di sessionStorage browser,
 *            supaya Admin tidak perlu login ulang tiap reload.
 ******************************************************************/
function saveAdminSession(sessionToken, adminName) {
  sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({
    sessionToken: sessionToken,
    adminName: adminName
  }));
}

/******************************************************************
 * Function : getAdminSession()
 * Tujuan   : Mengambil session Admin yang tersimpan, atau null
 *            jika belum login.
 ******************************************************************/
function getAdminSession() {
  const rawSession = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  return rawSession ? JSON.parse(rawSession) : null;
}

/******************************************************************
 * Function : clearAdminSession()
 * Tujuan   : Menghapus session Admin dari sessionStorage.
 ******************************************************************/
function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

/******************************************************************
 * PAGE INITIALIZATION
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : initializeAdminPage()
 * Tujuan   : Menentukan tampilan awal (form login atau dashboard)
 *            berdasarkan ada/tidaknya session tersimpan.
 ******************************************************************/
function initializeAdminPage() {
  const existingSession = getAdminSession();

  if (existingSession) {
    showDashboardSection(existingSession.adminName);
    loadVoucherTypesIntoDropdown();
  } else {
    showLoginSection();
  }
}

/******************************************************************
 * Function : showLoginSection()
 * Tujuan   : Menampilkan form login, menyembunyikan dashboard.
 ******************************************************************/
function showLoginSection() {
  document.getElementById("loginSection").classList.remove("hiddenSection");
  document.getElementById("dashboardSection").classList.add("hiddenSection");
}

/******************************************************************
 * Function : showDashboardSection()
 * Tujuan   : Menampilkan dashboard, menyembunyikan form login.
 ******************************************************************/
function showDashboardSection(adminName) {
  document.getElementById("loginSection").classList.add("hiddenSection");
  document.getElementById("dashboardSection").classList.remove("hiddenSection");
  document.getElementById("dashboardWelcomeText").textContent = "Halo, " + adminName;
}

/******************************************************************
 * LOGIN
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleLoginFormSubmit()
 * Tujuan   : Mengirim username/password ke backend, simpan session
 *            jika berhasil.
 ******************************************************************/
async function handleLoginFormSubmit(submitEvent) {
  submitEvent.preventDefault();

  const loginStatusElement = document.getElementById("loginStatusMessage");
  const username = document.getElementById("inputLoginUsername").value;
  const password = document.getElementById("inputLoginPassword").value;

  loginStatusElement.textContent = "Memproses login...";
  loginStatusElement.className = "statusMessage";

  try {
    const loginResult = await apiAdminLogin(username, password);
    saveAdminSession(loginResult.sessionToken, loginResult.name);

    loginStatusElement.textContent = "";
    showDashboardSection(loginResult.name);
    loadVoucherTypesIntoDropdown();
  } catch (error) {
    console.error("[ADMIN LOGIN]", error);
    loginStatusElement.textContent = "Login gagal: " + error.message;
    loginStatusElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * Function : handleLogoutButtonClick()
 * Tujuan   : Logout Admin dan kembali ke form login.
 ******************************************************************/
async function handleLogoutButtonClick() {
  const currentSession = getAdminSession();

  if (currentSession) {
    try {
      await apiAdminLogout(currentSession.sessionToken);
    } catch (error) {
      console.error("[ADMIN LOGOUT]", error);
    }
  }

  clearAdminSession();
  showLoginSection();
}

/******************************************************************
 * VOUCHER TYPE DROPDOWN
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : loadVoucherTypesIntoDropdown()
 * Tujuan   : Mengisi dropdown "Jenis Voucher" dari backend.
 ******************************************************************/
async function loadVoucherTypesIntoDropdown() {
  const dropdownElement = document.getElementById("selectVoucherType");
  dropdownElement.innerHTML = "<option value=''>Memuat...</option>";

  try {
    const voucherTypes = await apiGetVoucherTypes();

    dropdownElement.innerHTML = "";
    voucherTypes.forEach(function (voucherType) {
      const optionElement = document.createElement("option");
      optionElement.value = voucherType.ID;
      optionElement.textContent = voucherType.NAME;
      dropdownElement.appendChild(optionElement);
    });
  } catch (error) {
    console.error("[LOAD VOUCHER TYPES]", error);
    dropdownElement.innerHTML = "<option value=''>Gagal memuat jenis voucher</option>";
  }
}

/******************************************************************
 * GENERATE VOUCHER BATCH
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleGenerateFormSubmit()
 * Tujuan   : Mengirim permintaan generate batch ke backend, lalu
 *            merender tiap voucher hasilnya menjadi JPG.
 ******************************************************************/
async function handleGenerateFormSubmit(submitEvent) {
  submitEvent.preventDefault();

  const generateStatusElement = document.getElementById("generateStatusMessage");
  const voucherResultListElement = document.getElementById("voucherResultList");
  voucherResultListElement.innerHTML = "";

  const currentSession = getAdminSession();
  const typeId = document.getElementById("selectVoucherType").value;
  const recipientName = document.getElementById("inputRecipientName").value;
  const organization = document.getElementById("inputOrganization").value;
  const quantity = document.getElementById("inputQuantity").value;

  generateStatusElement.textContent = "Membuat voucher...";
  generateStatusElement.className = "statusMessage";

  try {
    const generatedVouchers = await apiAdminGenerateBatch(
      currentSession.sessionToken,
      typeId,
      recipientName,
      organization,
      quantity
    );

    generateStatusElement.textContent = generatedVouchers.length + " voucher berhasil dibuat.";
    generateStatusElement.className = "statusMessage statusSuccess";

    for (const voucher of generatedVouchers) {
      await renderAndAppendVoucherCard(voucher);
    }
  } catch (error) {
    console.error("[GENERATE BATCH]", error);
    generateStatusElement.textContent = "Gagal generate: " + error.message;
    generateStatusElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * Function : renderAndAppendVoucherCard()
 * Tujuan   : Merender satu voucher menjadi JPG dan menampilkannya
 *            sebagai kartu dengan tombol download.
 ******************************************************************/
async function renderAndAppendVoucherCard(voucher) {
  const voucherResultListElement = document.getElementById("voucherResultList");

  const cardElement = document.createElement("div");
  cardElement.className = "voucherResultCard";
  cardElement.textContent = "Merender " + voucher.SERIAL_NUMBER + "...";
  voucherResultListElement.appendChild(cardElement);

  try {
    const jpegBlob = await renderVoucherToJpegBlob(voucher.TEMPLATE_CODE, {
      recipientName: voucher.RECIPIENT_NAME,
      organization: voucher.ORGANIZATION,
      serialNumber: voucher.SERIAL_NUMBER,
      expiredDisplay: "Berlaku s/d " + formatDateIndo(voucher.EXPIRED_AT),
      qrValue: voucher.TOKEN
    });

    const objectUrl = URL.createObjectURL(jpegBlob);

    cardElement.innerHTML = "";

    const titleElement = document.createElement("strong");
    titleElement.textContent = voucher.SERIAL_NUMBER;
    cardElement.appendChild(titleElement);

    const previewImageElement = document.createElement("img");
    previewImageElement.className = "voucherPreviewImage";
    previewImageElement.src = objectUrl;
    cardElement.appendChild(previewImageElement);

    const downloadLinkElement = document.createElement("a");
    downloadLinkElement.href = objectUrl;
    downloadLinkElement.download = voucher.SERIAL_NUMBER + ".jpg";
    downloadLinkElement.textContent = "Download JPG";
    downloadLinkElement.className = "formButton";
    downloadLinkElement.style.display = "block";
    downloadLinkElement.style.textAlign = "center";
    downloadLinkElement.style.textDecoration = "none";
    downloadLinkElement.style.marginTop = "8px";
    cardElement.appendChild(downloadLinkElement);
  } catch (error) {
    console.error("[RENDER VOUCHER CARD]", error);
    cardElement.textContent = "Gagal render " + voucher.SERIAL_NUMBER + ": " + error.message;
  }
}

/******************************************************************
 * EVENT BINDING
 * ----------------------------------------------------------------
 ******************************************************************/
document.getElementById("loginForm").addEventListener("submit", handleLoginFormSubmit);
document.getElementById("generateForm").addEventListener("submit", handleGenerateFormSubmit);
document.getElementById("buttonLogout").addEventListener("click", handleLogoutButtonClick);

initializeAdminPage();