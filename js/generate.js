/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / User QR Portal
 * FILE         : generate.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman publik hasil scan QR Generator. Tidak ada login,
 * boleh discan berkali-kali, setiap scan menghasilkan voucher baru.
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
 * - Library eksternal "qrcode" (dimuat di generate.html)
 *
 * Used By
 * - generate.html
 *
 ******************************************************************/

/******************************************************************
 * PAGE INITIALIZATION
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : getGeneratorTokenFromUrl()
 * Tujuan   : Mengambil parameter "token" dari URL QR, contoh:
 *            generate.html?token=ABCDEF
 ******************************************************************/
function getGeneratorTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("token");
}

/******************************************************************
 * Function : initializeGeneratePage()
 * Tujuan   : Memvalidasi token ada di URL sebelum menampilkan form.
 ******************************************************************/
function initializeGeneratePage() {
  const generatorToken = getGeneratorTokenFromUrl();
  const statusMessageElement = document.getElementById("generateStatusMessage");

  if (!generatorToken) {
    document.getElementById("generateFormSection").classList.add("hiddenSection");
    statusMessageElement.textContent = "Link tidak valid: token generator tidak ditemukan.";
    statusMessageElement.className = "statusMessage statusError";
  }
}

/******************************************************************
 * GENERATE VOUCHER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleGenerateFormSubmit()
 * Tujuan   : Mengirim permintaan generate voucher ke backend
 *            berdasarkan token generator, lalu merender JPG-nya.
 ******************************************************************/
async function handleGenerateFormSubmit(submitEvent) {
  submitEvent.preventDefault();

  const generatorToken = getGeneratorTokenFromUrl();
  const statusMessageElement = document.getElementById("generateStatusMessage");
  const resultSectionElement = document.getElementById("voucherResultSection");
  const submitButtonElement = document.getElementById("buttonGenerateVoucher");

  const recipientName = document.getElementById("inputRecipientName").value;
  const organization = document.getElementById("inputOrganization").value;

  submitButtonElement.disabled = true;
  statusMessageElement.textContent = "Membuat voucher...";
  statusMessageElement.className = "statusMessage";
  resultSectionElement.innerHTML = "";

  try {
    const deviceInfo = buildDeviceInfo();
    const voucher = await apiUserGenerate(generatorToken, recipientName, organization, deviceInfo);

    statusMessageElement.textContent = "Voucher berhasil dibuat.";
    statusMessageElement.className = "statusMessage statusSuccess";

    const jpegBlob = await renderVoucherToJpegBlob(voucher.TEMPLATE_CODE, {
      recipientName: voucher.RECIPIENT_NAME,
      organization: voucher.ORGANIZATION,
      serialNumber: voucher.SERIAL_NUMBER,
      expiredDisplay: "Berlaku s/d " + formatDateIndo(voucher.EXPIRED_AT),
      qrValue: voucher.TOKEN
    });

    const objectUrl = URL.createObjectURL(jpegBlob);

    const previewImageElement = document.createElement("img");
    previewImageElement.className = "voucherPreviewImage";
    previewImageElement.src = objectUrl;
    resultSectionElement.appendChild(previewImageElement);

    const downloadLinkElement = document.createElement("a");
    downloadLinkElement.href = objectUrl;
    downloadLinkElement.download = voucher.SERIAL_NUMBER + ".jpg";
    downloadLinkElement.textContent = "Download Voucher";
    downloadLinkElement.className = "formButton";
    downloadLinkElement.style.display = "block";
    downloadLinkElement.style.textAlign = "center";
    downloadLinkElement.style.textDecoration = "none";
    downloadLinkElement.style.marginTop = "12px";
    resultSectionElement.appendChild(downloadLinkElement);

    document.getElementById("generateFormSection").classList.add("hiddenSection");
  } catch (error) {
    console.error("[USER GENERATE]", error);
    statusMessageElement.textContent = "Gagal: " + error.message;
    statusMessageElement.className = "statusMessage statusError";
    submitButtonElement.disabled = false;
  }
}

/******************************************************************
 * EVENT BINDING
 * ----------------------------------------------------------------
 ******************************************************************/
document.getElementById("generateForm").addEventListener("submit", handleGenerateFormSubmit);

initializeGeneratePage();