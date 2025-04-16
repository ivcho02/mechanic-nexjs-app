import { Repair, Timestamp } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFMakeType = any;

/**
 * Formats a timestamp into a localized date string
 */
const formatDate = (timestamp: Timestamp, locale: string) => {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US');
};

/**
 * Generates a PDF for a repair quote
 */
export const generatePDF = async (
  repair: Repair,
  pdfMake: PDFMakeType,
  lang: string,
  setPdfLoading?: (loading: boolean) => void
) => {
  if (!pdfMake) return;
  if (setPdfLoading) setPdfLoading(true);

  try {
    const docDefinition = {
      defaultStyle: {
        font: 'Roboto'
      },
      content: [
        // Header
        { text: lang === 'bg' ? 'Автосервиз' : 'Auto Service', style: 'header', alignment: 'center' },
        { text: lang === 'bg' ? 'Оферта за ремонт' : 'Repair Quote', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },

        // Date and Offer Number
        { text: `${lang === 'bg' ? 'Дата' : 'Date'}: ${formatDate(repair.createdAt, lang)}`, margin: [0, 5, 0, 0] },
        { text: `${lang === 'bg' ? 'Номер на оферта' : 'Quote Number'}: ${repair.id}`, margin: [0, 0, 0, 10] },

        // Client Information
        {
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [
              [{ text: lang === 'bg' ? 'Информация за клиента' : 'Client Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
              [{ text: `${lang === 'bg' ? 'Име' : 'Name'}: ${repair.ownerName}` }],
              ...(repair.phone ? [[{ text: `${lang === 'bg' ? 'Телефон' : 'Phone'}: ${repair.phone}` }]] : []),
              [{ text: `${lang === 'bg' ? 'Автомобил' : 'Vehicle'}: ${repair.make} ${repair.model}` }],
              [{ text: `${lang === 'bg' ? 'Обем на двигателя' : 'Engine Size'}: ${repair.engineSize}` }]
            ]
          },
          margin: [0, 0, 0, 10]
        },

        // Services Section
        ...(repair.selectedServices && repair.selectedServices.length > 0
          ? [
              {
                table: {
                  headerRows: 1,
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: lang === 'bg' ? 'Услуга' : 'Service', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' },
                      { text: lang === 'bg' ? 'Цена' : 'Price', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff', alignment: 'right' }
                    ],
                    ...repair.selectedServices.map(service => [
                      service.name,
                      { text: `${service.price.toFixed(2)} ${lang === 'bg' ? 'лв.' : 'BGN'}`, alignment: 'right' }
                    ])
                  ]
                },
                margin: [0, 0, 0, 10]
              }
            ]
          : [
              {
                table: {
                  headerRows: 1,
                  widths: ['*'],
                  body: [
                    [{ text: lang === 'bg' ? 'Предложени ремонтни дейности' : 'Proposed Repair Services', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
                    [{ text: repair.repairs }]
                  ]
                },
                margin: [0, 0, 0, 10]
              }
            ]
        ),

        // Financial Information
        {
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [
              [{ text: lang === 'bg' ? 'Финансова информация' : 'Financial Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
              [{ text: `${lang === 'bg' ? 'Обща сума' : 'Total Amount'}: ${repair.cost} ${lang === 'bg' ? 'лв.' : 'BGN'}` }],
              [{ text: `${lang === 'bg' ? 'ДДС' : 'VAT'}: ${(repair.cost * 0.2).toFixed(2)} ${lang === 'bg' ? 'лв.' : 'BGN'}` }],
              [{ text: `${lang === 'bg' ? 'Крайна сума' : 'Final Amount'}: ${(repair.cost * 1.2).toFixed(2)} ${lang === 'bg' ? 'лв.' : 'BGN'}` }]
            ]
          },
          margin: [0, 0, 0, 10]
        },

        // Additional Information (if available)
        ...(repair.additionalInfo ? [{
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [
              [{ text: lang === 'bg' ? 'Допълнителна информация' : 'Additional Information', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
              [{ text: repair.additionalInfo }]
            ]
          },
          margin: [0, 0, 0, 10]
        }] : []),

        // Terms and Conditions
        {
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [
              [{ text: lang === 'bg' ? 'Общи условия' : 'Terms and Conditions', style: 'tableHeader', fillColor: '#2980b9', color: '#ffffff' }],
              [{ text: lang === 'bg'
                ? '1. Срокът за ремонт е приблизителен и може да се промени в зависимост от наличността на части.'
                : '1. The repair timeframe is approximate and may change depending on parts availability.' }],
              [{ text: lang === 'bg'
                ? '2. Офертата е валидна 7 дни от датата на издаване.'
                : '2. The quote is valid for 7 days from the date of issue.' }]
            ]
          },
          margin: [0, 0, 0, 10]
        },

        // Footer
        { text: lang === 'bg' ? 'С уважение,' : 'Best regards,', margin: [0, 20, 0, 0] },
        { text: lang === 'bg' ? 'Екипът на Автосервиз' : 'The Auto Service Team', margin: [0, 5, 0, 0] }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 20]
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white'
        }
      }
    };

    // Generate PDF
    const fileName = lang === 'bg'
      ? `оферта_ремонт_${repair.id}.pdf`
      : `repair_quote_${repair.id}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    if (setPdfLoading) setPdfLoading(false);
  }
};