import { LabelLayout, LabelElement } from '../types/labelLayout';

/**
 * Create a default label layout with common elements
 */
export function createDefaultLayout(): LabelLayout {
  const pageSize = { width: 210, height: 297 }; // A4 in mm
  const grid = { rows: 2, cols: 2 };
  const margin = 5; // mm
  const labelWidth = (pageSize.width - margin * (grid.cols + 1)) / grid.cols;
  const labelHeight = (pageSize.height - margin * (grid.rows + 1)) / grid.rows;

  const elements: LabelElement[] = [
    {
      id: 'elem-product-name',
      type: 'product-name',
      visible: true,
      position: { x: 5, y: 5 },
      size: { width: labelWidth - 10, height: 12 },
      style: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: 2,
      },
    },
    {
      id: 'elem-variant-features',
      type: 'variant-features',
      visible: true,
      position: { x: 5, y: 20 },
      size: { width: labelWidth - 10, height: 10 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#333333',
        backgroundColor: '#ffffff',
        padding: 2,
      },
    },
    {
      id: 'elem-sku-qr',
      type: 'sku',
      visible: true,
      position: { x: 5, y: 35 },
      size: { width: 40, height: 40 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: 2,
      },
    },
    {
      id: 'elem-price',
      type: 'price',
      visible: true,
      position: { x: labelWidth - 50, y: 35 },
      size: { width: 45, height: 15 },
      style: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: 2,
      },
    },
    {
      id: 'elem-sku-text',
      type: 'sku',
      visible: true,
      position: { x: 5, y: labelHeight - 15 },
      size: { width: labelWidth - 10, height: 10 },
      style: {
        fontSize: 10,
        fontWeight: 'normal',
        color: '#666666',
        backgroundColor: '#ffffff',
        padding: 1,
      },
    },
  ];

  return {
    id: 'default-layout',
    name: 'Default Layout',
    pageSize,
    grid,
    labelSize: { width: labelWidth, height: labelHeight },
    elements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

