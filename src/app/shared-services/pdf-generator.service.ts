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
    document.body.classList.add('pdf-capture-mode');
    try {
      // Configurar html2canvas para mejor calidad y captura de mapas
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
        // Configuraciones específicas para mapas
        foreignObjectRendering: true,
        imageTimeout: 15000, // Tiempo extra para cargar imágenes de mapas
        removeContainer: true,
        // Capturar elementos canvas (mapas)
        ignoreElements: (element) => {
          // No ignorar elementos canvas (mapas)
          return false;
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0); // Máxima calidad
      
      // Calcular dimensiones del PDF con márgenes
      const margin = 15; // Margen de 15mm en todos los lados
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const contentWidth = pageWidth - (margin * 2); // Ancho disponible para contenido
      const contentHeight = pageHeight - (margin * 2); // Alto disponible para contenido
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Agregar primera página con márgenes
      pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // Descargar el PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      document.body.classList.remove('pdf-capture-mode');
    }
  }

  /**
   * Prepara los mapas para captura en PDF - Optimizado para Mapbox GL JS
   */
  private async prepareMapForCapture(): Promise<void> {
    // Buscar específicamente elementos de Mapbox
    const mapboxElements = Array.from(document.querySelectorAll('.mapboxgl-map'));
    
    mapboxElements.forEach(mapElement => {
      try {
        // Para Mapbox GL JS - acceder a la instancia del mapa
        const mapInstance = (mapElement as any)._map || (mapElement as any).map;
        
        if (mapInstance) {
          // Forzar resize y re-render
          mapInstance.resize();
          
          // Forzar re-render del canvas si está disponible
          if (mapInstance.redraw) {
            mapInstance.redraw();
          }
          
          // Trigger repaint para asegurar que se rendericen los tiles
          if (mapInstance.triggerRepaint) {
            mapInstance.triggerRepaint();
          }
          
          console.log('Mapbox map prepared for PDF capture');
        }
      } catch (e) {
        console.warn('Could not prepare Mapbox map:', e);
      }
    });
    
    // También buscar otros tipos de mapas como fallback
    const otherMapElements = Array.from(document.querySelectorAll('.gm-style, .leaflet-container'));
    
    otherMapElements.forEach(mapElement => {
      try {
        if ((mapElement as any).map) {
          // Para Google Maps
          if ((window as any).google && (window as any).google.maps) {
            (window as any).google.maps.event.trigger((mapElement as any).map, 'resize');
          }
          // Para Leaflet
          if ((mapElement as any).map.invalidateSize) {
            (mapElement as any).map.invalidateSize();
          }
        }
      } catch (e) {
        console.warn('Could not prepare other map type:', e);
      }
    });
    
    // Esperar más tiempo para que Mapbox cargue completamente los tiles
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Genera un PDF del formulario de agricultor usando datos directos
   * @param farmerId - ID del agricultor
   * @param farmerName - Nombre del agricultor para el filename
   * @param farmerData - Datos del agricultor
   */
  async generateFarmerPdf(farmerId: string, farmerName: string = 'farmer', farmerData?: any): Promise<void> {
    if (farmerData) {
      // Generar PDF usando plantilla HTML directa
      await this.generateFarmerPdfFromData(farmerId, farmerName, farmerData);
    } else {
      // Método original - buscar el elemento del formulario
      const formElement = document.querySelector('.farmer-details-form') as HTMLElement;
      
      if (!formElement) {
        throw new Error('Farmer form element not found');
      }

      // Preparar mapas para captura
      await this.prepareMapForCapture();

      const filename = `agricultor-${farmerName.replace(/\s+/g, '-').toLowerCase()}-${farmerId}.pdf`;
      await this.generatePdfFromElement(formElement, filename);
    }
  }

  /**
   * Genera PDF usando datos directos sin capturar HTML
   */
  private async generateFarmerPdfFromData(farmerId: string, farmerName: string, data: any): Promise<void> {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Títulos de secciones usando las mismas claves i18n que la pantalla
    const T_BASIC_INFO = $localize`:@@collectorDetail.section.basicInfo:Información básica`;
    const T_ADDRESS = $localize`:@@collectorDetail.section.address:Dirección`;
    const T_ADDITIONAL_USER = $localize`:@@collectorDetail.section.additionalInfo:Información adicional sobre el usuario`;
    const T_FARM_INFO = $localize`:@@collectorDetail.section.farmInfo:Información adicional sobre la finca`;
    const T_BANK_INFO = $localize`:@@collectorDetail.section.bankInfo:Información bancaria`;
    const T_COMPANIES = $localize`:@@collectorDetail.section.companies:Empresas`;
    const T_ASSOCIATIONS = $localize`:@@collectorDetail.section.associations:Asociaciones`;
    const T_PRODUCT_TYPES = $localize`:@@collectorDetail.section.productTypes:Tipo de productos`;
    const T_PLOTS = $localize`:@@collectorDetail.section.plots:Parcelas`;
    const T_PURCHASE_ORDERS = $localize`:@@collectorDetail.section.purchaseOrders:Entregas`;
    const T_PAYMENTS = $localize`:@@collectorDetail.section.payments:Pagos`;
    const T_ACCUMULATED = $localize`:@@pdf.section.accumulatedSummary:Resumen de cantidades acumuladas`;
    const T_GIS = $localize`:@@pdf.section.gis:Información GIS (Sistema de Información Geográfica)`;

    // Encabezados de tabla
    const H_DATE = $localize`:@@collectorDetail.sortOptionsPO.date.name:Fecha`;
    const H_PRODUCT = $localize`:@@pdf.table.product:Producto`;
    const H_QUANTITY = $localize`:@@collectorDetail.sortOptionsPO.quantity.name:Cantidad (kg)`;
    const H_UNIT_PRICE = $localize`:@@pdf.table.unitPrice:Precio unitario`;
    const H_TOTAL = $localize`:@@pdf.table.total:Total`;
    const H_WEEK_NUMBER = $localize`:@@pdf.table.weekNumber:N° de Semana`;

    const HP_DATE = $localize`:@@collectorDetail.sortOptionsPO.date.name:Fecha`;
    const HP_CONCEPT = $localize`:@@productLabelPayments.sortOptions.paymentPurposeType.name:Propósito del pago`;
    const HP_METHOD = $localize`:@@productLabelPayments.sortOptions.wayOfPayment.name:Forma de pago`;
    const HP_AMOUNT = $localize`:@@productLabelBulkPayments.sortOptions.amount.name:Importe`;
    const HP_STATUS = $localize`:@@productLabelPayments.sortOptions.paymentStatus.name:Estado`;

    // Textos de resumen
    const S_TOTAL_BROUGHT = $localize`:@@collectorDetail.section.kgBrought:Total traído`;
    const S_TOTAL_PAID = $localize`:@@collectorDetail.section.totalPaidToFarmer:Total pagado`;
    const S_AVG_PRICE = $localize`:@@pdf.summary.averagePrice:Precio promedio`;
    const S_TOTAL_PRODUCTION = $localize`:@@pdf.summary.totalProduction:Producción total`;

    // Función helper para agregar texto
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      pdf.setFontSize(options.fontSize || 12);
      pdf.setFont('helvetica', options.fontStyle || 'normal');
      pdf.text(text, x, y);
      return y + (options.lineHeight || 7);
    };

    // Función helper para agregar línea
    const addLine = (y: number) => {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      return y + 5;
    };

    // Función helper para agregar tabla
    const addTable = (headers: string[], rows: any[][], startY: number) => {
      const colWidth = contentWidth / headers.length;
      let tableY = startY;
      
      // Encabezados de tabla
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, tableY, contentWidth, 8, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      headers.forEach((header, index) => {
        pdf.text(header, margin + (index * colWidth) + 2, tableY + 6);
      });
      
      tableY += 8;
      
      // Filas de datos
      pdf.setFont('helvetica', 'normal');
      rows.forEach((row, rowIndex) => {
        if (tableY > pageHeight - 30) {
          pdf.addPage();
          tableY = margin;
        }
        
        // Alternar color de fondo
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, tableY, contentWidth, 7, 'F');
        }
        
        row.forEach((cell, cellIndex) => {
          pdf.text(String(cell || ''), margin + (cellIndex * colWidth) + 2, tableY + 5);
        });
        
        tableY += 7;
      });
      
      return tableY + 5;
    };

    // Encabezado del reporte
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL AGRICULTOR', margin, 17);

    // Resetear color de texto
    pdf.setTextColor(0, 0, 0);
    currentY = 35;

    // Basic information (Información básica)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    currentY = addText(T_BASIC_INFO, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
    currentY = addLine(currentY);

    currentY = addText(`First name: ${data.name || 'No especificado'}`, margin, currentY);
    currentY = addText(`Last name: ${data.surname || 'No especificado'}`, margin, currentY);
    currentY = addText(`Gender: ${data.gender || 'No especificado'}`, margin, currentY);
    currentY += 5;

    // Address (Dirección)
    if (data.location) {
      currentY = addText(T_ADDRESS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      if (data.location.address) {
        const addr = data.location.address;
        currentY = addText(`Address: ${addr.address || 'No especificada'}`, margin, currentY);
        currentY = addText(`City: ${addr.city || 'No especificada'}`, margin, currentY);
        currentY = addText(`State/Province: ${addr.state || 'No especificado'}`, margin, currentY);
        currentY = addText(`ZIP code: ${addr.zip || 'No especificado'}`, margin, currentY);
      }
      currentY += 5;
    }

    // Additional information about user
    if (data.userCustomerType || data.phone || data.email) {
      currentY = addText(T_ADDITIONAL_USER, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      if (data.userCustomerType) {
        currentY = addText(`User type: ${data.userCustomerType}`, margin, currentY);
      }
      if (data.phone) {
        currentY = addText(`Phone: ${data.phone}`, margin, currentY);
      }
      if (data.email) {
        currentY = addText(`Email: ${data.email}`, margin, currentY);
      }
      currentY += 5;
    }

    // Additional information about the farm
    if (data.farm) {
      currentY = addText(T_FARM_INFO, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      currentY = addText(`Total cultivated area: ${data.farm.totalCultivatedArea || 'Not specified'} ha`, margin, currentY);
      currentY = addText(`Area unit: ${data.farm.areaUnit || 'Hectares'}`, margin, currentY);
      currentY = addText(`Organic: ${data.farm.organic ? 'Yes' : 'No'}`, margin, currentY);
      
      if (data.farm.areaOrganicCertified) {
        currentY = addText(`Organic certified area: ${data.farm.areaOrganicCertified} ha`, margin, currentY);
      }
      
      if (data.farm.maxProductionQuantity) {
        currentY = addText(`Max production quantity: ${data.farm.maxProductionQuantity} qq`, margin, currentY);
      }
      
      if (data.farm.startTransitionToOrganic) {
        currentY = addText(`Start transition to organic: ${new Date(data.farm.startTransitionToOrganic).toLocaleDateString('es-ES')}`, margin, currentY);
      }
      
      currentY += 5;
    }

    // Bank information
    if (data.bank) {
      currentY = addText(T_BANK_INFO, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      currentY = addText(`Account holder name: ${data.bank.accountHolderName || 'Not specified'}`, margin, currentY);
      currentY = addText(`Account number: ${data.bank.accountNumber || 'Not specified'}`, margin, currentY);
      currentY = addText(`Bank name: ${data.bank.bankName || 'Not specified'}`, margin, currentY);
      currentY += 5;
    }

    // Verificar si necesitamos una nueva página
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = margin;
    }

    // Companies
    if (data.companies && data.companies.length > 0) {
      currentY = addText(T_COMPANIES, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      data.companies.forEach((company: any, index: number) => {
        currentY = addText(`${index + 1}. ${company.name || 'Company without name'}`, margin + 5, currentY);
        if (company.headquarters?.address?.address) {
          currentY = addText(`   Address: ${company.headquarters.address.address}`, margin + 10, currentY);
        }
      });
      currentY += 5;
    }

    // Associations
    if (data.associations && data.associations.length > 0) {
      currentY = addText(T_ASSOCIATIONS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      data.associations.forEach((association: any, index: number) => {
        currentY = addText(`${index + 1}. ${association.company?.name || 'Association without name'}`, margin + 5, currentY);
        if (association.type) {
          currentY = addText(`   Type: ${association.type}`, margin + 10, currentY);
        }
      });
      currentY += 5;
    }

    // Product types
    if (data.productTypes && data.productTypes.length > 0) {
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addText(T_PRODUCT_TYPES, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      data.productTypes.forEach((productType: any, index: number) => {
        currentY = addText(`${index + 1}. ${productType.name || 'Product without name'}`, margin + 5, currentY);
        if (productType.description) {
          currentY = addText(`   Description: ${productType.description}`, margin + 10, currentY);
        }
      });
      currentY += 5;
    }

    // Verificar si necesitamos una nueva página para parcelas
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }

    // Plots
    if (data.plots && data.plots.length > 0) {
      currentY = addText(T_PLOTS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      data.plots.forEach((plot: any, index: number) => {
        currentY = addText(`${$localize`:@@pdf.plot.label:Parcela`} ${index + 1}`, margin, currentY, { fontSize: 12, fontStyle: 'bold' });
        
        if (plot.plotName) {
          currentY = addText(`${$localize`:@@pdf.plot.name:Nombre de la parcela`}: ${plot.plotName}`, margin + 5, currentY);
        }
        if (plot.size) {
          currentY = addText(`${$localize`:@@pdf.plot.size:Tamaño`}: ${plot.size} ha`, margin + 5, currentY);
        }
        if (plot.crop) {
          currentY = addText(`${$localize`:@@pdf.plot.crop:Cultivo`}: ${plot.crop}`, margin + 5, currentY);
        }
        if (plot.numberOfTrees) {
          currentY = addText(`${$localize`:@@pdf.plot.numberOfTrees:Número de árboles`}: ${plot.numberOfTrees}`, margin + 5, currentY);
        }
        if (plot.geoId) {
          currentY = addText(`${$localize`:@@pdf.plot.geoId:ID geográfico`}: ${plot.geoId}`, margin + 5, currentY);
        }
        
        // Coordenadas si están disponibles
        if (plot.boundary && plot.boundary.length > 0) {
          currentY = addText(`${$localize`:@@pdf.plot.coordinates:Coordenadas de la parcela`}:`, margin + 5, currentY);
          plot.boundary.slice(0, 3).forEach((coord: any, coordIndex: number) => {
            if (coord.latitude && coord.longitude) {
              currentY = addText(`  ${coordIndex + 1}. Lat: ${coord.latitude.toFixed(6)}, Lng: ${coord.longitude.toFixed(6)}`, margin + 10, currentY);
            }
          });
          if (plot.boundary.length > 3) {
            currentY = addText(`  ... y ${plot.boundary.length - 3} coordenadas más`, margin + 10, currentY);
          }
        }
        
        currentY += 3; // Espacio entre parcelas
        
        // Verificar si necesitamos nueva página
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin;
        }
      });
    }

    

    // TRANSACTIONAL DATA TABLES
    
    // Purchase orders (Entregas)
    if (data.deliveries && data.deliveries.length > 0) {
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addText(T_PURCHASE_ORDERS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      const deliveryHeaders = [H_DATE, H_PRODUCT, H_QUANTITY, H_UNIT_PRICE, H_TOTAL, H_WEEK_NUMBER];
      const deliveryRows = data.deliveries.map((delivery: any) => [
        delivery.date ? new Date(delivery.date).toLocaleDateString('es-ES') : '',
        delivery.product?.name || '',
        delivery.quantity || '0',
        delivery.unitPrice ? `$${delivery.unitPrice}` : '$0',
        delivery.totalAmount ? `$${delivery.totalAmount}` : '$0',
        delivery.weekNumber ? delivery.weekNumber.toString() : '-'
      ]);
      
      currentY = addTable(deliveryHeaders, deliveryRows, currentY);
    }

    // Payments
    if (data.payments && data.payments.length > 0) {
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addText(T_PAYMENTS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      const paymentHeaders = [HP_DATE, HP_CONCEPT, HP_METHOD, HP_AMOUNT, HP_STATUS];
      const paymentRows = data.payments.map((payment: any) => [
        payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-ES') : '',
        payment.paymentPurposeType || 'Payment',
        payment.paymentType || '',
        payment.amount ? `$${payment.amount}` : '$0',
        payment.paymentStatus || 'Pending'
      ]);
      
      currentY = addTable(paymentHeaders, paymentRows, currentY);
    }

    // Resumen de Cantidades Acumuladas
    if (data.totalProduction || data.totalPayments || data.totalDeliveries) {
      if (currentY > pageHeight - 80) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addText(T_ACCUMULATED, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      if (data.totalProduction) {
        currentY = addText(`${S_TOTAL_PRODUCTION}: ${data.totalProduction} kg`, margin, currentY);
      }
      if (data.totalDeliveries) {
        currentY = addText(`${S_TOTAL_BROUGHT}: ${data.totalDeliveries} kg`, margin, currentY);
      }
      if (data.totalPayments) {
        currentY = addText(`${S_TOTAL_PAID}: $${data.totalPayments}`, margin, currentY);
      }
      if (data.averagePrice) {
        currentY = addText(`${S_AVG_PRICE}: $${data.averagePrice}/kg`, margin, currentY);
      }
      currentY += 5;
    }

    // Información GIS/Mapa
    if (data.plots && data.plots.length > 0) {
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addText(T_GIS, margin, currentY, { fontSize: 14, fontStyle: 'bold', lineHeight: 10 });
      currentY = addLine(currentY);
      
      const totalArea = data.plots.reduce((sum: number, plot: any) => sum + (plot.size || 0), 0);
      currentY = addText(`Área Total de Parcelas: ${totalArea.toFixed(2)} ha`, margin, currentY);
      currentY = addText(`Número de Parcelas: ${data.plots.length}`, margin, currentY);
      
      if (data.plots[0]?.boundary && data.plots[0].boundary.length > 0) {
        const firstCoord = data.plots[0].boundary[0];
        currentY = addText(`Coordenadas Centrales: ${firstCoord.latitude?.toFixed(6)}, ${firstCoord.longitude?.toFixed(6)}`, margin, currentY);
      }
      
      currentY += 5;
    }

    // Pie de página
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - ID: ${farmerId}`, margin, footerY);
    pdf.text('Sistema INATrace - Trazabilidad Agrícola', pageWidth - margin - 60, footerY);

    // Guardar el PDF
    const filename = `agricultor-${farmerName.replace(/\s+/g, '-').toLowerCase()}-${farmerId}.pdf`;
    pdf.save(filename);
  }
}
