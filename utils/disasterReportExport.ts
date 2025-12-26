import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { DisasterAnalysis } from '../services/DisasterReportEnhancement';
import { safeWriteExcelFile } from '../utils/safeExcelHandler';

// --- Constants & Styling (Refined to match Farm Report standards) ---
const COLORS = {
  HEADER: '#7F1D1D',    // Deep Red for Disaster
  ACCENT: '#DC2626',    // Bright Red
  TEXT: '#1F2937',      // Gray 800
  SUBHEADER: '#991B1B', // Medium Red
  BOX_BG: [254, 242, 242], // Red 50
  PRIORITY: {
    P1: [254, 226, 226], // Red 100
    P2: [255, 237, 213], // Orange 100
    P3: [254, 243, 199]  // Amber 100
  },
  SEVERITY: {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#EAB308',
    LOW: '#22C55E'
  }
};

const MARGIN = 15; // mm

const getSevColor = (score: number) => {
  if (score >= 8) return COLORS.SEVERITY.CRITICAL;
  if (score >= 5) return COLORS.SEVERITY.HIGH;
  if (score >= 3) return COLORS.SEVERITY.MEDIUM;
  return COLORS.SEVERITY.LOW;
};

// --- Helper Functions ---

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

const addFooter = (doc: any, pageNum: number, totalPages: number, generatedAt: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`CropHealth Risk Monitor | Generated: ${new Date(generatedAt).toLocaleString()}`, MARGIN, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' });
};

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

// --- Main PDF Export ---

