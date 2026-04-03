import jsPDF from 'jspdf-autotable';

const BRAND = { navy: '#0A2351', gold: '#B6922E', lightGold: '#f4bf00' };
const TODAY = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

function header(doc, title, subtitle) {
  doc.setFillColor(10, 35, 81); doc.rect(0, 0, 220, 38, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text('DIPESH TUTORIALS', 105, 16, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Excellence in Education | www.dipeshtutorials.com', 105, 25, { align: 'center' });
  doc.text('Generated: ' + TODAY, 105, 33, { align: 'center' });
  doc.setTextColor(10,35,81); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(title, 105, 50, { align: 'center' });
  if (subtitle) { doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text(subtitle, 105, 58, { align: 'center' }); }
}

function footer(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.text('Page '+i+' of '+pages, 105, 290, { align: 'center' }); doc.text('Dipesh Tutorials | Confidential', 105, 284, { align: 'center' }); }
}

export function generateProgressReport(data) {
  const { student, results, attendance, feeSummary } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  header(doc, 'STUDENT PROGRESS REPORT', student.name + ' | ' + student.standard + ' | Roll: ' + student.roll_no);
  // Info box
  doc.setFillColor(245,245,245); doc.rect(10, 63, 190, 22, 'F');
  doc.setFontSize(9); doc.setTextColor(80);
  const info = [['Student', student.name, 'Parent', student.parent_name||'-'],['Standard', student.standard||'-', 'Phone', student.parent_phone||'-'],['DOB', student.date_of_birth||'-', 'Email', student.parent_email||'-']];
  let y = 67;
  info.forEach(function(r) { doc.setFont('helvetica','bold'); doc.text(r[0]+':', 14, y); doc.setFont('helvetica','normal'); doc.text(String(r[1]||'-'), 36, y); doc.setFont('helvetica','bold'); doc.text(r[2]+':', 110, y); doc.setFont('helvetica','normal'); doc.text(String(r[3]||'-'), 132, y); y += 6; });
  // Attendance
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(10,35,81); doc.text('ATTENDANCE SUMMARY', 14, 95);
  const present = attendance.filter(function(a){ return a.status==='present'||a.status==='late'; }).length;
  const attPct = attendance.length > 0 ? Math.round(present/attendance.length*100) : 0;
  jsPDF.autotable({ head: [['Total','Present','Absent','Late','Attendance %']], body: [[attendance.length, present, attendance.filter(function(a){return a.status==='absent';}).length, attendance.filter(function(a){return a.status==='late';}).length, attPct+'%']],
    startY: 98, theme: 'grid', headStyles: { fillColor: [10,35,81] }, footStyles: { fillColor: [10,35,81] }, margin: { left: 14, right: 14 } });
  // Results
  if (results && results.length > 0) {
    const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 130;
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(10,35,81); doc.text('TEST RESULTS', 14, lastY);
    var rBody = results.map(function(r) { var pct = r.max_marks > 0 ? Math.round(r.marks_obtained/r.max_marks*100) : 0; return [r.test_name||'-', r.subject_name||'-', r.marks_obtained, r.max_marks, pct+'%', r.grade||'-']; });
    var avg = Math.round(rBody.reduce(function(s,r){ return s+parseInt(r[4]); },0)/rBody.length);
    jsPDF.autotable({ head: [['Test','Subject','Marks','Max','%','Grade']], body: rBody.concat([['AVERAGE','','','',avg+'%','']]),
      startY: lastY+4, theme: 'striped', headStyles: { fillColor: [10,35,81] }, footStyles: { fillColor: [182,146,46], textColor: 255 },
      columnStyles: { 4: { halign: 'center' }, 5: { halign: 'center' } }, margin: { left: 14, right: 14 } });
  }
  // Fee
  if (feeSummary) {
    const feeY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 180;
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(10,35,81); doc.text('FEE STATUS', 14, feeY);
    const feeColor = feeSummary.status === 'paid' ? [16,185,129] : [245,158,11];
    jsPDF.autotable({ head: [['Total Fees','Amount Paid','Balance','Status']], body: [[feeSummary.total_fees||0, feeSummary.paid_fees||0, feeSummary.balance||0, feeSummary.status||'pending']],
      startY: feeY+4, theme: 'grid', headStyles: { fillColor: [10,35,81] }, footStyles: { fillColor: feeColor }, margin: { left: 14, right: 14 } });
  }
  // Signatures
  const sigY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 16 : 250;
  doc.setDrawColor(10,35,81); doc.setLineWidth(0.5); doc.line(14, sigY, 80, sigY); doc.line(130, sigY, 196, sigY);
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(10,35,81);
  doc.text('Class Teacher', 47, sigY+5, { align: 'center' }); doc.text('Principal / Director', 163, sigY+5, { align: 'center' });
  footer(doc);
  doc.save('ProgressReport_' + student.name.replace(/\s/g,'_') + '.pdf');
}

export function generateFeeReceipt(data) {
  const { payment, student } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  doc.setFillColor(10,35,81); doc.rect(0, 0, 148, 30, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('DIPESH TUTORIALS', 74, 14, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text('Official Fee Receipt', 74, 22, { align: 'center' });
  doc.setTextColor(10,35,81);
  doc.autoTable({ body: [['Receipt No.', payment.receipt_no||'-'],['Date', payment.payment_date||'-'],['Student', student.name||'-'],['Standard', student.standard||'-'],['Amount','Rs. '+(payment.amount||0).toLocaleString('en-IN')],['Method', (payment.payment_method||'Cash').toUpperCase()]],
    startY: 36, theme: 'grid', headStyles: { fillColor: [10,35,81] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 } });
  const ty = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(16,185,129); doc.rect(14, ty, 120, 10, 'F');
  doc.setTextColor(255); doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('PAID', 74, ty+7, { align: 'center' });
  doc.setFontSize(8); doc.setTextColor(100); doc.setFont('helvetica','normal'); doc.text('Computer generated - no signature required.', 74, 100, { align: 'center' });
  doc.save('Receipt_'+(payment.receipt_no||payment.id)+'.pdf');
}
