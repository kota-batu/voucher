/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / User QR Portal (Voucher Oleh-Oleh)
 * FILE         : generate-oleholeh.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-03
 * LAST UPDATE  : 2026-09-03
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Halaman generate voucher KHUSUS "Voucher Oleh-Oleh". Token
 * generator sudah ditanam di config.js (GENERATOR_TOKEN_OLEHOLEH),
 * jadi tidak perlu parameter ?token= di URL. Tidak ada login,
 * boleh dibuka/scan berkali-kali, tiap kali menghasilkan voucher
 * baru.
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
 * - Library eksternal "qrcode" (dimuat lewat file lokal
 *   js/qrcode.min.js di generate-oleholeh.html)
 *
 * Used By
 * - generate-oleholeh.html
 *
 ******************************************************************/

/******************************************************************
 * GENERATE VOUCHER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : handleGenerateFormSubmit()
 * Tujuan   : Mengirim permintaan generate voucher ke backend
 *            memakai GENERATOR_TOKEN_OLEHOLEH, lalu merender JPG.
 ******************************************************************/
async function handleGenerateFormSubmit(submitEvent) {
  submitEvent.preventDefault();

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
    const voucher = await apiUserGenerate(
      GENERATOR_TOKEN_OLEHOLEH,
      recipientName,
      organization,
      deviceInfo
    );

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
    console.error("[USER GENERATE OLEHOLEH]", error);
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
