import jsPDF from 'jspdf';
import type { Offer, ClientSummary, ClientEquipment } from '../types';

function loadImg(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function formatDate(d: Date): string {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatDateShort(d: string | null): string {
  if (!d) return '';
  return d;
}

function addPageHeader(doc: jsPDF, weberLogoData: string) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('WEBER FOOD TECHNOLOGY IBÉRICA, S.L.', 105, 8, { align: 'center' });
  doc.text('c/ La Coma, 29', 105, 11, { align: 'center' });
  doc.text('(08272) Sant Fruitós de Bages (Barcelona)', 105, 14, { align: 'center' });
  if (weberLogoData) {
    doc.addImage(weberLogoData, 'PNG', 165, 3, 30, 10);
  }
  doc.setDrawColor(200);
  doc.line(10, 18, 200, 18);
}

export async function generateOfferPdf(
  offer: Offer,
  customer: ClientSummary,
  selectedModules: ClientEquipment[],
  calc: {
    tripCost: number;
    diets: number;
    hotelNights: number;
    tripHours: number;
    workHours: number;
    bkHours: number;
    reportHours: number;
    totalHours: number;
    hoursImport: number;
    expensesImport: number;
    discount: number;
    bkPrice: number;
    total: number;
    totalEnd: number;
  }
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;

  let weberLogoData = '';
  let guardianLogoData = '';
  try {
    weberLogoData = await loadImg('/weber-logo.png');
  } catch { /* ignore */ }
  try {
    guardianLogoData = await loadImg('/guardian-logo.png');
  } catch { /* ignore */ }

  // ===================== PAGE 1: COVER =====================
  // Weber logo top right
  if (weberLogoData) {
    doc.addImage(weberLogoData, 'PNG', 165, 10, 30, 10);
  }

  // Guardian logo centered
  if (guardianLogoData) {
    doc.addImage(guardianLogoData, 'PNG', 65, 50, 80, 80);
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 60, 120);
  doc.text('CONTRATO DE MANTENIMIENTO', pageW / 2, 145, { align: 'center' });

  // Weber section
  let y = 180;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Entre la empresa:', marginL, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 60, 120);
  doc.text('WEBER FOOD TECHNOLOGY IBÉRICA, S.L.', marginL + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  y += 6;
  doc.text('c/ La Coma, 29', marginL + 10, y);
  y += 5;
  doc.text('(08272) Sant Fruitós de Bages (Barcelona)', marginL + 10, y);
  y += 5;
  doc.text('España', marginL + 10, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.text('(en adelante, el Ejecutor)', pageW - marginR, y, { align: 'right' });

  // Client section
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Y la empresa:', marginL, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 60, 120);
  doc.text(customer.account_name.toUpperCase(), marginL + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  y += 6;
  if (customer.account_address) {
    doc.text(customer.account_address.toUpperCase(), marginL + 10, y);
    y += 5;
  }
  const cityLine = [customer.account_city, customer.account_province, customer.account_country].filter(Boolean).map(s => (s || '').toUpperCase()).join(' ');
  if (cityLine) {
    doc.text(cityLine, marginL + 10, y);
    y += 5;
  }
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.text('(en adelante, el Ordenante)', pageW - marginR, y, { align: 'right' });

  // Closing line
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('se celebra el siguiente contrato de inspección y mantenimiento (en adelante, el "Contrato"):', marginL, y);

  // ===================== PAGES 2-6: CONTRACT CLAUSES =====================
  doc.addPage();
  addPageHeader(doc, weberLogoData);

  const contractText = getContractClauses();
  let textY = 25;

  for (const section of contractText) {
    // Check if we need a new page
    if (textY > pageH - 30) {
      doc.addPage();
      addPageHeader(doc, weberLogoData);
      textY = 25;
    }

    if (section.type === 'heading') {
      textY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(section.text, marginL, textY);
      textY += 8;
    } else if (section.type === 'subheading') {
      textY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(section.text, contentW);
      doc.text(lines, marginL, textY);
      textY += lines.length * 5 + 2;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(section.text, contentW - (section.indent || 0));
      for (const line of lines) {
        if (textY > pageH - 25) {
          doc.addPage();
          addPageHeader(doc, weberLogoData);
          textY = 25;
        }
        doc.text(line, marginL + (section.indent || 0), textY);
        textY += 4.5;
      }
      textY += 1;
    }
  }

  // Date line
  textY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0);
  const cityAndDate = `Sant Fruitós de Bages, a ${formatDate(new Date())}`;
  doc.text(cityAndDate, marginL + 20, textY);

  // Signature lines
  textY += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(customer.account_name.toUpperCase(), marginL, textY);
  doc.text('WEBER FOOD TECHNOLOGY IBÉRICA, S.L.', pageW / 2 + 10, textY);
  textY += 15;
  doc.setDrawColor(0);
  doc.line(marginL, textY, marginL + 60, textY);
  doc.line(pageW / 2 + 10, textY, pageW / 2 + 70, textY);

  // ===================== ANNEX 1 =====================
  doc.addPage();
  addPageHeader(doc, weberLogoData);

  textY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('ANEXO 1, Relación de máquinas y módulos', marginL, textY);

  // Client info box
  textY += 10;
  doc.setDrawColor(180);
  doc.roundedRect(marginL, textY - 4, contentW, 28, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(customer.account_name.toUpperCase(), marginL + 4, textY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (customer.account_address) {
    doc.text(customer.account_address.toUpperCase(), marginL + 4, textY + 7);
  }
  const addrCity = [customer.account_city, customer.account_province, customer.account_country].filter(Boolean).map(s => (s || '').toUpperCase()).join(', ');
  if (addrCity) {
    doc.text(addrCity, marginL + 4, textY + 12);
  }
  if (customer.account_country) {
    doc.text(customer.account_country.toUpperCase(), marginL + 4, textY + 17);
  }

  // Right side info
  const rightX = pageW - marginR;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Fecha:', rightX - 50, textY - 1);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateShort(offer.date_guardian) || new Date().toLocaleDateString('en-GB'), rightX, textY - 1, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Nº oferta:', rightX - 50, textY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(offer.id_guardian_offer, rightX, textY + 5, { align: 'right' });

  // Frequency and type
  textY += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Frecuencia de Inspección:', marginL, textY);
  doc.setFont('helvetica', 'normal');
  doc.text(offer.inspection_frequency || 'Annual', marginL + 55, textY);
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', rightX - 30, textY);
  doc.setFont('helvetica', 'normal');
  doc.text('Auditoría', rightX, textY, { align: 'right' });

  // Equipment table
  textY += 8;
  const tableData = selectedModules.map((m, i) => [
    String(i + 1),
    m.equipment,
    m.description,
    `${(m.import_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} €`
  ]);

  const autoTable = (await import('jspdf-autotable')).default;
  autoTable(doc, {
    startY: textY,
    head: [['Nº DE LÍNEA', 'MÓDULO', '', 'IMPORTE']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [200, 220, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 80 },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
    didParseCell: function(data) {
      if (data.section === 'head' && data.column.index === 2) {
        data.cell.text = [''];
      }
    }
  });

  let afterTableY = (doc as any).lastAutoTable.finalY + 5;

  // Totals
  const totalAmount = selectedModules.reduce((sum, m) => sum + (m.import_amount || 0), 0);
  const totalsX = pageW - marginR - 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Total:', totalsX, afterTableY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} €`, pageW - marginR, afterTableY, { align: 'right' });

  afterTableY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Kit básico de recambios:', totalsX, afterTableY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${(calc.bkPrice || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} €`, pageW - marginR, afterTableY, { align: 'right' });

  afterTableY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Descuento con contrato de mantenimiento:', totalsX - 40, afterTableY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${calc.discount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} €`, pageW - marginR, afterTableY, { align: 'right' });

  afterTableY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Importe total (sin IVA):', totalsX - 20, afterTableY);
  doc.text(`${calc.totalEnd.toLocaleString('en-GB', { minimumFractionDigits: 2 })} €`, pageW - marginR, afterTableY, { align: 'right' });

  // Notes
  afterTableY += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40);
  doc.text('Ambas partes acuerdan el siguiente presupuesto de inspección de Weber según condiciones adjuntas', marginL, afterTableY);

  const notes = [
    '- incluye desplazamientos, mano de obra y documentación.',
    '- comprobación de sensores, componentes eléctricos, transmisiones, correas dentadas y cuchillas',
    '  (en el kit básico se incluye la sustitución de las correas principales del cabezal, husillo y módulos',
    '  auxiliares).',
    '- ajuste de las piezas mecánicas de los diferentes módulos',
    '- revisión y optimización de programas.',
    '- registro de todas las reparaciones previstas.',
  ];

  afterTableY += 6;
  for (const note of notes) {
    doc.text(note, marginL + 5, afterTableY);
    afterTableY += 4.5;
  }

  afterTableY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('NOTAS:', marginL, afterTableY);
  afterTableY += 6;
  doc.setFont('helvetica', 'normal');
  const notrsNotes = [
    '- Descuento del 15% en la asistencia técnica de las líneas contratadas.',
    '- Descuento del 5% en los recambios de las líneas contratadas (no aplicable a descuentos vigentes).',
    '- Descuento del 5% en cuchillas para cajas completas 3 cuchillas, no aplicable a descuentos vigentes).',
    '- Incluye una visita gratuita de seguimiento a los 6 meses.',
    '- Todas las piezas, consumibles y recambios fuera de presupuesto, así como horas fuera de horario normal,',
    '  espera y reparación fuera de presupuesto, se facturarán aparte.',
  ];
  for (const note of notrsNotes) {
    doc.text(note, marginL + 5, afterTableY);
    afterTableY += 4.5;
  }

  // Save
  doc.save(`Offer_${offer.id_guardian_offer}.pdf`);
}

type ContractLine = {
  type: 'heading' | 'subheading' | 'text';
  text: string;
  indent?: number;
};

function getContractClauses(): ContractLine[] {
  return [
    { type: 'heading', text: '0. DEFINICIONES' },
    { type: 'text', text: 'Los términos utilizados en este acuerdo tienen los siguientes significados:' },
    { type: 'subheading', text: 'Máquina/ Módulos' },
    { type: 'text', text: 'Unidad funcional, equipo o sistema al que se refieren los servicios que se prestarán en virtud del presente co' },
    { type: 'subheading', text: 'Inspección' },
    { type: 'text', text: 'La determinación y evaluación del estado real de una máquina / módulo, incluida la determinación de las causas del desgaste y la derivación de las consecuencias necesarias para el uso futuro.' },
    { type: 'subheading', text: 'Mantenimiento' },
    { type: 'text', text: 'Las medidas para retrasar el desmantelamiento de las existencias de desgaste existentes ("mantenimiento preventivo"), en particular mediante ajustes o mediante la sustitución de filtros, sellos y lubricantes, limpieza técnica, etc.' },
    { type: 'subheading', text: 'Reposición' },
    { type: 'text', text: 'Cualquier medida para devolver una máquina / módulo a la condición acordada, en particular mediante la sustitución de piezas, incluidas las piezas de desgaste. Las medidas para mantener la condición acordada fuera de los servicios de mantenimiento también son parte de la reparación.' },

    { type: 'heading', text: 'I. OBJETO DEL CONTRATO' },
    { type: 'text', text: '(0) El Contrato de inspección tiene por objeto la inspección de las máquinas y módulos enumerados en el (Anexo 1), facturación de estos servicios sobre la base de una tarifa fija (Anexo1). El mantenimiento de las máquinas y componentes, a computar según se incurra en el mismo y segun tarifas vigentes.' },
    { type: 'text', text: 'El objetivo del Contrato es extender la vida útil de las máquinas y los módulos, reducir los tiempos de inactividad y mantener los costos de mantenimiento bajo control mediante una inspección y un mantenimiento adecuados.' },
    { type: 'text', text: '(1) En el marco de este Contrato, el Ejecutor asume los siguientes servicios para las máquinas y módulos enumerados:' },
    { type: 'text', text: '- Servicio de atención telefónica', indent: 15 },
    { type: 'text', text: '- Suministro de piezas de repuesto', indent: 15 },
    { type: 'text', text: '- Mantenimiento', indent: 15 },
    { type: 'text', text: '- Visita de cortesía posterior al mantenimiento', indent: 15 },
    { type: 'text', text: '- Programa de Cuchillas (resguardo de stock)', indent: 15 },
    { type: 'text', text: '(2) El servicio del Ejecutor comprende, en los casos' },
    { type: 'text', text: '(2.1) En los que se acceda a la línea o centro de atención telefónica :' },
    { type: 'text', text: '- El servicio de atención telefónica de lunes a viernes de 07:30 h a 17:30 h.', indent: 15 },
    { type: 'text', text: '- Teléfono: 938 23 32 33', indent: 15 },
    { type: 'text', text: '(2.2) La distribución de piezas de repuesto : El suministro de piezas de repuesto existentes (en stock) en almacén (en la Península Ibérica y Alemania) en un plazo de 24-48 horas. En el caso de no disponer de la pieza de repuesto solicitada en stock, se solicitará y se entregará con la mayor brevedad posible.' },
    { type: 'text', text: '(2.3) La inspección : Inspección de las máquinas en conformidad con el ANEXO 1' },
    { type: 'text', text: '(2.4) El mantenimiento: Ejecución de reparaciones de conformidad con el punto I.3 del Contrato.' },
    { type: 'text', text: '(2.5) Programa de resguardo de stock de Cuchillas: descuento del 5% a partir de la 1ª caja de 3 unidades, en conformidad con el ANEXO 2.' },
    { type: 'text', text: '(3) Cualquier trabajo de mantenimiento u otros servicios (por ejemplo, cambios en las máquinas y sistemas) que resulten de la inspección requerirán de una orden de compra separada; y se facturará en función de una oferta adicional.' },
    { type: 'text', text: '(4) El número de las máquinas incluidas en el ANEXO 1, así como el alcance de los servicios derivados del presente Contrato se verificarán, por parte de las partes contratantes, en el último trimestre del Contrato' },
    { type: 'text', text: '(5) Las modificaciones en referencia al número de máquinas incluidas en el acuerdo y las modificaciones del alcance del servicio por parte del Ordenante se harán constar por escrito, modificando el Anexo 1. Este acuerdo de servicios es válido por los 12 meses de validez de Contrato o hasta la finalización del Contrato' },
    { type: 'text', text: '(6) Visita de cortesía a realizar si el mantenimiento posterior es realizado por el Ejecutor.' },

    { type: 'heading', text: 'II. PRECIO Y PAGO' },
    { type: 'text', text: '(1) El precio del trabajo de inspección se calcula según el ANEXO 1. La relación se deduce del modelo de máquina y de los módulos seleccionados conforme al punto I del Contrato.s vigentes.' },
    { type: 'text', text: '(2) El precio para los módulos "Inspección" y "Mantenimiento" incluye gastos de desplazamiento, transporte, alojamiento y dietas. Salvo excepciones acordadas con el Ordenante.' },
    { type: 'text', text: '(3) Las piezas sustituidas se le presentarán al Ordenante para su control.' },
    { type: 'text', text: '(4) El precio del trabajo del personal de inspección se abonará una vez emitida la factura, en el plazo de 30 días . La facturación tiene lugar después de haber realizado la inspección.' },
    { type: 'text', text: '(5) El Ejecutor tiene derecho a revisar el precio del trabajo conforme a lo establecido en el Anexo 1 anualmente. Le notificará dicha revisión al Ordenante al menos 3 meses antes de la entrada en vigor. La modificación del precio se aplicará en el siguiente periodo de pago.' },
    { type: 'text', text: '(6) No se acepta la retención de pagos ni la compensación por eventuales contraprestaciones alegadas por parte del Ordenante.' },
    { type: 'text', text: '(7) El Ejecutor ofrece un descuento del 15 % para los servicios de asistencia de máquinas y un 5% de descuento máximo en recambios no acumulable como indica el ANEXO 1.' },

    { type: 'heading', text: 'III. PARTICIPACIÓN Y CONTRIBUCIÓN TÉCNICA DEL ORDENANTE' },
    { type: 'text', text: '(1) El Ordenante velará por qué:' },
    { type: 'text', text: '• Los trabajos puedan llevarse a cabo puntualmente a las horas y en las máquinas acordadas y garantizará el libre acceso a las máquinas y módulos.', indent: 15 },
    { type: 'text', text: '• La máquina se encuentre en estado operativo, esté disponible y limpia (sin restos de producto).', indent: 15 },
    { type: 'text', text: '• Una vez finalizados los trabajos, pueda llevarse a cabo una comprobación funcional con los productos originales del cliente en una cantidad suficiente.', indent: 15 },
    { type: 'text', text: '• Se registren las averías en curso en los planos de máquinas.', indent: 15 },
    { type: 'text', text: '(2.a) El Ordenante correrá con los gastos originados por el personal de inspección durante la ejecución de la inspección y del mantenimiento.' },
    { type: 'text', text: '(b) El Ordenante se compromete a correr con los gastos de la contribución técnica, en particular, a ofrecer gratuitamente asistencia, taller, medios auxiliares como el agua y la electricidad, incluyendo las conexiones necesarias.' },

    { type: 'heading', text: 'IV. CUMPLIMIENTO DE LOS PLAZOS DEL CONTRATO' },
    { type: 'text', text: '(1) El Ejecutor se compromete a efectuar una inspección en el marco del intervalo de tiempo acordado en el Anexo 1.' },
    { type: 'text', text: '(2) El Ejecutor notifica al Ordenante la fecha exacta de la inspección con al menos con 6 semanas de antelación, en caso de que entre las partes del contrato no se haya acordado una determinada fecha.' },
    { type: 'text', text: '(3) El Ejecutor prestará los servicios en los siguientes periodos:' },
    { type: 'text', text: '- Inspección y mantenimiento de lunes a viernes de 08:00 h a 18:00 h.', indent: 15 },
    { type: 'text', text: '- Salvo excepciones de mutuo acuerdo.', indent: 15 },
    { type: 'text', text: '(4) En caso de que al Ordenante o al Ejecutor no le fuese posible llevar a cabo los trabajos en la fecha prevista, ambas partes se lo notificarán recíprocamente con al menos 2 días laborables de antelación.' },
    { type: 'text', text: '(5) Si la inspección/mantenimiento se retrasa por circunstancias originadas por conflictos laborales, en particular, huelgas y paros, así como por hechos acaecidos no imputables al Ejecutor, tendrá lugar una adecuada prolongación de la inspección/mantenimiento.' },

    { type: 'heading', text: 'V. INICIO Y DURACIÓN DEL CONTRATO' },
    { type: 'text', text: '(1) El Contrato adquiere validez desde la firma de ambas partes. La duración del Contrato es de 12 meses, y será revocable por ambas partes.' },
    { type: 'text', text: '(2) El Contrato se prorrogará automáticamente por otros 12 meses, en el caso de que no se haya rescindido por escrito 3 meses anteriores a la finalización del mismo .' },

    { type: 'heading', text: 'VI. GARANTÍA Y RESPONSABILIDAD' },
    { type: 'text', text: '(1) En caso de que la inspección /el mantenimiento no se haya completado en su totalidad, Ejecutor la revisará o rectificará sin coste alguno.' },
    { type: 'text', text: '(2) El Ejecutor subsanará gratuitamente todos los daños que él o sus agentes hayan provocado en las máquinas e instalaciones a las que debía efectuarse el mantenimiento. La cuantía de la obligación de reparación se limita a la cuota anual estipulada por contrato.' },
    { type: 'text', text: '(3) En el caso de que el Ejecutor incumpla su deber de reparación, mejora o reparación del daño, el Ordenante podrá establecer una prórroga adecuada. Si por la culpa del Ejecutor, este plazo transcurre sin obtnerse resultado, el Ordenante podrá, a su elección, exigir una reducción de las cuotas de mantenimiento e inspección o bien rescindir de inmediato el Contrato.' },
    { type: 'text', text: '(4) Cualquier otro derecho a reclamación del Ordenante se aplicará únicamente en caso de dolo o negligencia grave.' },
    { type: 'text', text: '(5) Cualquier daño o desperfecto causado por piezas no originales, el Ejecutor no se hará responsable.' },

    { type: 'heading', text: 'VII. PERÍODO DE PRESCRIPCIÓN' },
    { type: 'text', text: 'Los derechos de garantía del Ordenante pierden su validez a los doce meses, a contar desde la aceptación del correspondiente servicio de inspección/mantenimiento. El plazo de garantía se prolongará mientras duren los trabajos de subsanación.' },

    { type: 'heading', text: 'VIII. OTRAS DISPOSICIONES' },
    { type: 'text', text: '(1) Al personal de inspección/mantenimiento se le facilitará el acceso a las máquinas e instalaciones durante las horas habituales de trabajo/tiempo de servicio con la finalidad de que pueda efectuar los trabajos de inspección y mantenimiento anunciados.' },
    { type: 'text', text: '(2) Si el Ordenante cede máquinas e instalaciones a terceros, sigue permaneciendo obligado al pago de las cuotas, a menos que el tercero se adhiera al contrato, previa autorización del ejecutor.' },
    { type: 'text', text: '(3) El Ejecutor tiene derecho a transferir a terceros los derechos y deberes contraídos con el presente contra' },
    { type: 'text', text: '(4) Los acuerdos adicionales y las modificaciones del contrato deben efectuarse por escrito.' },
    { type: 'text', text: '(5) En el caso de que una de las disposiciones del presente contrato deje de ser válida, todas las demás disposiciones o acuerdos seguirán manteniendo su validez.' },

    { type: 'heading', text: 'IX. LUGAR DE JURISDICCIÓN' },
    { type: 'text', text: 'En la medida en que lo permita la ley, el lugar de cumplimiento y jurisdicción será el domicilio social del Ejecutor. Se aplicará exclusivamente la legislación de España.' },
  ];
}
