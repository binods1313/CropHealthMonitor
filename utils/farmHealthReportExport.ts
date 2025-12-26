
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { FarmHealthAnalysis } from '../types/FarmHealthAnalysis';
import { safeWriteExcelFile } from '../utils/safeExcelHandler';

const COLORS = {
  HEADER: '#355E3B',    
  ACCENT: '#D4AF37',    
  TEXT: '#1F2937',      
  SUBHEADER: '#166534', 
  PRIORITY: {
    P1: [254, 243, 199], 
    P2: [254, 215, 170], 
    P3: [209, 250, 229]  
  },
  HEALTH: {
    GOOD: '#27AE60',
    MODERATE: '#D4AF37',
    POOR: '#EA580C',
    CRITICAL: '#DC2626'
  }
};

const MARGIN = 15; // mm

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

const getHealthColor = (score: number) => {
  if (score >= 80) return COLORS.HEALTH.GOOD;
  if (score >= 60) return COLORS.HEALTH.MODERATE;
  if (score >= 40) return COLORS.HEALTH.POOR;
  return COLORS.HEALTH.CRITICAL;
};

// Helper to draw a metric card
const drawMetricCard = (doc: any, x: number, y: number, w: number, h: number, label: string, value: string, accentColor: string) => {
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFillColor(accentColor);
  doc.roundedRect(x, y, 2, h, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), x + 5, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(COLORS.TEXT);
  doc.text(value, x + 5, y + 18);
};

// Helper for standard page headers
const addPageHeader = (doc: any, title: string, subTitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(COLORS.HEADER);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subTitle.toUpperCase(), MARGIN, 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, 15);
};

// Helper for standard footers
const addFooter = (doc: any, pageNum: number, totalPages: number, generatedAt: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`CropHealth Monitor | Generated: ${new Date(generatedAt).toLocaleString()}`, MARGIN, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' });
};

/**
 * Main PDF Generation Engine for Farm Health Reports
 */
