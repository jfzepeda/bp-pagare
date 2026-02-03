import jsPDF from "jspdf";

function loadImageData(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function moneyFormat(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numeroALetras(num) {
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  const toWords999 = (n) => {
    n = n % 1000;
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    let out = "";
    if (c) out += centenas[c] + (n % 100 ? " " : "");
    const last2 = n % 100;
    if (last2 >= 11 && last2 <= 19) return (out + especiales[last2]).trim();
    if (d === 1 && u === 0) return (out + "DIEZ").trim();
    if (d === 2 && u !== 0) return (out + "VEINTI" + unidades[u].toLowerCase()).toUpperCase().trim();
    if (d) out += decenas[d] + (u ? " Y " : "");
    if (u) out += unidades[u];
    return out.trim();
  };

  const entero = Math.floor(Number(num || 0));
  if (entero === 0) return "CERO";

  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const cientos = entero % 1000;

  let res = "";
  if (millones) {
    res += (millones === 1 ? "UN MILLON" : `${toWords999(millones)} MILLONES`);
  }
  if (miles) {
    res += (res ? " " : "") + (miles === 1 ? "MIL" : `${toWords999(miles)} MIL`);
  }
  if (cientos) {
    res += (res ? " " : "") + toWords999(cientos);
  }
  return res.trim().replace(/\s+/g, " ");
}

function fechaLargaES(iso) {
  const d = new Date(iso + "T00:00:00");
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const day = d.getDate();
  const month = meses[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export async function generarPagarePDF(data) {
  const {
    buenoPor,
    moneda,
    vencimientoTipo,
    vencimientoFecha,
    suscriptorNombre,
    suscriptorDomicilio,
    beneficiarioNombre,
    lugarPagoCiudadEstado,
    lugarSuscripcion,
    fechaSuscripcion,
    tasaOrdinariaTexto,
    tasaMoratoriaTexto,
    jurisdiccionTexto,
  } = data;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  let y = 70;
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoData = await loadImageData("/logo_bp.png");
    const logoWidth = 90;
    const logoHeight = 36;
    doc.addImage(logoData, "PNG", pageWidth - margin - logoWidth, 36, logoWidth, logoHeight);
  } catch (err) {
    // If the logo fails to load, continue without it.
  }

  const monto = Number(buenoPor || 0);
  const montoFmt = moneyFormat(monto);
  const monedaTxt = moneda === "USD" ? "DOLARES" : "PESOS";
  const centavos = Math.round((monto - Math.floor(monto)) * 100);
  const centavosTxt = String(centavos).padStart(2, "0");

  const montoLetras = `${numeroALetras(monto)} ${monedaTxt} ${centavosTxt}/100`;

  const venc = vencimientoTipo === "A_LA_VISTA"
    ? "A LA VISTA"
    : fechaLargaES(vencimientoFecha);

  const wrap = (text, x, yPos, maxWidth, lineHeight = 14) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return yPos + lines.length * lineHeight;
  };

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("PAGARE", pageWidth / 2, y, { align: "center" });
  y += 28;

  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text(`BUENO POR: ${moneda}$${montoFmt}`, margin, y);
  y += 18;
  doc.text(`FECHA DE VENCIMIENTO: ${venc}`, margin, y);
  y += 28;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const p1 = `El que suscribe ${suscriptorNombre} por este PAGARE, reconoce deber y promete incondicionalmente pagar a la orden de "${beneficiarioNombre}", en ${lugarPagoCiudadEstado} a ${vencimientoTipo === "A_LA_VISTA" ? "LA VISTA" : "su vencimiento"}, la suma principal de ${moneda}$${montoFmt} (${montoLetras}). Valor recibido a su entera satisfaccion.`;
  y = wrap(p1, margin, y, doc.internal.pageSize.getWidth() - margin * 2);
  y += 14;

  const p2 = `El presente PAGARE causara de forma mensual intereses ordinarios ${tasaOrdinariaTexto ? `a ${tasaOrdinariaTexto}` : "a la tasa pactada"} sobre saldos insolutos, desde la fecha de su suscripcion y hasta la liquidacion total de la suma principal.`;
  y = wrap(p2, margin, y, doc.internal.pageSize.getWidth() - margin * 2);
  y += 14;

  const p3 = `En caso de incumplimiento en el pago total de la suma principal adeudada en la fecha pactada para su vencimiento, el saldo insoluto causara mensualmente intereses moratorios ${tasaMoratoriaTexto ? `a ${tasaMoratoriaTexto}` : "a la tasa pactada"} y se calcularan desde el dia de su vencimiento y hasta la liquidacion total de la suma principal.`;
  y = wrap(p3, margin, y, doc.internal.pageSize.getWidth() - margin * 2);
  y += 14;

  const p4 = `Para todo lo relativo a la interpretacion y cumplimiento de este PAGARE, las partes se someten a ${jurisdiccionTexto}.`;
  y = wrap(p4, margin, y, doc.internal.pageSize.getWidth() - margin * 2);
  y += 22;

  const p5 = `Este PAGARE se suscribe en ${lugarSuscripcion} el dia ${fechaLargaES(fechaSuscripcion)}.`;
  y = wrap(p5, margin, y, doc.internal.pageSize.getWidth() - margin * 2);
  y += 40;

  doc.setFont("times", "bold");
  doc.text("EL SUSCRIPTOR", margin, y);
  y += 45;

  doc.setDrawColor(0);
  doc.line(margin, y, margin + 260, y);
  y += 18;

  doc.setFont("times", "bold");
  doc.text(suscriptorNombre || "", margin, y);
  y += 16;

  doc.setFont("times", "normal");
  doc.text(`Domicilio.- ${suscriptorDomicilio || ""}`, margin, y);

  doc.save(`pagare_${suscriptorNombre?.replace(/\s+/g, "_") || "nuevo"}.pdf`);
}