export const exportDisasterToPDF = async (
  data: DisasterAnalysis, 
  satelliteImg: string | null, 
  impactImg: string | null, 
  qrCode: string | null
) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }) as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (MARGIN * 2);
  let y = 0;

  // --- PAGE 1: Situation Overview ---
  doc.setFillColor(COLORS.HEADER);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("DISASTER SITUATION REPORT", MARGIN, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.metadata.location.region}, ${data.metadata.location.country} • ${new Date(data.metadata.detectionTime).toLocaleString()}`, MARGIN, 24);

  // Prominent Circle Score (Severity)
  const badgeX = pageWidth - MARGIN - 30;
  const badgeY = 15;
  doc.setFillColor(255, 255, 255);
  doc.circle(badgeX + 15, badgeY, 12, 'F'); 
  doc.setTextColor(getSevColor(data.metadata.severity));
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(String(data.metadata.severity), badgeX + 15, badgeY + 1, { align: 'center' });
  doc.setFontSize(7);
  doc.text("/10", badgeX + 15, badgeY + 5, { align: 'center' });

  y = 40;

  // Imagery Section
  const imgW = 85;
  const imgH = 85; 
  const imgSpacing = 5;
  
  // Satellite
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, imgW, imgH, 'F');
  if (satelliteImg) {
    try { doc.addImage(satelliteImg, 'JPEG', MARGIN, y, imgW, imgH); } catch (e) {}
  }
  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("Source: Sentinel-2 Satellite Observation", MARGIN, y + imgH + 5);

  // Impact Map
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN + imgW + imgSpacing, y, imgW, imgH, 'F');
  if (impactImg) {
    try { doc.addImage(impactImg, 'PNG', MARGIN + imgW + imgSpacing, y, imgW, imgH); } catch (e) {}
  }
  doc.text("Source: AI-Generated Strategic Impact Map", MARGIN + imgW + imgSpacing, y + imgH + 5);

  y += imgH + 15;

  // Metric Cards
  const cardW = 40; const cardH = 25;
  const gap = (contentWidth - (cardW * 4)) / 3;
  drawMetricCard(doc, MARGIN, y, cardW, cardH, "Impact Time", data.riskAssessment.immediateRisk.timeToImpact, COLORS.SEVERITY.CRITICAL);
  drawMetricCard(doc, MARGIN + cardW + gap, y, cardW, cardH, "Pop. At Risk", data.riskAssessment.immediateRisk.populationAtRisk.toLocaleString(), COLORS.SEVERITY.HIGH);
  drawMetricCard(doc, MARGIN + (cardW + gap) * 2, y, cardW, cardH, "Confidence", `${(data.meta.overallConfidenceScore * 100).toFixed(0)}%`, COLORS.SEVERITY.MEDIUM);
  drawMetricCard(doc, MARGIN + (cardW + gap) * 3, y, cardW, cardH, "Area SqKm", String(data.metadata.location.affectedAreaSqKm), COLORS.TEXT);

  y += cardH + 15;

  // Executive Summary
  doc.setFontSize(14); doc.setTextColor(COLORS.HEADER); doc.setFont('helvetica', 'bold');
  doc.text("EXECUTIVE ASSESSMENT", MARGIN, y);
  doc.setLineWidth(0.5); doc.setDrawColor(COLORS.HEADER);
  doc.line(MARGIN, y + 2, MARGIN + 70, y + 2);
  y += 10;
  doc.setFontSize(11); doc.setTextColor(COLORS.TEXT); doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(data.riskAssessment.immediateRisk.description, contentWidth);
  doc.text(summaryLines, MARGIN, y);

  // --- PAGE 2: Environmental & Detailed Impact ---
  doc.addPage();
  addPageHeader(doc, "ENVIRONMENTAL & IMPACT ASSESSMENT", data.metadata.eventId);
  y = 30;

  const envData = [
    ['Metric', 'Observation', 'Status'],
    ['Temperature', `${data.riskAssessment.environmentalFactors.temperature}°C`, 'Monitored'],
    ['Humidity', `${data.riskAssessment.environmentalFactors.humidity}%`, 'Critical Window'],
    ['Wind Speed', `${data.riskAssessment.environmentalFactors.windSpeed} m/s`, 'Vector Analysis'],
    ['Wind Direction', data.riskAssessment.environmentalFactors.windDirection, 'Trajectory Lock'],
    ['Precipitation', `${data.riskAssessment.environmentalFactors.precipitation} mm`, 'Observed']
  ];

  autoTable(doc, {
    startY: y,
    head: [envData[0]],
    body: envData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: COLORS.HEADER },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14); doc.setTextColor(COLORS.HEADER); doc.setFont('helvetica', 'bold');
  doc.text("DETAILED RISK MATRIX", MARGIN, y);
  doc.line(MARGIN, y + 2, MARGIN + 80, y + 2);
  y += 10;

  const impactData = [
    { title: "Predicted Spread Potential", text: data.riskAssessment.trajectoryPrediction.spreadRate },
    { title: "Atmospheric Influence", text: data.riskAssessment.trajectoryPrediction.windInfluence },
    { title: "Strategic Trajectory Path", text: data.riskAssessment.trajectoryPrediction.predictedPath }
  ];

  impactData.forEach(item => {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.SUBHEADER);
    doc.text(item.title, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.TEXT);
    const lines = doc.splitTextToSize(item.text, contentWidth);
    doc.text(lines, MARGIN, y);
    y += (lines.length * 5) + 5;
  });

  // --- PAGE 3: Strategic Intervention Plan ---
  doc.addPage();
  addPageHeader(doc, "STRATEGIC INTERVENTION PLAN", data.metadata.eventId);
  y = 30;

  const actionRows = data.interventionStrategy.immediateActions.map(a => [
    `P${a.priority}`,
    a.action,
    a.goal || "Protect assets",
    a.impact || "Risk reduction",
    `${a.responsibleAgency}\n${a.resources.join(', ')}`,
    a.timing,
    a.costLevel || "Medium",
    a.expectedOutcome
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Pri', 'Action', 'Goal', 'Impact', 'Materials/Agency', 'Timing', 'Cost', 'Outcome']],
    body: actionRows,
    headStyles: { fillColor: COLORS.HEADER },
    styles: { fontSize: 7, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      7: { fontStyle: 'italic' }
    },
    didParseCell: (cellData) => {
        if (cellData.section === 'body') {
            const raw = cellData.row.raw as any[];
            if (raw[0] === 'P1') cellData.cell.styles.fillColor = COLORS.PRIORITY.P1 as any;
            if (raw[0] === 'P2') cellData.cell.styles.fillColor = COLORS.PRIORITY.P2 as any;
            if (raw[0] === 'P3') cellData.cell.styles.fillColor = COLORS.PRIORITY.P3 as any;
        }
    }
  });

  // --- PAGE 4: Logistics & Operations ---
  doc.addPage();
  addPageHeader(doc, "LOGISTICS & RESOURCE ALLOCATION", data.metadata.eventId);
  y = 30;

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.HEADER);
  doc.text("EVACUATION PROTOCOLS", MARGIN, y);
  y += 10;

  const evacRows = data.interventionStrategy.evacuationPlan.zones.map(z => [z.name, z.evacuationRoute, z.timeToEvacuate, z.population.toLocaleString()]);
  autoTable(doc, {
    startY: y,
    head: [['Zone', 'Route', 'Est. Time', 'Pop.']],
    body: evacRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.SUBHEADER },
    styles: { fontSize: 10 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.HEADER);
  doc.text("DEPLOYED ASSETS", MARGIN, y);
  y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.TEXT);
  const assets = [
    `• Firefighting: ${data.interventionStrategy.resourceAllocation.firefighting}`,
    `• Medical: ${data.interventionStrategy.resourceAllocation.medical}`,
    `• Emergency Services: ${data.interventionStrategy.resourceAllocation.emergency}`,
    `• Designated Shelters: ${data.interventionStrategy.evacuationPlan.shelterLocations.join(', ')}`
  ];
  assets.forEach(a => { doc.text(a, MARGIN, y); y += 6; });

  // --- PAGE 5: Communication & Monitoring ---
  doc.addPage();
  addPageHeader(doc, "MONITORING & PUBLIC COMMS", data.metadata.eventId);
  y = 30;

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.HEADER);
  doc.text("PUBLIC SAFETY ALERTS", MARGIN, y);
  y += 8;
  data.communicationStrategy.publicAlerts.keyMessages.forEach(msg => {
    doc.setFillColor(COLORS.ACCENT); doc.rect(MARGIN, y - 3, 2, 2, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(msg, contentWidth - 10);
    doc.text(lines, MARGIN + 5, y); y += (lines.length * 5) + 3;
  });

  y += 10;
  const monitorRows = data.monitoringPlan.timelinePhases.map(p => [p.phase, p.actions.join(', '), p.checkpoints.join(', ')]);
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Strategic Actions', 'Checkpoints']],
    body: monitorRows,
    headStyles: { fillColor: COLORS.HEADER },
    styles: { fontSize: 9 }
  });

  // --- PAGE 6: Digital Access ---
  doc.addPage();
  addPageHeader(doc, "DIGITAL LINK & VERIFICATION", data.metadata.eventId);
  y = 40;

  if (qrCode) {
    try { doc.addImage(qrCode, 'PNG', 30, y, 60, 60); } catch (e) {}
  }
  
  doc.setFontSize(9); doc.setTextColor(150, 150, 150);
  doc.text(`Report ID: ${data.metadata.eventId}`, 30, y + 65);
  doc.text(`Source Node: ${data.meta.reportVersion}`, 30, y + 70);
  doc.text(`Sync Date: ${new Date(data.meta.generatedAt || '').toUTCString()}`, 30, y + 75);

  doc.setFontSize(14); doc.setTextColor(COLORS.HEADER); doc.setFont('helvetica', 'bold');
  doc.text("DISPATCH INSTRUCTIONS", 110, y);
  y += 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.TEXT);
  const instructions = ["1. Scan QR for mobile field node.", "2. Access secure Situational URL.", "3. Disseminate link to agencies.", "4. Report updates automatically."];
  instructions.forEach(inst => { doc.text(inst, 110, y); y += 8; });

  // --- PAGE 7: Context & Disclaimer ---
  doc.addPage();
  addPageHeader(doc, "HISTORICAL CONTEXT & DISCLAIMER", data.metadata.eventId);
  y = 30;

  if (data.historicalContext) {
    const historyRows = data.historicalContext.previousSimilarEvents.map(h => [h.year, h.event, h.impact]);
    autoTable(doc, {
      startY: y,
      head: [['Year', 'Verified Event', 'Impact Analysis']],
      body: historyRows,
      theme: 'striped',
      headStyles: { fillColor: COLORS.HEADER }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.HEADER);
    doc.text("REGIONAL RISK PROFILE", MARGIN, y);
    y += 6;
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(COLORS.TEXT);
    const profile = doc.splitTextToSize(data.historicalContext.regionalRiskProfile, contentWidth);
    doc.text(profile, MARGIN, y);
    y += (profile.length * 5) + 15;
  }

  doc.setFillColor(254, 226, 226);
  doc.rect(MARGIN, pageHeight - 50, contentWidth, 30, 'F');
  doc.setFontSize(10); doc.setTextColor(185, 28, 28); doc.setFont('helvetica', 'bold');
  doc.text("TACTICAL DISCLAIMER", MARGIN + 5, pageHeight - 42);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.TEXT);
  const disc = "SITREP is based on current EONET and spatial-sensor telemetry. This constitute a field draft generated by the AI Autonomous Core. Ground verification is mandatory. Observe all local authority directives immediately.";
  doc.text(doc.splitTextToSize(disc, contentWidth - 10), MARGIN + 5, pageHeight - 35);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, data.meta.generatedAt || '');
  }

  doc.save(`${data.metadata.eventId}_SituationReport.pdf`);
};

// --- Other Formats ---
export const exportDisasterToExcel = (data: DisasterAnalysis) => {
  const wb = XLSX.utils.book_new();
  const summary = [["Report ID", data.metadata.eventId], ["Event Type", data.metadata.disasterType], ["Severity", data.metadata.severity], ["Region", data.metadata.location.region]];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Overview");
  const actions = data.interventionStrategy.immediateActions.map(a => ({
    Priority: a.priority, Action: a.action, Goal: a.goal, Impact: a.impact, Agency: a.responsibleAgency, Timing: a.timing
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actions), "Strategic Plan");
  safeWriteExcelFile(wb, `${data.metadata.eventId}_Tactical_Log.xlsx`);
};

export const exportDisasterToCSV = (data: DisasterAnalysis) => {
  let csv = "SECTION,KEY,VALUE\nMETADATA,ID," + data.metadata.eventId + "\nMETADATA,TYPE," + data.metadata.disasterType + "\nRISK,SEVERITY," + data.metadata.severity + "\n";
  data.interventionStrategy.immediateActions.forEach(a => {
    csv += `ACTION,P${a.priority},${a.action.replace(/,/g, '')}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${data.metadata.eventId}.csv`; a.click();
};

export const exportDisasterToJSON = (data: DisasterAnalysis) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${data.metadata.eventId}.json`; a.click();
};