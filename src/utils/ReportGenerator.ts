import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationInput, CalculationOutput } from '../types';

export class ReportGenerator {
  public static generatePdf(input: CalculationInput, output: CalculationOutput) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Proračun Unutarnje Rasvjete (EN 12464-1)", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generirano: ${new Date().toLocaleDateString()}`, 14, 30);

    // Section 1: Ulazni podaci prostorije
    autoTable(doc, {
      startY: 40,
      head: [['Parametar Prostorije', 'Vrijednost', 'Jedinica']],
      body: [
        ['Duljina (Lj)', (input.room.lengthMm / 1000).toFixed(2), 'm'],
        ['Širina (W)', (input.room.widthMm / 1000).toFixed(2), 'm'],
        ['Visina (H)', (input.room.heightMm / 1000).toFixed(2), 'm'],
        ['Visina radne plohe (Hw)', (input.room.workPlaneHeightMm / 1000).toFixed(2), 'm'],
        ['Indeks prostorije (K)', output.roomIndex.toFixed(2), '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Section 2: Tehnički zahtjevi i Rasvjetno tijelo
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Rasvjetno tijelo & Normativi', 'Vrijednost']],
      body: [
        ['Odabrana svjetiljka', input.luminaire.name],
        ['Snaga po svjetiljci', `${input.luminaire.powerW} W`],
        ['Svjetlosni tok svjetiljke', `${input.luminaire.luminousFluxLm} lm`],
        ['Faktor iskoristivosti (UF)', output.utilizationFactor.toFixed(3)],
        ['Faktor održavanja (MF)', input.maintenanceFactor.toFixed(2)],
        ['Ciljana rasvijetljenost (Em)', `${input.targetIlluminanceLx} lx`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Section 3: Rezultati proračuna
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Analiza i Rezultati', 'Vrijednost']],
      body: [
        ['Ukupni potrebni svjetlosni tok', `${output.totalRequiredFluxLm} lm`],
        ['Teoretski potreban broj svjetiljki', output.requiredLuminaires.toFixed(2)],
        ['Odabrani raspored (X × Y)', `${output.arrangement.columns} × ${output.arrangement.rows}`],
        ['Ukupno ugrađeno svjetiljki', `${output.arrangement.totalLuminaires} kom`],
        ['Razmak osi (X)', `${(output.arrangement.spacingXMm / 1000).toFixed(2)} m`],
        ['Razmak osi (Y)', `${(output.arrangement.spacingYMm / 1000).toFixed(2)} m`],
        ['S/H omjer', output.spacingToHeightRatio.toFixed(2)],
        ['Ostvarena prosječna rasvijetljenost', `${output.actualIlluminanceLx.toFixed(1)} lx`],
        ['Specifična snaga', `${output.specificPowerWPerM2.toFixed(2)} W/m²`],
        ['Jednolikost (Uo = Emin/Em)', output.estimatedUo.toFixed(2)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
    });
    
    // Section 4: Energetska Učinkovitost (LENI)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Energetska Učinkovitost (EN 15193)', 'Vrijednost']],
      body: [
        ['Sati rada godišnje', `${input.energyParams.operatingHoursPerYear} h`],
        ['Ukupna instalirana snaga', `${(output.arrangement.totalLuminaires * input.luminaire.powerW).toFixed(1)} W`],
        ['Godišnja potrošnja energije', `${output.energy.yearlyConsumptionKwh.toFixed(1)} kWh/god`],
        ['Godišnji trošak (prosjek)', `${output.energy.yearlyCostEur.toFixed(2)} EUR`],
        ['LENI (Lighting Energy Numeric Indicator)', `${output.energy.leniKwhPerM2.toFixed(1)} kWh/m²/god`],
        ['Razred energetske učinkovitosti', `Klasa ${output.energy.energyClass}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18], textColor: [255,255,255] },
    });
    
    // Section 5: Heatmap distribution!
    if (output.heatmap) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(50);
      doc.text("Toplinska mapa rasvijetljenosti (Lux)", 14, 22);
      
      const hm = output.heatmap;
      const rows = hm.grid.length;
      const cols = hm.grid[0].length;
      
      const maxDrawWidth = 180;
      const maxDrawHeight = 200;
      const roomRatio = input.room.widthMm / input.room.lengthMm;
      
      let drawW, drawH;
      if (roomRatio > 1) { // width > length
         drawW = maxDrawWidth;
         drawH = maxDrawWidth / roomRatio;
         if (drawH > maxDrawHeight) {
           drawH = maxDrawHeight;
           drawW = maxDrawHeight * roomRatio;
         }
      } else { // length >= width
         drawH = maxDrawHeight;
         drawW = maxDrawHeight * roomRatio;
         if (drawW > maxDrawWidth) {
           drawW = maxDrawWidth;
           drawH = maxDrawWidth / roomRatio;
         }
      }
      
      const startX = 14;
      const startY = 30;
      const cellW = drawW / cols;
      const cellH = drawH / rows;
      
      for (let y = 0; y < rows; y++) {
         for (let x = 0; x < cols; x++) {
            const lux = hm.grid[y][x];
            const maxLx = Math.max(1, hm.maxLx);
            const ratio = Math.max(0, Math.min(1, lux / (maxLx * 1.05))); 
            
            let r = 0, g = 0, b = 0;
            if (ratio < 0.25) { b = 255; g = ratio * 4 * 255; }
            else if (ratio < 0.5) { g = 255; b = (1 - (ratio-0.25)*4) * 255; }
            else if (ratio < 0.75) { g = 255; r = ((ratio-0.5)*4) * 255; }
            else { r = 255; g = (1 - (ratio-0.75)*4) * 255; }
            
            doc.setFillColor(r, g, b);
            // Draw without border for seamless grid
            doc.rect(startX + x * cellW, startY + y * cellH, cellW, cellH, 'F');
         }
      }

      // Draw luminaires on the heatmap in PDF
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 74, 153);
      doc.setLineWidth(0.5);
      
      const isDownlight = input.luminaire.id.includes('dl-');
      const lumW = 4;
      
      for (let r = 0; r < output.arrangement.rows; r++) {
         for (let c = 0; c < output.arrangement.columns; c++) {
            const cx = startX + (c + 0.5) * (drawW / output.arrangement.columns);
            const cy = startY + (r + 0.5) * (drawH / output.arrangement.rows);
            if (isDownlight) {
              doc.circle(cx, cy, lumW / 2, 'FD');
            } else {
              doc.rect(cx - lumW/2, cy - lumW/2, lumW, lumW, 'FD');
            }
         }
      }

      // Add legend
      doc.setFontSize(10);
      const legendTextY = startY + drawH + 20;
      doc.text(`Min: ${hm.minLx.toFixed(0)} lx`, startX, legendTextY);
      doc.text(`Prosjek (Avg): ${hm.avgLx.toFixed(0)} lx`, startX + drawW/2 - 20, legendTextY);
      doc.text(`Max: ${hm.maxLx.toFixed(0)} lx`, startX + drawW - 30, legendTextY);
      
      // Draw Color Gradient Bar
      const cbStartX = startX;
      const cbStartY = startY + drawH + 8;
      const cbWidth = drawW;
      const cbHeight = 6;
      const steps = 100;
      for (let i = 0; i < steps; i++) {
         const ratio = i / steps;
         let r = 0, g = 0, b = 0;
         if (ratio < 0.25) { b = 255; g = ratio * 4 * 255; }
         else if (ratio < 0.5) { g = 255; b = (1 - (ratio-0.25)*4) * 255; }
         else if (ratio < 0.75) { g = 255; r = ((ratio-0.5)*4) * 255; }
         else { r = 255; g = (1 - (ratio-0.75)*4) * 255; }
         doc.setFillColor(r, g, b);
         doc.rect(cbStartX + (i * cbWidth / steps), cbStartY, (cbWidth / steps) + 0.2, cbHeight, 'F'); 
      }
    }
    
    // Potpis / Engineering mark
    const finalY = doc.internal.pages.length === 1 ? (doc as any).lastAutoTable.finalY + 20 : 270;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Proračun izveden standardnom zonskom metodom. Aplikacija koristi strogu aritmetiku.", 14, finalY);

    doc.save('El_Proracun_Rasvjete.pdf');
  }
}
