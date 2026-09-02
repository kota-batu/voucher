/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / Kasir App
 * FILE         : kasir.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Kasir: CHECK (lihat status voucher) dan USE
 * (pakai voucher). Tidak ada login, ID kasir diambil dari URL.
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
 *
 * Used By
 * - kasir.html
 *
 ******************************************************************/

/******************************************************************
 * STATE
 * ----------------------------------------------------------------
 * Menyimpan identifier terakhir yang dicek, supaya tombol "Gunakan
 * Voucher" tahu voucher mana yang harus dipakai.
 ******************************************************************/
let lastCheckedIdentifier = "";

/******************************************************************
 * CASHIER ID
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : getCashierIdFromUrl()
 * Tujuan   : Mengambil ID Kasir dari URL, contoh:
 *            kasir.html?cashier=CASHIER_ID
 ******************************************************************/
function getCashierIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("cashier") || "";
}

/******************************************************************
 * CHECK VOUCHER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleCheckFormSubmit()
 * Tujuan   : Mengecek status voucher berdasarkan input Kasir.
 ******************************************************************/
async function handleCheckFormSubmit(submitEvent) {
  submitEvent.preventDefault();

  const identifier = document.getElementById("inputIdentifier").value.trim();
  const statusMessageElement = document.getElementById("checkStatusMessage");
  const useButtonElement = document.getElementById("buttonUseVoucher");

  statusMessageElement.textContent = "Mengecek voucher...";
  statusMessageElement.className = "statusMessage";
  useButtonElement.classList.add("hiddenSection");

  try {
    const checkResult = await apiCashierCheck(identifier);
    lastCheckedIdentifier = identifier;

    renderCheckResult(checkResult);
  } catch (error) {
    console.error("[CASHIER CHECK]", error);
    statusMessageElement.textContent = "Gagal mengecek: " + error.message;
    statusMessageElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * Function : renderCheckResult()
 * Tujuan   : Menampilkan hasil pengecekan dan menampilkan tombol
 *            "Gunakan Voucher" hanya jika status VALID.
 ******************************************************************/
function renderCheckResult(checkResult) {
  const statusMessageElement = document.getElementById("checkStatusMessage");
  const useButtonElement = document.getElementById("buttonUseVoucher");

  const statusLabelMap = {
    VALID: "VALID - Voucher boleh dipakai",
    EXPIRED: "EXPIRED - Voucher sudah kedaluwarsa",
    SUDAH_DIGUNAKAN: "SUDAH DIGUNAKAN",
    VOUCHER_TIDAK_DITEMUKAN: "VOUCHER TIDAK DITEMUKAN"
  };

  statusMessageElement.textContent = statusLabelMap[checkResult.status] || checkResult.status;

  if (checkResult.status === "VALID") {
    statusMessageElement.className = "statusMessage statusSuccess";
    useButtonElement.classList.remove("hiddenSection");
  } else {
    statusMessageElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * USE VOUCHER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleUseButtonClick()
 * Tujuan   : Memakai voucher yang terakhir dicek (status VALID).
 ******************************************************************/
async function handleUseButtonClick() {
  const statusMessageElement = document.getElementById("checkStatusMessage");
  const useButtonElement = document.getElementById("buttonUseVoucher");
  const cashierId = getCashierIdFromUrl();

  useButtonElement.disabled = true;
  statusMessageElement.textContent = "Memproses penggunaan voucher...";
  statusMessageElement.className = "statusMessage";

  try {
    await apiCashierUse(lastCheckedIdentifier, cashierId);

    statusMessageElement.textContent = "Voucher berhasil digunakan.";
    statusMessageElement.className = "statusMessage statusSuccess";
    useButtonElement.classList.add("hiddenSection");
    document.getElementById("inputIdentifier").value = "";
  } catch (error) {
    console.error("[CASHIER USE]", error);
    statusMessageElement.textContent = "Gagal memakai voucher: " + error.message;
    statusMessageElement.className = "statusMessage statusError";
  } finally {
    useButtonElement.disabled = false;
  }
}

/******************************************************************
 * EVENT BINDING
 * ----------------------------------------------------------------
 ******************************************************************/
document.getElementById("checkForm").addEventListener("submit", handleCheckFormSubmit);
document.getElementById("buttonUseVoucher").addEventListener("click", handleUseButtonClick);