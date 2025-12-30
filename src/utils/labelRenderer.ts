import { LabelLayout, LabelElement } from '../types/labelLayout';
import { IVariant } from '../types/models';
import { InventoryProduct } from '../store/slices/inventorySlice';

/**
 * Get data value for a label element type
 */
export function getElementValue(
  elementType: string,
  product: InventoryProduct,
  variant: IVariant,
  formatAttributes: (attrs: Record<string, string> | string) => string
): string {
  switch (elementType) {
    case 'product-name':
      return product.name || '';
    case 'variant-name':
      const variantName = formatAttributes(variant.attributes);
      return `${product.name}${variantName ? ` - ${variantName}` : ''}`;
    case 'variant-features':
      return formatAttributes(variant.attributes);
    case 'sku':
      return variant.sku || variant.id || '';
    case 'barcode':
      return product.barcode || variant.sku || variant.id || '';
    case 'price':
      const price = typeof variant.price === 'number' ? variant.price : 0;
      return `$${price.toFixed(2)}`;
    case 'cost':
      const cost = typeof variant.cost === 'number' ? variant.cost : 0;
      return `$${cost.toFixed(2)}`;
    default:
      return '';
  }
}

/**
 * Generate CSS for a label element
 */
export function generateElementCSS(element: LabelElement): string {
  return `
    .label-element-${element.id} {
      position: absolute;
      left: ${element.position.x}mm;
      top: ${element.position.y}mm;
      width: ${element.size.width}mm;
      height: ${element.size.height}mm;
      font-size: ${element.style.fontSize}px;
      font-weight: ${element.style.fontWeight};
      color: ${element.style.color};
      background-color: ${element.style.backgroundColor};
      padding: ${element.style.padding}mm;
      box-sizing: border-box;
      overflow: hidden;
      word-wrap: break-word;
    }
  `;
}

/**
 * Generate HTML for a single label element
 */
export function generateElementHTML(
  element: LabelElement,
  value: string,
  variant: IVariant,
  product: InventoryProduct
): string {
  if (!element.visible) return '';

  // Special handling for QR code - if SKU element is large enough, render as QR code
  // Otherwise render as text with "SKU: " prefix
  if (element.type === 'sku') {
    const sku = variant.sku || variant.id || '';
    // If element is reasonably sized (width and height > 15mm), render as QR code
    if (element.size.width > 15 && element.size.height > 15) {
      const qrSize = Math.min(Math.round(element.size.width * 3.779), Math.round(element.size.height * 3.779));
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(sku)}`;
      return `
        <div class="label-element-${element.id}" style="display: flex; align-items: center; justify-content: center;">
          <img src="${qrCodeUrl}" alt="QR Code for ${sku}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      `;
    }
    // Small SKU element - render as text
    return `
      <div class="label-element-${element.id}">
        SKU: ${value}
      </div>
    `;
  }

  return `
    <div class="label-element-${element.id}">
      ${value}
    </div>
  `;
}

/**
 * Generate HTML for a single label using the layout
 */
export function generateLabelHTML(
  layout: LabelLayout,
  product: InventoryProduct,
  variant: IVariant,
  formatAttributes: (attrs: Record<string, string> | string) => string
): string {
  const backgroundStyle = layout.backgroundImage
    ? `background-image: url('${layout.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : 'background: #ffffff;';

  const elementsHTML = layout.elements
    .map(element => {
      const value = getElementValue(element.type, product, variant, formatAttributes);
      return generateElementHTML(element, value, variant, product);
    })
    .join('');

  const elementsCSS = layout.elements.map(element => generateElementCSS(element)).join('');

  return `
    <div class="label-container" style="${backgroundStyle}">
      ${elementsHTML}
      <style>
        .label-container {
          position: relative;
          width: ${layout.labelSize.width}mm;
          height: ${layout.labelSize.height}mm;
          box-sizing: border-box;
        }
        ${elementsCSS}
      </style>
    </div>
  `;
}

/**
 * Generate complete HTML page with multiple labels per page
 */
export function generateLabelsPageHTML(
  layout: LabelLayout,
  variants: IVariant[],
  product: InventoryProduct,
  formatAttributes: (attrs: Record<string, string> | string) => string
): string {
  const pageWidth = layout.pageSize.width;
  const pageHeight = layout.pageSize.height;
  const margin = 5; // mm
  const labelWidth = layout.labelSize.width;
  const labelHeight = layout.labelSize.height;

  // Calculate positions for each label in the grid
  const labelsPerPage = layout.grid.rows * layout.grid.cols;
  const labels: string[] = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const pageIndex = Math.floor(i / labelsPerPage);
    const labelIndexInPage = i % labelsPerPage;
    const row = Math.floor(labelIndexInPage / layout.grid.cols);
    const col = labelIndexInPage % layout.grid.cols;

    const labelX = margin + col * (labelWidth + margin);
    const labelY = margin + row * (labelHeight + margin);

    const labelHTML = generateLabelHTML(layout, product, variant, formatAttributes);

    // Start new page if needed
    if (labelIndexInPage === 0 && pageIndex > 0) {
      labels.push('</div>'); // Close previous page
    }

    // Start page if first label
    if (labelIndexInPage === 0) {
      labels.push(`<div class="label-page">`);
    }

    labels.push(`
      <div class="label-position" style="position: absolute; left: ${labelX}mm; top: ${labelY}mm;">
        ${labelHTML}
      </div>
    `);

    // Close page if last label in page or last label overall
    if (labelIndexInPage === labelsPerPage - 1 || i === variants.length - 1) {
      labels.push('</div>');
    }
  }

  const backgroundStyle = layout.backgroundImage
    ? `background-image: url('${layout.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : 'background: #f5f5f5;';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Variant Labels - ${variants.length} label(s)</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .label-page { page-break-after: always; }
          .label-page:last-child { page-break-after: auto; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          ${backgroundStyle}
        }
        .label-page {
          width: ${pageWidth}mm;
          height: ${pageHeight}mm;
          position: relative;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${labels.join('')}
      <script>
        window.onload = function() {
          setTimeout(() => window.print(), 250);
        }
      </script>
    </body>
    </html>
  `;
}

