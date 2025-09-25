import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() { }

  /**
   * Genera un PDF a partir de un elemento HTML
   * @param element - Elemento HTML a convertir
   * @param filename - Nombre del archivo PDF
   */
  async generatePdfFromElement(element: HTMLElement, filename: string = 'document.pdf'): Promise<void> {
    try {
      // Configurar html2canvas para mejor calidad
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calcular dimensiones del PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Agregar primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Descargar el PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Genera un PDF del formulario de agricultor
   * @param farmerId - ID del agricultor
   * @param farmerName - Nombre del agricultor para el filename
   */
  async generateFarmerPdf(farmerId: string, farmerName: string = 'farmer'): Promise<void> {
    // Buscar el elemento del formulario
    const formElement = document.querySelector('.farmer-details-form') as HTMLElement;
    
    if (!formElement) {
      throw new Error('Farmer form element not found');
    }

    const filename = `farmer-${farmerName.replace(/\s+/g, '-').toLowerCase()}-${farmerId}.pdf`;
    await this.generatePdfFromElement(formElement, filename);
  }
}