export const generateFarmHealthPDF = async (data: FarmHealthAnalysis) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }) as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (MARGIN * 2);
  let y = 0;

  // --- PAGE 1: Situation Report ---
  doc.setFillColor(COLORS.HEADER);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("FARM HEALTH SITUATION REPORT", MARGIN, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.farmName} • ${data.location.name} • ${data.scanDate}`, MARGIN, 24);

  // Health Score Badge
  const badgeX = pageWidth - MARGIN - 30;
  const badgeY = 15;
  doc.setFillColor(255, 255, 255);
  doc.circle(badgeX + 15, badgeY, 12, 'F'); 
  doc.setTextColor(getHealthColor(data.healthScore));
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(String(data.healthScore), badgeX + 15, badgeY + 1, { align: 'center' });
  doc.setFontSize(7);
  doc.text("/100", badgeX + 15, badgeY + 5, { align: 'center' });

  y = 40;

  // Dual Imagery
  const imgW = 85;
  const imgH = 85; 
  const imgSpacing = 5;
  const leftImgX = MARGIN;
  const rightImgX = MARGIN + imgW + imgSpacing;

  // Image 1: NDVI (Satellite)
  doc.setFillColor(240, 240, 240);
  doc.rect(leftImgX, y, imgW, imgH, 'F');
  try {
    if (data.images.ndviMap && data.images.ndviMap.length > 100) {
        doc.addImage(data.images.ndviMap, 'PNG', leftImgX, y, imgW, imgH);
    }
  } catch (e) { console.warn("PDF Image Error", e); }
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Source: Sentinel-2 NDVI | NASA Earth Observatory", leftImgX, y + imgH + 5);

  // Image 2: Overlay (Diagnostic)
  doc.setFillColor(240, 240, 240);
  doc.rect(rightImgX, y, imgW, imgH, 'F');
  try {
    if (data.images.deficiencyOverlay && data.images.deficiencyOverlay.length > 100) {
        doc.addImage(data.images.deficiencyOverlay, 'PNG', rightImgX, y, imgW, imgH);
    }
  } catch (e) { console.warn("PDF Image Error", e); }
  
  doc.text("Source: AI-generated analysis based on Sentinel-2 & soil data", rightImgX, y + imgH + 5);

  y += imgH + 15;

  // Metric Cards
  const cardW = 40;
  const cardH = 25;
  const gap = (contentWidth - (cardW * 4)) / 3;
  drawMetricCard(doc, MARGIN, y, cardW, cardH, "Time to Action", data.timeToAction, COLORS.HEALTH.POOR);
  drawMetricCard(doc, MARGIN + cardW + gap, y, cardW, cardH, "Yield Risk", data.yieldRisk, COLORS.HEALTH.CRITICAL);
  drawMetricCard(doc, MARGIN + (cardW + gap) * 2, y, cardW, cardH, "Confidence", `${data.confidenceScore}%`, COLORS.HEALTH.GOOD);
  drawMetricCard(doc, MARGIN + (cardW + gap) * 3, y, cardW, cardH, "NDVI Range", `${data.ndviMetrics.min} - ${data.ndviMetrics.max}`, COLORS.ACCENT);

  y += cardH + 15;

  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(COLORS.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.text("EXECUTIVE ASSESSMENT", MARGIN, y);
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.HEADER);
  doc.line(MARGIN, y + 2, MARGIN + 70, y + 2);
  
  y += 10;
  doc.setFontSize(11);
  doc.setTextColor(COLORS.TEXT);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(data.executiveSummary, contentWidth);
  doc.text(summaryLines, MARGIN, y);

  // --- PAGE 2: Environmental & Soil ---
  doc.addPage();
  addPageHeader(doc, "ENVIRONMENTAL & SOIL CONDITIONS", data.reportId);
  y = 30;

  const soilData = [
    ['pH', data.soilMetrics.pH, data.soilMetrics.pH < 6 || data.soilMetrics.pH > 7.5 ? 'Concern' : 'Optimal'],
    ['Nitrogen', `${data.soilMetrics.nitrogen} ppm`, data.soilMetrics.nitrogen < 50 ? 'Deficient' : 'Adequate'],
    ['Phosphorus', `${data.soilMetrics.phosphorus} ppm`, 'Optimal'],
    ['Potassium', `${data.soilMetrics.potassium} ppm`, 'High'],
    ['Moisture', `${data.soilMetrics.moisture}%`, 'Adequate'],
    ['Organic Matter', `${data.soilMetrics.organicMatter}%`, data.soilMetrics.organicMatter < 3 ? 'Low' : 'Optimal']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value', 'Status']],
    body: soilData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.HEADER },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  y = doc.lastAutoTable.finalY + 15;

  const weatherData = [
    ['Temperature', `${data.weatherMetrics.temperature}°C`],
    ['Humidity', `${data.weatherMetrics.humidity}%`],
    ['Wind Speed', `${data.weatherMetrics.windSpeed} m/s`],
    ['Precipitation', `${data.weatherMetrics.precipitation} mm`]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Observation']],
    body: weatherData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.SUBHEADER },
    styles: { fontSize: 10 }
  });

  y = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setTextColor(COLORS.HEADER);
  doc.text("DETAILED IMPACT ASSESSMENT", MARGIN, y);
  doc.line(MARGIN, y + 2, MARGIN + 80, y + 2);
  y += 10;

  const sections = [
    { title: "Primary Limiting Factor", text: data.impactAssessment.primaryLimitingFactor },
    { title: "Root Cause Analysis", text: data.impactAssessment.rootCauseAnalysis },
    { title: "Predicted Impact", text: data.impactAssessment.predictedImpact }
  ];

  sections.forEach(sec => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.SUBHEADER);
    doc.text(sec.title, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.TEXT);
    const lines = doc.splitTextToSize(sec.text, contentWidth);
    doc.text(lines, MARGIN, y);
    y += (lines.length * 5) + 5;
  });

  // --- PAGE 3: Strategic Intervention ---
  doc.addPage();
  addPageHeader(doc, "STRATEGIC INTERVENTION PLAN", data.reportId);
  y = 30;

  const interventionRows = data.interventions.map(i => [
    i.priority,
    i.action,
    i.goal,
    i.impact,
    i.materials,
    i.timing,
    i.costLevel,
    i.expectedOutcome
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Pri', 'Action', 'Goal', 'Impact', 'Materials', 'Timing', 'Cost', 'Outcome']],
    body: interventionRows,
    headStyles: { fillColor: COLORS.HEADER },
    styles: { fontSize: 8, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 25 },
      7: { fontStyle: 'italic' }
    },
    didParseCell: (data) => {
        if (data.section === 'body') {
            const raw = data.row.raw as any[];
            if (raw[0] === 'P1') data.cell.styles.fillColor = COLORS.PRIORITY.P1 as any;
            if (raw[0] === 'P2') data.cell.styles.fillColor = COLORS.PRIORITY.P2 as any;
            if (raw[0] === 'P3') data.cell.styles.fillColor = COLORS.PRIORITY.P3 as any;
        }
    }
  });

  // --- PAGE 4: Resource Allocation ---
  doc.addPage();
  addPageHeader(doc, "RESOURCE ALLOCATION & LOGISTICS", data.reportId);
  y = 30;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.HEADER);
  doc.text("MATERIALS & EQUIPMENT", MARGIN, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.TEXT);
  doc.setFont('helvetica', 'normal');
  const materials = [
      ...data.resources.materialsList.map(m => `• ${m}`),
      ...data.resources.equipmentNeeded.map(e => `• ${e}`)
  ];
  materials.forEach(m => {
      doc.text(m, MARGIN, y);
      y += 6;
  });

  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.HEADER);
  doc.text("ON-FARM LOGISTICS TIMELINE", MARGIN, y);
  y += 10;
  
  data.logistics.timeline.forEach(l => {
      doc.setFillColor(COLORS.ACCENT);
      doc.rect(MARGIN, y, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(l.week, MARGIN + 8, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.text(l.action, MARGIN + 35, y + 3);
      y += 10;
  });

  // --- PAGE 5: Monitoring ---
  doc.addPage();
  addPageHeader(doc, "MONITORING & COMMUNICATION", data.reportId);
  y = 30;

  const commsData = data.communicationChannels.map(c => [c.channel, c.updateFrequency]);
  autoTable(doc, {
      startY: y,
      head: [['Channel', 'Update Frequency']],
      body: commsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.SUBHEADER },
      tableWidth: 100
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  const monitorRows = data.monitoringPhases.map(p => [
      p.phase,
      p.timeRange,
      p.actions.join('\n• '),
      p.successMetrics
  ]);

  autoTable(doc, {
      startY: y,
      head: [['Phase', 'Time Range', 'Key Actions', 'Success Metrics']],
      body: monitorRows,
      styles: { fontSize: 9, valign: 'top' },
      columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 30 },
          2: { cellWidth: 70 }
      },
      headStyles: { fillColor: COLORS.HEADER }
  });

  // --- PAGE 6: Digital Access ---
  doc.addPage();
  addPageHeader(doc, "DIGITAL ACCESS & SHARING", data.reportId);
  y = 40;

  try {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, data.reportUrl, { margin: 1, color: { dark: '#000000', light: '#ffffff' } }, (error) => {
          if (!error) {
              const qrImgVal = canvas.toDataURL('image/png');
              doc.addImage(qrImgVal, 'PNG', 30, y, 60, 60);
          }
      });
  } catch (err) { console.error("QR Gen Error", err); }

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report ID: ${data.reportId}`, 30, y + 65);
  doc.text(`Version: ${data.version}`, 30, y + 70);
  doc.text(`Generated: ${new Date(data.generatedAt).toUTCString()}`, 30, y + 75);

  const instrX = 110;
  doc.setFontSize(14);
  doc.setTextColor(COLORS.HEADER);
  doc.setFont('helvetica', 'bold');
  doc.text("SHARING INSTRUCTIONS", instrX, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(COLORS.TEXT);
  doc.setFont('helvetica', 'normal');
  const instructions = [
      "1. Scan QR code to access live dashboard.",
      "2. Share report link with agronomist.",
      "3. Download CSV/Excel for records.",
      "4. Track intervention progress online."
  ];
  
  instructions.forEach(inst => {
      doc.text(inst, instrX, y);
      y += 8;
  });

  // --- PAGE 7: Context & Regional Profile ---
  doc.addPage();
  addPageHeader(doc, "CONTEXT & DISCLAIMER", data.reportId);
  y = 30;

  const historyRows = data.historicalFarmEvents.map(h => [h.season, h.issue, h.treatment, h.outcome]);
  autoTable(doc, {
      startY: y,
      head: [['Season', 'Issue', 'Treatment', 'Outcome']],
      body: historyRows,
      theme: 'striped',
      headStyles: { fillColor: COLORS.HEADER }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Styled Regional Context Section
  const regLines = doc.splitTextToSize(data.regionalProfile, contentWidth - 10);
  const boxHeight = (regLines.length * 5) + 15;

  // Background box for styled section
  doc.setFillColor(240, 246, 255); // Light blue background
  doc.setDrawColor(219, 234, 254); // Blue 100 border
  doc.roundedRect(MARGIN, y, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175); // Blue 800
  doc.text("REGIONAL PROFILE CONTEXT", MARGIN + 5, y + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.TEXT);
  doc.text(regLines, MARGIN + 5, y + 15);
  
  y += boxHeight + 15;

  // Final Disclaimer
  doc.setFillColor(254, 226, 226);
  doc.rect(MARGIN, y, contentWidth, 30, 'F');
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text("DISCLAIMER", MARGIN + 5, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const disclaimer = "This report is based on satellite imagery, soil data, and AI-driven analysis. Ground verification is recommended before major input applications. Consult a certified agronomist for final treatment decisions.";
  const discLines = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(discLines, MARGIN + 5, y + 15);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages, data.generatedAt);
  }

  doc.save(`CropHealth_${data.farmName.replace(/\s+/g, '_')}_${data.scanDate}.pdf`);
};

export const exportFarmHealthToJSON = (data: FarmHealthAnalysis) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CropHealth_${data.farmName.replace(/\s+/g, '_')}_${data.scanDate}.json`;
  a.click();
};

export const exportFarmHealthToCSV = (data: FarmHealthAnalysis) => {
  let csv = "SECTION,METRIC,VALUE,DETAILS\n";
  csv += `SUMMARY,Report ID,${data.reportId},\n`;
  csv += `SUMMARY,Farm,${data.farmName},\n`;
  csv += `SUMMARY,Health Score,${data.healthScore},${data.healthLabel}\n`;
  data.interventions.forEach(i => {
      csv += `INTERVENTION,${i.priority},${i.action.replace(/,/g, '')},${i.expectedOutcome.replace(/,/g, '')}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CropHealth_${data.farmName.replace(/\s+/g, '_')}_${data.scanDate}.csv`;
  a.click();
};

export const exportFarmHealthToExcel = (data: FarmHealthAnalysis) => {
  const wb = XLSX.utils.book_new();
  const summary = [
      ["Report ID", data.reportId],
      ["Farm Name", data.farmName],
      ["Health Score", data.healthScore],
      ["Executive Summary", data.executiveSummary]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  const interventions = data.interventions.map(i => ({
      Priority: i.priority,
      Action: i.action,
      Goal: i.goal,
      Timing: i.timing,
      Cost: i.costLevel,
      Outcome: i.expectedOutcome
  }));
  const wsInterventions = XLSX.utils.json_to_sheet(interventions);
  XLSX.utils.book_append_sheet(wb, wsInterventions, "Interventions");
  safeWriteExcelFile(wb, `CropHealth_${data.farmName.replace(/\s+/g, '_')}_${data.scanDate}.xlsx`);
};
