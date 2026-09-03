/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / Kasir App
 * FILE         : kasir.js
 * VERSION      : v1.2.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-03
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Kasir: CHECK (lihat status voucher) dan USE
 * (pakai voucher). Tidak ada login, ID kasir diambil dari URL.
 * Mendukung scan QR lewat kamera, dengan fallback input manual.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 *
 * v1.1.0
 * - Menambahkan fitur scan QR lewat kamera (jsQR), dengan fallback
 *   input manual yang sudah ada sebelumnya.
 * - Logika pengecekan voucher dipisah ke performVoucherCheck()
 *   supaya bisa dipanggil dari form manual maupun hasil scan.
 *
 * v1.2.0
 * - Memperbaiki bug: satu error tak tertangani di dalam loop scan
 *   membuat proses pemindaian berhenti diam-diam. Sekarang loop
 *   dibungkus try/catch dan tetap lanjut memindai walau ada error.
 * - Meningkatkan resolusi kamera yang diminta (ideal 1280x720)
 *   supaya QR lebih mudah terbaca.
 * - Menambahkan opsi willReadFrequently pada Canvas Context untuk
 *   performa pembacaan pixel yang lebih baik.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - config.js
 * - api.js
 * - Library eksternal "jsQR" (window.jsQR), dimuat lewat file lokal
 *   js/jsQR.min.js di kasir.html.
 *
 * Used By
 * - kasir.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 ******************************************************************/
const SCANNER_CAMERA_FACING_MODE = "environment";

/******************************************************************
 * STATE
 * ----------------------------------------------------------------
 ******************************************************************/
let lastCheckedIdentifier = "";
let cameraStreamActive = null;
let scannerAnimationFrameId = null;

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
 * CAMERA SCANNER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : startCameraScanner()
 * Tujuan   : Mengaktifkan kamera perangkat dan mulai memindai QR
 *            secara real-time dari video stream.
 ******************************************************************/
async function startCameraScanner() {
  const videoElement = document.getElementById("scannerVideo");
  const toggleButtonElement = document.getElementById("buttonToggleScanner");
  const statusMessageElement = document.getElementById("checkStatusMessage");

  try {
    cameraStreamActive = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: SCANNER_CAMERA_FACING_MODE,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    videoElement.srcObject = cameraStreamActive;
    videoElement.style.display = "block";
    await videoElement.play();

    toggleButtonElement.textContent = "Tutup Kamera";
    statusMessageElement.textContent = "Arahkan kamera ke QR voucher.";
    statusMessageElement.className = "statusMessage";

    scannerAnimationFrameId = requestAnimationFrame(scanVideoFrameLoop);
  } catch (error) {
    console.error("[START CAMERA SCANNER]", error);
    statusMessageElement.textContent = "Kamera tidak bisa diakses. Gunakan input manual.";
    statusMessageElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * Function : stopCameraScanner()
 * Tujuan   : Menghentikan kamera dan proses pemindaian QR.
 ******************************************************************/
function stopCameraScanner() {
  const videoElement = document.getElementById("scannerVideo");
  const toggleButtonElement = document.getElementById("buttonToggleScanner");

  if (scannerAnimationFrameId) {
    cancelAnimationFrame(scannerAnimationFrameId);
    scannerAnimationFrameId = null;
  }

  if (cameraStreamActive) {
    cameraStreamActive.getTracks().forEach(function (track) {
      track.stop();
    });
    cameraStreamActive = null;
  }

  videoElement.style.display = "none";
  toggleButtonElement.textContent = "Buka Kamera / Scan QR";
}

/******************************************************************
 * Function : handleToggleScannerButtonClick()
 * Tujuan   : Membuka atau menutup kamera saat tombol ditekan.
 ******************************************************************/
function handleToggleScannerButtonClick() {
  if (cameraStreamActive) {
    stopCameraScanner();
  } else {
    startCameraScanner();
  }
}

/******************************************************************
 * Function : scanVideoFrameLoop()
 * Tujuan   : Membaca frame video saat ini, mencoba mendekode QR
 *            memakai jsQR, dan mengulang lewat requestAnimationFrame
 *            selama kamera masih aktif.
 ******************************************************************/
function scanVideoFrameLoop() {
  const videoElement = document.getElementById("scannerVideo");
  const hiddenCanvasElement = document.getElementById("scannerCanvasHidden");

  try {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      hiddenCanvasElement.width = videoElement.videoWidth;
      hiddenCanvasElement.height = videoElement.videoHeight;

      const canvasContext = hiddenCanvasElement.getContext("2d", { willReadFrequently: true });
      canvasContext.drawImage(videoElement, 0, 0, hiddenCanvasElement.width, hiddenCanvasElement.height);

      const imageData = canvasContext.getImageData(0, 0, hiddenCanvasElement.width, hiddenCanvasElement.height);
      const decodedQrCode = window.jsQR(imageData.data, imageData.width, imageData.height);

      if (decodedQrCode && decodedQrCode.data) {
        handleQrCodeDetected(decodedQrCode.data);
        return;
      }
    }
  } catch (error) {
    console.error("[SCAN QR FRAME]", error);
  }

  scannerAnimationFrameId = requestAnimationFrame(scanVideoFrameLoop);
}

/******************************************************************
 * Function : handleQrCodeDetected()
 * Tujuan   : Dipanggil saat QR berhasil terbaca oleh kamera.
 *            Mengisi input manual, menutup kamera, lalu langsung
 *            menjalankan pengecekan voucher.
 ******************************************************************/
function handleQrCodeDetected(qrValue) {
  document.getElementById("inputIdentifier").value = qrValue;
  stopCameraScanner();
  performVoucherCheck(qrValue);
}

/******************************************************************
 * CHECK VOUCHER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleCheckFormSubmit()
 * Tujuan   : Mengecek status voucher dari input manual Kasir.
 ******************************************************************/
function handleCheckFormSubmit(submitEvent) {
  submitEvent.preventDefault();
  const identifier = document.getElementById("inputIdentifier").value.trim();
  performVoucherCheck(identifier);
}

/******************************************************************
 * Function : performVoucherCheck()
 * Tujuan   : Logika inti pengecekan voucher, dipakai bersama oleh
 *            form manual maupun hasil scan kamera.
 ******************************************************************/
async function performVoucherCheck(identifier) {
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
document.getElementById("buttonToggleScanner").addEventListener("click", handleToggleScannerButtonClick);
