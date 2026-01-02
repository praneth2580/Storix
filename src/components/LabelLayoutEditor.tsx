import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Move, Maximize2, Minimize2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { LabelLayout, LabelElement, LabelFieldType } from '../types/labelLayout';

interface LabelLayoutEditorProps {
  layout: LabelLayout | null;
  onSave: (layout: LabelLayout) => void;
  onCancel: () => void;
}

const FIELD_TYPES: { value: LabelFieldType; label: string }[] = [
  { value: 'product-name', label: 'Product Name' },
  { value: 'variant-name', label: 'Variant Name' },
  { value: 'variant-features', label: 'Variant Features' },
  { value: 'sku', label: 'SKU' },
  { value: 'price', label: 'Price' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'cost', label: 'Cost' },
];

const DEFAULT_ELEMENT_STYLE = {
  fontSize: 12,
  fontWeight: 'normal' as const,
  color: '#000000',
  backgroundColor: '#ffffff',
  padding: 2,
};

export function LabelLayoutEditor({ layout, onSave, onCancel }: LabelLayoutEditorProps) {
  const [layoutName, setLayoutName] = useState(layout?.name || 'New Layout');
  const [gridRows, setGridRows] = useState(layout?.grid.rows || 2);
  const [gridCols, setGridCols] = useState(layout?.grid.cols || 2);
  const [elements, setElements] = useState<LabelElement[]>(layout?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(layout?.backgroundImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const pageSize = { width: 210, height: 297 }; // A4 in mm
  const margin = 5; // mm
  const labelWidth = (pageSize.width - margin * (gridCols + 1)) / gridCols;
  const labelHeight = (pageSize.height - margin * (gridRows + 1)) / gridRows;

  // Update label size when grid changes
  useEffect(() => {
    // This will be used when saving
  }, [gridRows, gridCols]);

  const handleAddElement = (type: LabelFieldType) => {
    const newElement: LabelElement = {
      id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      visible: true,
      position: { x: 10, y: 10 },
      size: { width: 50, height: 10 },
      style: { ...DEFAULT_ELEMENT_STYLE },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleElementPropertyChange = (id: string, property: keyof LabelElement, value: any) => {
    setElements(elements.map(elem => {
      if (elem.id === id) {
        if (property === 'style') {
          return { ...elem, style: { ...elem.style, ...value } };
        }
        if (property === 'position' || property === 'size') {
          return { ...elem, [property]: { ...elem[property], ...value } };
        }
        return { ...elem, [property]: value };
      }
      return elem;
    }));
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = labelWidth / rect.width;
    const scaleY = labelHeight / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setDragOffset({
      x: mouseX - element.position.x,
      y: mouseY - element.position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = labelWidth / rect.width;
    const scaleY = labelHeight / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const newX = Math.max(0, Math.min(labelWidth - elements.find(el => el.id === selectedElement)!.size.width, mouseX - dragOffset.x));
    const newY = Math.max(0, Math.min(labelHeight - elements.find(el => el.id === selectedElement)!.size.height, mouseY - dragOffset.y));

    handleElementPropertyChange(selectedElement, 'position', { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const savedLayout: LabelLayout = {
      id: layout?.id || `layout-${Date.now()}`,
      name: layoutName,
      pageSize,
      grid: { rows: gridRows, cols: gridCols },
      labelSize: { width: labelWidth, height: labelHeight },
      elements,
      backgroundImage: backgroundImage || undefined,
      createdAt: layout?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('savedLayout', savedLayout);
    onSave(savedLayout);
  };

  const selectedElementData = elements.find(e => e.id === selectedElement);

  // Scale factor for preview (canvas will be 400px wide, label is labelWidth mm)
  const previewScale = 400 / labelWidth;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-secondary border border-border-primary w-full max-w-7xl shadow-2xl rounded-lg overflow-hidden my-8 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border-primary bg-tertiary">
          <h2 className="text-xl font-bold">Label Layout Editor</h2>
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary transition-colors p-2 hover:bg-primary rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Element List */}
          <div className="w-64 border-r border-border-primary bg-primary overflow-y-auto p-4">
            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                Layout Name
              </label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-full bg-secondary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                Grid Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-muted">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={gridRows}
                    onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                    className="w-full bg-secondary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Cols</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={gridCols}
                    onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                    className="w-full bg-secondary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                Background Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageChange}
                className="w-full text-xs"
              />
              {backgroundImage && (
                <button
                  onClick={() => setBackgroundImage(null)}
                  className="mt-2 text-xs text-accent-red hover:underline"
                >
                  Remove Background
                </button>
              )}
            </div>

            <div className="mb-4 border-t border-border-primary pt-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                Add Elements
              </label>
              <div className="space-y-1">
                {FIELD_TYPES.map(field => (
                  <button
                    key={field.value}
                    onClick={() => handleAddElement(field.value)}
                    className="w-full text-left px-2 py-1.5 text-xs bg-secondary hover:bg-tertiary border border-border-primary rounded-sm transition-colors"
                  >
                    + {field.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border-primary pt-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                Elements ({elements.length})
              </label>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {elements.map(element => {
                  const fieldType = FIELD_TYPES.find(f => f.value === element.type);
                  return (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 text-xs border rounded-sm cursor-pointer transition-colors ${
                        selectedElement === element.id
                          ? 'bg-accent-blue/20 border-accent-blue'
                          : 'bg-secondary border-border-primary hover:bg-tertiary'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <span>{fieldType?.label || element.type}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(element.id);
                        }}
                        className="text-accent-red hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel - Visual Preview */}
          <div className="flex-1 p-4 overflow-y-auto bg-secondary">
            <div className="flex justify-center items-center h-full">
              <div
                ref={canvasRef}
                className="relative border-2 border-border-primary bg-white"
                style={{
                  width: '400px',
                  height: `${(labelHeight / labelWidth) * 400}px`,
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => {
                  if (e.target === canvasRef.current) {
                    setSelectedElement(null);
                  }
                }}
              >
                {backgroundImage && (
                  <img
                    src={backgroundImage}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
                {/* Grid overlay */}
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${labelHeight * previewScale - 1}px, rgba(0,0,0,0.1) ${labelHeight * previewScale - 1}px, rgba(0,0,0,0.1) ${labelHeight * previewScale}px),
                                   repeating-linear-gradient(90deg, transparent, transparent ${labelWidth * previewScale - 1}px, rgba(0,0,0,0.1) ${labelWidth * previewScale - 1}px, rgba(0,0,0,0.1) ${labelWidth * previewScale}px)`,
                }} />
                
                {/* Render elements */}
                {elements.filter(el => el.visible).map(element => (
                  <div
                    key={element.id}
                    className={`absolute border-2 cursor-move ${
                      selectedElement === element.id
                        ? 'border-accent-blue bg-accent-blue/10'
                        : 'border-border-primary bg-white/80'
                    }`}
                    style={{
                      left: `${element.position.x * previewScale}px`,
                      top: `${element.position.y * previewScale}px`,
                      width: `${element.size.width * previewScale}px`,
                      height: `${element.size.height * previewScale}px`,
                      fontSize: `${element.style.fontSize * previewScale}px`,
                      fontWeight: element.style.fontWeight,
                      color: element.style.color,
                      backgroundColor: element.style.backgroundColor,
                      padding: `${element.style.padding * previewScale}px`,
                      zIndex: selectedElement === element.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                  >
                    <div className="w-full h-full flex items-center justify-center text-center text-xs">
                      {FIELD_TYPES.find(f => f.value === element.type)?.label || element.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-text-muted">
              Preview: {labelWidth.toFixed(1)}mm × {labelHeight.toFixed(1)}mm per label
            </div>
          </div>

          {/* Right Panel - Element Properties */}
          <div className="w-80 border-l border-border-primary bg-primary overflow-y-auto p-4">
            {selectedElementData ? (
              <div>
                <h3 className="font-bold mb-4">Element Properties</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Type
                    </label>
                    <div className="text-sm">{FIELD_TYPES.find(f => f.value === selectedElementData.type)?.label}</div>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Visible
                    </label>
                    <input
                      type="checkbox"
                      checked={selectedElementData.visible}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'visible', e.target.checked)}
                      className="cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Position (mm)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-text-muted">X</label>
                        <input
                          type="number"
                          value={selectedElementData.position.x.toFixed(1)}
                          onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'position', { x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Y</label>
                        <input
                          type="number"
                          value={selectedElementData.position.y.toFixed(1)}
                          onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'position', { y: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Size (mm)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-text-muted">Width</label>
                        <input
                          type="number"
                          value={selectedElementData.size.width.toFixed(1)}
                          onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'size', { width: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                          step="0.1"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Height</label>
                        <input
                          type="number"
                          value={selectedElementData.size.height.toFixed(1)}
                          onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'size', { height: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                          step="0.1"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Font Size (px)
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.style.fontSize}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'style', { fontSize: parseInt(e.target.value) || 12 })}
                      className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                      min="6"
                      max="72"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Font Weight
                    </label>
                    <select
                      value={selectedElementData.style.fontWeight}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'style', { fontWeight: e.target.value as any })}
                      className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="600">Semi-bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={selectedElementData.style.color}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'style', { color: e.target.value })}
                      className="w-full h-10 bg-secondary border border-border-primary rounded-sm cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={selectedElementData.style.backgroundColor}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'style', { backgroundColor: e.target.value })}
                      className="w-full h-10 bg-secondary border border-border-primary rounded-sm cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1 block">
                      Padding (mm)
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.style.padding}
                      onChange={(e) => handleElementPropertyChange(selectedElementData.id, 'style', { padding: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-secondary border border-border-primary p-1.5 text-sm focus:border-accent-blue focus:outline-none rounded-sm"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-text-muted text-sm mt-8">
                Select an element to edit its properties
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border-primary bg-tertiary">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border-primary hover:bg-primary rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-sm flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
}

