// Label element types
export type LabelFieldType = 
  | 'product-name' 
  | 'variant-name' 
  | 'variant-features' 
  | 'sku' 
  | 'price' 
  | 'barcode' 
  | 'cost';

export interface LabelElement {
  id: string;
  type: LabelFieldType;
  visible: boolean;
  position: { x: number; y: number }; // in mm
  size: { width: number; height: number }; // in mm
  style: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '600' | '700' | '800';
    color: string;
    backgroundColor: string;
    padding: number;
  };
}

export interface LabelLayout {
  id: string;
  name: string;
  pageSize: { width: number; height: number }; // A4: 210x297mm
  grid: { rows: number; cols: number }; // e.g., {rows: 2, cols: 2}
  labelSize: { width: number; height: number }; // calculated per label
  elements: LabelElement[];
  backgroundImage?: string; // base64
  createdAt: string;
  updatedAt: string;
}

export type LabelLayouts = LabelLayout[];

