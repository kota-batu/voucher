/******************************************************************
 * PROJECT      : Sistem Voucher V1
 * MODULE       : Frontend / Voucher Renderer
 * FILE         : renderer.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Method Team
 * CREATED      : 2026-09-02
 * LAST UPDATE  : 2026-09-02
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Menggabungkan PNG template + data voucher + QR menjadi satu
 * gambar JPG memakai Canvas, sepenuhnya di browser (client-side).
 * Tidak ada file JPG yang disimpan permanen di server.
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
 * - Library eksternal "qrcode" (window.QRCode), dimuat lewat CDN
 *   di file HTML, contoh:
 *   <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
 *
 * Used By
 * - admin.js
 * - generate.js
 *
 ******************************************************************/

/******************************************************************
 * IMAGE LOADER
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : loadImage()
 * Tujuan   : Memuat file gambar (template PNG) menjadi objek
 *            Image yang siap digambar ke Canvas.
 ******************************************************************/
function loadImage(imageUrl) {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = function () {
      resolve(image);
    };
    image.onerror = function (error) {
      console.error("[LOAD IMAGE]", error);
      reject(new Error("GAGAL_MEMUAT_TEMPLATE: " + imageUrl));
    };
    image.src = imageUrl;
  });
}

/******************************************************************
 * QR CODE GENERATOR
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : generateQrCanvas()
 * Tujuan   : Membuat QR code sebagai elemen Canvas, memakai
 *            library eksternal window.QRCode (qrcode.js).
 ******************************************************************/
function generateQrCanvas(qrValue, sizePx) {
  return new Promise(function (resolve, reject) {
    if (!window.QRCode) {
      reject(new Error("LIBRARY_QRCODE_TIDAK_DITEMUKAN"));
      return;
    }

    const qrCanvas = document.createElement("canvas");
    window.QRCode.toCanvas(
      qrCanvas,
      qrValue,
      { width: sizePx, margin: 1 },
      function (error) {
        if (error) {
          console.error("[GENERATE QR]", error);
          reject(error);
          return;
        }
        resolve(qrCanvas);
      }
    );
  });
}

/******************************************************************
 * TEXT FITTING & DRAWING
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : fitTextLines()
 * Tujuan   : Menentukan ukuran font dan pemecahan baris (maksimal
 *            2 baris) supaya teks selalu muat di dalam area yang
 *            sudah ditentukan (Aturan Blueprint Bagian 8).
 ******************************************************************/
function fitTextLines(canvasContext, text, boxWidth, boxHeight) {
  for (let fontSize = RENDER_FONT_MAX_SIZE; fontSize >= RENDER_FONT_MIN_SIZE; fontSize -= 1) {
    canvasContext.font = fontSize + "px " + RENDER_FONT_FAMILY;

    const singleLineWidth = canvasContext.measureText(text).width;
    if (singleLineWidth <= boxWidth) {
      return { fontSize: fontSize, lines: [text] };
    }

    const wrappedLines = wrapTextIntoTwoLines(canvasContext, text, boxWidth);
    const lineHeight = fontSize * RENDER_LINE_HEIGHT_RATIO;
    const totalHeight = lineHeight * wrappedLines.length;

    if (wrappedLines.length <= 2 && totalHeight <= boxHeight) {
      return { fontSize: fontSize, lines: wrappedLines };
    }
  }

  return {
    fontSize: RENDER_FONT_MIN_SIZE,
    lines: wrapTextIntoTwoLines(canvasContext, text, boxWidth)
  };
}

/******************************************************************
 * Function : wrapTextIntoTwoLines()
 * Tujuan   : Memecah teks panjang menjadi maksimal 2 baris
 *            berdasarkan lebar area yang tersedia.
 ******************************************************************/
function wrapTextIntoTwoLines(canvasContext, text, boxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + " " + words[i] : words[i];
    const testWidth = canvasContext.measureText(testLine).width;

    if (testWidth > boxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/******************************************************************
 * Function : drawTextBlock()
 * Tujuan   : Menggambar satu blok teks (nama/instansi/no voucher/
 *            expired) di tengah area yang ditentukan pada layout.
 ******************************************************************/
function drawTextBlock(canvasContext, text, areaLayout, options) {
  const drawBackground = options && options.drawBackground;
  const textColor = (areaLayout.color) || RENDER_TEXT_COLOR_BLACK;
  const isBold = !!areaLayout.bold;

  const boxLeft = areaLayout.cx - (areaLayout.w / 2);
  const boxTop = areaLayout.cy - (areaLayout.h / 2);

  if (drawBackground) {
    canvasContext.fillStyle = RENDER_BOX_BACKGROUND;
    canvasContext.fillRect(boxLeft, boxTop, areaLayout.w, areaLayout.h);
  }

  const fitResult = fitTextLines(canvasContext, text, areaLayout.w, areaLayout.h);
  const lineHeight = fitResult.fontSize * RENDER_LINE_HEIGHT_RATIO;
  const totalTextHeight = lineHeight * fitResult.lines.length;

  canvasContext.font = (isBold ? "bold " : "") + fitResult.fontSize + "px " + RENDER_FONT_FAMILY;
  canvasContext.fillStyle = textColor;
  canvasContext.textAlign = "center";
  canvasContext.textBaseline = "middle";

  let currentY = areaLayout.cy - (totalTextHeight / 2) + (lineHeight / 2);

  fitResult.lines.forEach(function (line) {
    canvasContext.fillText(line, areaLayout.cx, currentY);
    currentY += lineHeight;
  });
}

/******************************************************************
 * MAIN RENDER FUNCTION
 * ----------------------------------------------------------------
 ******************************************************************/

/******************************************************************
 * Function : renderVoucherToJpegBlob()
 * Tujuan   : Fungsi utama: gabungkan template + QR + data voucher
 *            menjadi satu gambar JPG (Blob), siap ditampilkan
 *            atau didownload. Tidak menyimpan file apa pun.
 ******************************************************************/
async function renderVoucherToJpegBlob(templateCode, voucherData) {
  const layout = TEMPLATE_LAYOUTS[templateCode];
  if (!layout) {
    throw new Error("LAYOUT_TEMPLATE_TIDAK_DITEMUKAN: " + templateCode);
  }

  const templateImage = await loadImage(layout.imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = templateImage.naturalWidth;
  canvas.height = templateImage.naturalHeight;
  const canvasContext = canvas.getContext("2d");

  canvasContext.drawImage(templateImage, 0, 0);

  const qrCanvas = await generateQrCanvas(voucherData.qrValue, layout.qr.w);
  canvasContext.drawImage(
    qrCanvas,
    layout.qr.cx - (layout.qr.w / 2),
    layout.qr.cy - (layout.qr.h / 2),
    layout.qr.w,
    layout.qr.h
  );

  drawTextBlock(canvasContext, voucherData.recipientName, layout.nama, { drawBackground: true });

  if (voucherData.organization) {
    drawTextBlock(canvasContext, voucherData.organization, layout.instansi, { drawBackground: true });
  }

  drawTextBlock(canvasContext, voucherData.serialNumber, layout.noVoucher, { drawBackground: true });
  drawTextBlock(canvasContext, voucherData.expiredDisplay, layout.expired, { drawBackground: false });

  return new Promise(function (resolve, reject) {
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          reject(new Error("GAGAL_MEMBUAT_JPG"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      RENDER_JPEG_QUALITY
    );
  });
}