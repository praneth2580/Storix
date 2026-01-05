import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, X, Save, Upload, ChevronRight, ChevronDown, ChevronUp, Eye, Printer, TrendingUp, Package, DollarSign, BarChart3, ScanBarcode } from 'lucide-react';
import { Loader } from '../components/Loader';
import { Html5Qrcode } from 'html5-qrcode';
// Types

import { useAppSelector, useDataPolling, useAppDispatch } from '../store/hooks';
import { ImageInput } from '../components/ImageInput';
import { fetchProducts, InventoryProduct } from '../store/slices/inventorySlice';
import { fetchSuppliers } from '../store/slices/suppliersSlice';
import { fetchSales } from '../store/slices/salesSlice';
import { IProduct, IVariant, ISale } from '../types/models';
import { createProduct, updateProduct } from '../models/product';
import { createVariant, updateVariant } from '../models/variants';
import { fetchLabelLayouts } from '../store/slices/settingsSlice';
import { LabelLayout } from '../types/labelLayout';
import { generateLabelsPageHTML } from '../utils/labelRenderer';

export function Products() {
  useDataPolling(fetchProducts, 30000);
  useDataPolling(fetchSuppliers, 60000);
  useDataPolling(fetchSales, 30000);
  const { items: products, loading } = useAppSelector(state => state.inventory);
  const { items: suppliers } = useAppSelector(state => state.suppliers);
  const { items: sales } = useAppSelector(state => state.sales);
  const dispatch = useAppDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<InventoryProduct | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [editingVariant, setEditingVariant] = useState<IVariant | null>(null);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanContainerRef = useRef<HTMLDivElement>(null);

  // Product Form State
  const [productFormData, setProductFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    type: 'simple' as 'simple' | 'measured' | 'variant',
    barcode: '',
    description: '',
    baseUnit: '',
    minStockLevel: '',
    supplierId: '',
    notes: '',
    status: 'active',
    imageUrl: ''
  });

  // Variant Form State
  const [variantFormData, setVariantFormData] = useState({
    sku: '',
    cost: '',
    price: '',
    stock: '',
    lowStock: '',
    attributes: '' // JSON string for attributes
  });

  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });
  // Product Modal handlers
  const handleOpenModal = (product?: InventoryProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category,
        type: product.type || 'simple',
        barcode: product.barcode || '',
        description: product.description || '',
        baseUnit: product.baseUnit || '',
        minStockLevel: product.minStockLevel?.toString() || '',
        supplierId: product.supplierId || '',
        notes: product.notes || '',
        status: product.status || 'active',
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: '',
        sku: '',
        category: 'Electronics',
        type: 'simple',
        barcode: '',
        description: '',
        baseUnit: '',
        minStockLevel: '',
        supplierId: '',
        notes: '',
        status: 'active',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    try {
      const productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> = {
        name: productFormData.name,
        category: productFormData.category,
        type: productFormData.type,
        sku: productFormData.sku || undefined,
        barcode: productFormData.barcode || undefined,
        description: productFormData.description || undefined,
        baseUnit: productFormData.baseUnit || undefined,
        minStockLevel: productFormData.minStockLevel ? Number(productFormData.minStockLevel) : undefined,
        supplierId: productFormData.supplierId || undefined,
        notes: productFormData.notes || undefined,
        status: productFormData.status,
        imageUrl: productFormData.imageUrl || undefined
      };

      if (editingProduct) {
        await updateProduct({ ...productData, id: editingProduct.id });
        alert("Product updated successfully");
      } else {
        await createProduct(productData);
        alert("Product created successfully");
      }

      setIsModalOpen(false);
      dispatch(fetchProducts());
    } catch (e) {
      console.error(e);
      alert("Failed to save product");
    }
  };

  // Variant Modal handlers
  const handleOpenVariantModal = (productId?: string, variant?: IVariant) => {
    if (variant) {
      setEditingVariant(variant);
      setSelectedProductForVariant(variant.productId);
      setVariantFormData({
        sku: variant.sku || '',
        cost: typeof variant.cost === 'number' ? variant.cost.toString() : '',
        price: typeof variant.price === 'number' ? variant.price.toString() : '',
        stock: variant.stock?.toString() || '',
        lowStock: variant.lowStock?.toString() || '',
        attributes: typeof variant.attributes === 'string'
          ? variant.attributes
          : JSON.stringify(variant.attributes || {})
      });
    } else {
      setEditingVariant(null);
      setSelectedProductForVariant(productId || '');
      setVariantFormData({
        sku: '',
        cost: '',
        price: '',
        stock: '',
        lowStock: '',
        attributes: '{}'
      });
    }
    setIsVariantModalOpen(true);
  };

  const handleCloseVariantModal = () => {
    setIsVariantModalOpen(false);
    setEditingVariant(null);
    setSelectedProductForVariant('');
  };

  const handleSaveVariant = async () => {
    try {
      if (!selectedProductForVariant) {
        alert("Please select a product");
        return;
      }

      let attributes: Record<string, string> = {};
      try {
        attributes = variantFormData.attributes ? JSON.parse(variantFormData.attributes) : {};
      } catch (e) {
        alert("Invalid JSON format for attributes. Please use format: {\"key\": \"value\"}");
        return;
      }

      const variantData: Omit<IVariant, 'id' | 'createdAt' | 'updatedAt'> = {
        productId: selectedProductForVariant,
        sku: variantFormData.sku || undefined,
        attributes: attributes,
        cost: Number(variantFormData.cost) || 0,
        price: Number(variantFormData.price) || 0,
        stock: variantFormData.stock ? Number(variantFormData.stock) : undefined,
        lowStock: variantFormData.lowStock ? Number(variantFormData.lowStock) : undefined
      };

      if (editingVariant) {
        await updateVariant({ ...variantData, id: editingVariant.id });
        alert("Variant updated successfully");
      } else {
        await createVariant(variantData);
        alert("Variant created successfully");
      }

      setIsVariantModalOpen(false);
      dispatch(fetchProducts());
    } catch (e) {
      console.error(e);
      alert("Failed to save variant");
    }
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // setProducts(products.filter(p => p.id !== id)); // Redux state is immutable directly
      console.log("Delete product", id);
      alert("Delete not implemented in Redux yet");
    }
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const formatAttributes = (attributes: Record<string, string> | string): string => {
    if (typeof attributes === 'string') {
      try {
        const parsed = JSON.parse(attributes);
        return Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join(', ');
      } catch {
        return attributes;
      }
    }
    return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
  };

  // Barcode Scanner Logic for Products Page
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    // Set search to barcode to filter products
    setSearch(barcode);
    // Stop scanner after successful scan
    stopScanner();

    // Find and highlight the product if found
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      // Expand the product if it's in the list
      setExpandedProducts(prev => new Set(prev).add(product.id));
      // Scroll to product after a brief delay
      setTimeout(() => {
        const element = document.getElementById(`product-${product.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-accent-blue');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-accent-blue');
          }, 2000);
        }
      }, 100);
    } else {
      alert(`Product with barcode "${barcode}" not found.`);
    }
  }, [products, stopScanner]);

  const startScanner = useCallback(async () => {
    if (!scanContainerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode("product-barcode-scanner");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback - barcode/QR detected
          handleBarcodeScanned(decodedText);
        },
        (errorMessage) => {
          // Error callback - ignore, scanner will keep trying
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('Failed to start camera. Please ensure camera permissions are granted.');
    }
  }, [handleBarcodeScanned]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [stopScanner]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScanning) {
        stopScanner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanning, stopScanner]);

  return <div className="flex flex-col h-full bg-primary text-text-primary">
    {/* Barcode Scanner Modal */}
    {isScanning && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary">Scan Barcode/QR Code</h3>
            <button
              onClick={stopScanner}
              className="text-text-muted hover:text-accent-red transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div
            id="product-barcode-scanner"
            ref={scanContainerRef}
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: '300px' }}
          />
          <p className="text-sm text-text-muted mt-4 text-center">
            Point camera at barcode or QR code. Press ESC to cancel.
          </p>
        </div>
      </div>
    )}

    {/* Header / Toolbar */}
    <div className="border-b border-border-primary bg-secondary">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className="p-2 hover:bg-primary rounded transition-colors block md:hidden text-text-muted hover:text-accent-blue"
            title={isHeaderExpanded ? 'Collapse header' : 'Expand header'}
          >
            {isHeaderExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div>
            <h1 className="text-xl font-bold">Product Management</h1>
            {!isHeaderExpanded && (
              <p className="text-text-muted text-xs font-mono mt-0.5">
                Manage catalog, pricing, and specifications
              </p>
            )}
          </div>
        </div>
        {!isHeaderExpanded && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus size={16} />
            Add <span className="hidden md:inline">New Product</span>
          </button>
        )}
      </div>

      {isHeaderExpanded && (
        <div className="px-4 pb-6 pt-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Product Management</h1>
              <p className="text-text-muted text-sm font-mono">
                Manage catalog, pricing, and specifications
              </p>
            </div>
            <button onClick={() => handleOpenModal()} className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
              <Plus size={16} />
              Add New Product
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Scan barcode or search by SKU/Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-primary border border-border-primary text-text-primary text-sm py-2 pl-9 pr-10 focus:outline-none focus:border-accent-blue placeholder-text-muted rounded-sm"
              />
              <button
                onClick={() => isScanning ? stopScanner() : startScanner()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${isScanning ? 'text-accent-red hover:text-red-600' : 'text-text-muted hover:text-accent-blue'}`}
                title={isScanning ? 'Stop Scanner' : 'Start Barcode Scanner'}
              >
                <ScanBarcode size={16} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {['All', 'Electronics', 'Furniture', 'Accessories'].map(cat => <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-2 text-xs font-medium border rounded-sm whitespace-nowrap ${filter === cat ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-primary border-border-primary text-text-muted hover:border-border-secondary'} transition-colors`}>
                {cat}
              </button>)}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Table Content */}
    <div className="flex-1 overflow-auto p-6">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader message="Loading products..." />
        </div>
      ) : (
        <div className="border border-border-primary bg-secondary rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-tertiary text-text-muted text-[10px] uppercase font-mono tracking-wider">
                <tr>
                  <th className="p-3 border-b border-border-primary w-12 text-center"></th>
                  <th className="p-3 border-b border-border-primary w-16 text-center">
                    Img
                  </th>
                  <th className="p-3 border-b border-border-primary hidden md:table-cell">Barcode</th>
                  <th className="p-3 border-b border-border-primary">
                    Product Name
                  </th>
                  <th className="p-3 border-b border-border-primary hidden sm:table-cell">Category</th>
                  <th className="p-3 border-b border-border-primary text-right">
                    Price
                  </th>
                  <th className="p-3 border-b border-border-primary text-right">
                    Stock
                  </th>
                  <th className="p-3 border-b border-border-primary text-center hidden lg:table-cell">
                    Status
                  </th>
                  <th className="p-3 border-b border-border-primary text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-text-muted">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const isExpanded = expandedProducts.has(product.id);
                    const hasVariants = product.variants && product.variants.length > 0;

                    return (
                      <React.Fragment key={product.id}>
                        <tr id={`product-${product.id}`} className="hover:bg-tertiary transition-colors group">
                          <td className="p-3 text-center">
                            {hasVariants ? (
                              <button
                                onClick={() => toggleProductExpansion(product.id)}
                                className="p-1 hover:bg-primary rounded transition-colors text-text-muted hover:text-accent-blue"
                                title={isExpanded ? 'Collapse variants' : 'Expand variants'}
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            ) : (
                              <div className="w-6 h-6"></div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="w-8 h-8 bg-primary border border-border-primary rounded flex items-center justify-center mx-auto text-text-muted">
                              <ImageIcon size={14} />
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs text-accent-blue hidden md:table-cell">
                            {product.barcode || 'N/A'}
                          </td>
                          <td className="p-3 text-sm font-medium text-text-primary">
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="md:hidden text-xs text-text-muted font-mono mt-1">
                                {product.barcode || 'N/A'}
                              </span>
                            </div>
                            {hasVariants && (
                              <span className="ml-2 text-xs text-text-muted font-normal">
                                ({product.variants.length} variant{product.variants.length !== 1 ? 's' : ''})
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-text-muted hidden sm:table-cell">
                            {product.category}
                          </td>
                          <td className="p-3 text-right font-mono text-sm">
                            ${(typeof product.variants[0]?.price === 'number' ? product.variants[0].price : 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono text-sm">
                            <span className={`text-text-primary ${(product.totalStock || 0) < (product.minStockLevel || 10) ? 'text-accent-red font-bold' : ''}`}>
                              {product.totalStock || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center hidden lg:table-cell">
                            <span className="text-[10px] px-2 py-0.5 rounded border bg-accent-green/10 text-accent-green border-accent-green/20">
                              ACTIVE
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedProductDetail(product)}
                                className="p-1 hover:text-accent-blue transition-colors"
                                title="View Product Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenVariantModal(product.id)}
                                className="p-1 hover:text-accent-green transition-colors"
                                title="Add Variant"
                              >
                                <Plus size={14} />
                              </button>
                              <button onClick={() => handleOpenModal(product)} className="p-1 hover:text-accent-blue transition-colors" title="Edit Product">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDelete(product.id)} className="p-1 hover:text-accent-red transition-colors" title="Delete Product">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Variants Subtable */}
                        {isExpanded && hasVariants && (
                          <tr>
                            <td colSpan={10} className="p-0 bg-primary/50">
                              <div className="p-4 pl-6">
                                <div className="border border-border-primary bg-secondary rounded-lg overflow-hidden">
                                  <div className="bg-tertiary px-4 py-2 border-b border-border-primary">
                                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                      Variants ({product.variants.length})
                                    </h4>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                      <thead className="bg-primary text-text-muted text-[10px] uppercase font-mono tracking-wider">
                                        <tr>
                                          <th className="p-2 border-b border-border-primary">SKU</th>
                                          <th className="p-2 border-b border-border-primary">Attributes</th>
                                          <th className="p-2 border-b border-border-primary text-right">Cost</th>
                                          <th className="p-2 border-b border-border-primary text-right">Price</th>
                                          <th className="p-2 border-b border-border-primary text-right">Stock</th>
                                          <th className="p-2 border-b border-border-primary text-right">Margin</th>
                                          <th className="p-2 border-b border-border-primary text-center">
                                            <button
                                              onClick={() => handleOpenVariantModal(product.id)}
                                              className="p-1 hover:bg-primary rounded transition-colors text-text-muted hover:text-accent-blue"
                                              title="Add variant"
                                            >
                                              <Plus size={14} />
                                            </button>
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border-primary">
                                        {product.variants.map((variant) => {
                                          const cost = typeof variant.cost === 'number' ? variant.cost : 0;
                                          const price = typeof variant.price === 'number' ? variant.price : 0;
                                          const margin = price - cost;
                                          const marginPercent = price > 0 ? ((margin / price) * 100).toFixed(1) : '0';

                                          return (
                                            <tr key={variant.id} className="hover:bg-tertiary transition-colors group/variant">
                                              <td className="p-2 font-mono text-xs text-accent-blue">
                                                {variant.sku || 'N/A'}
                                              </td>
                                              <td className="p-2 text-xs text-text-muted">
                                                {variant.attributes && Object.keys(variant.attributes).length > 0
                                                  ? formatAttributes(variant.attributes)
                                                  : <span className="text-text-muted italic">No attributes</span>
                                                }
                                              </td>
                                              <td className="p-2 text-right font-mono text-xs text-text-primary">
                                                ${cost.toFixed(2)}
                                              </td>
                                              <td className="p-2 text-right font-mono text-xs text-text-primary font-semibold">
                                                ${price.toFixed(2)}
                                              </td>
                                              <td className="p-2 text-right font-mono text-xs">
                                                <span className={`${(variant.stock || 0) < (variant.lowStock || 0) ? 'text-accent-red font-bold' : 'text-text-primary'}`}>
                                                  {variant.stock || 0}
                                                </span>
                                              </td>
                                              <td className="p-2 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                  <span className="font-mono text-xs">
                                                    <span className={`${margin >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                                      ${margin.toFixed(2)} ({marginPercent}%)
                                                    </span>
                                                  </span>
                                                  <div className="opacity-0 group-hover/variant:opacity-100 transition-opacity">
                                                    <button
                                                      onClick={() => handleOpenVariantModal(product.id, variant)}
                                                      className="p-1 hover:text-accent-blue transition-colors"
                                                      title="Edit variant"
                                                    >
                                                      <Edit size={12} />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="p-2"></td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Modal */}
    {isModalOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary border border-border-primary w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {editingProduct ? <Edit size={18} className="text-accent-blue" /> : <Plus size={18} className="text-accent-blue" />}
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={handleCloseModal} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Image Upload Placeholder */}
          {/* <div className="col-span-1 md:col-span-2 flex justify-center">
            <div className="w-full h-32 border-2 border-dashed border-border-primary hover:border-accent-blue/50 rounded flex flex-col items-center justify-center text-text-muted cursor-pointer transition-colors bg-primary">
              <Upload size={24} className="mb-2" />
              <span className="text-xs">
                Drag & drop product image or click to upload
              </span>
            </div>
          </div> */}

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Product Name *
            </label>
            <input
              type="text"
              value={productFormData.name}
              onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="e.g. Quantum Processor"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Category *
            </label>
            <select
              value={productFormData.category}
              onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              required
            >
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Accessories</option>
              <option>Storage</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Product Type *
            </label>
            <select
              value={productFormData.type}
              onChange={e => setProductFormData({ ...productFormData, type: e.target.value as 'simple' | 'measured' | 'variant' })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              required
            >
              <option value="simple">Simple</option>
              <option value="measured">Measured</option>
              <option value="variant">Variant</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Base Unit
            </label>
            <input
              type="text"
              value={productFormData.baseUnit}
              onChange={e => setProductFormData({ ...productFormData, baseUnit: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="e.g. kg, L, g (for measured products)"
              disabled={productFormData.type !== 'measured'}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              SKU
            </label>
            <input
              type="text"
              value={productFormData.sku}
              onChange={e => setProductFormData({ ...productFormData, sku: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="e.g. ELEC-001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Barcode
            </label>
            <input
              type="text"
              value={productFormData.barcode}
              onChange={e => setProductFormData({ ...productFormData, barcode: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="e.g. 1234567890123"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Supplier
            </label>
            <select
              value={productFormData.supplierId}
              onChange={e => setProductFormData({ ...productFormData, supplierId: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Min Stock Level
            </label>
            <input
              type="number"
              value={productFormData.minStockLevel}
              onChange={e => setProductFormData({ ...productFormData, minStockLevel: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Status
            </label>
            <select
              value={productFormData.status}
              onChange={e => setProductFormData({ ...productFormData, status: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2">
            <ImageInput
              value={productFormData.imageUrl && productFormData.imageUrl.startsWith('data:') ? productFormData.imageUrl : null}
              onChange={(imageData) => {
                // Store base64 image data
                setProductFormData({ ...productFormData, imageUrl: imageData || '' });
              }}
              label="Product Image"
              description="Upload a product image or enter an image URL"
              showPreview={true}
              previewSize="lg"
              allowUrlInput={true}
              urlValue={productFormData.imageUrl && !productFormData.imageUrl.startsWith('data:') ? productFormData.imageUrl : ''}
              onUrlChange={(url) => {
                setProductFormData({ ...productFormData, imageUrl: url });
              }}
            />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Description
            </label>
            <textarea
              value={productFormData.description}
              onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="Product description..."
              rows={3}
            />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Notes
            </label>
            <textarea
              value={productFormData.notes}
              onChange={e => setProductFormData({ ...productFormData, notes: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3 bg-tertiary">
          <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSaveProduct} className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <Save size={16} />
            Save Product
          </button>
        </div>
      </div>
    </div>}

    {/* Variant Modal */}
    {isVariantModalOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary border border-border-primary w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {editingVariant ? <Edit size={18} className="text-accent-blue" /> : <Plus size={18} className="text-accent-blue" />}
            {editingVariant ? 'Edit Variant' : 'Add New Variant'}
          </h2>
          <button onClick={handleCloseVariantModal} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Product *
            </label>
            <select
              value={selectedProductForVariant}
              onChange={e => setSelectedProductForVariant(e.target.value)}
              disabled={!!editingVariant}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              SKU
            </label>
            <input
              type="text"
              value={variantFormData.sku}
              onChange={e => setVariantFormData({ ...variantFormData, sku: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="e.g. VAR-001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Cost Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={variantFormData.cost}
              onChange={e => setVariantFormData({ ...variantFormData, cost: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={variantFormData.price}
              onChange={e => setVariantFormData({ ...variantFormData, price: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Stock
            </label>
            <input
              type="number"
              value={variantFormData.stock}
              onChange={e => setVariantFormData({ ...variantFormData, stock: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Low Stock Alert
            </label>
            <input
              type="number"
              value={variantFormData.lowStock}
              onChange={e => setVariantFormData({ ...variantFormData, lowStock: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder="0"
            />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Attributes (JSON)
            </label>
            <textarea
              value={variantFormData.attributes}
              onChange={e => setVariantFormData({ ...variantFormData, attributes: e.target.value })}
              className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm"
              placeholder='{"size": "Large", "color": "Red"}'
              rows={4}
            />
            <p className="text-xs text-text-muted mt-1">
              Enter attributes as JSON object. Example: {"{"}"size": "Large", "color": "Red"{"}"}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3 bg-tertiary">
          <button onClick={handleCloseVariantModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSaveVariant} className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <Save size={16} />
            Save Variant
          </button>
        </div>
      </div>
    </div>}

    {/* Product Detail View Modal */}
    {selectedProductDetail && (
      <ProductDetailView
        product={selectedProductDetail}
        sales={sales}
        onClose={() => setSelectedProductDetail(null)}
      />
    )}
  </div>;
}

// Product Detail View Component
function ProductDetailView({
  product,
  sales,
  onClose
}: {
  product: InventoryProduct;
  sales: ISale[];
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Get label layouts from Redux store
  const labelLayouts = useAppSelector(state => state.settings.labelLayouts);

  // Calculate analytics
  const productSales = sales.filter(s =>
    product.variants.some(v => v.id === s.variantId)
  );

  const totalSales = productSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalQuantitySold = productSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const averagePrice = productSales.length > 0
    ? totalSales / totalQuantitySold
    : product.variants[0]?.price || 0;

  const totalStock = product.totalStock || 0;
  const totalValue = totalStock * (product.variants[0]?.price || 0);

  // Fetch label layouts when component mounts
  useEffect(() => {
    console.log('ProductDetailView: Fetching label layouts...');
    dispatch(fetchLabelLayouts());
  }, [dispatch]);

  // Set default layout when layouts are loaded
  useEffect(() => {
    console.log('ProductDetailView: labelLayouts changed:', {
      count: labelLayouts.length,
      layouts: labelLayouts.map(l => ({ id: l.id, name: l.name }))
    });
    if (labelLayouts.length > 0 && !selectedLayoutId) {
      console.log('ProductDetailView: Setting default layout:', labelLayouts[0].id);
      setSelectedLayoutId(labelLayouts[0].id);
    }
  }, [labelLayouts, selectedLayoutId]);

  const formatAttributes = (attributes: Record<string, string> | string): string => {
    if (typeof attributes === 'string') {
      try {
        const parsed = JSON.parse(attributes);
        return Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join(', ');
      } catch {
        return attributes;
      }
    }
    return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
  };

  const handleToggleVariantSelection = (variantId: string) => {
    setSelectedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  };

  const handleSelectAllVariants = () => {
    if (selectedVariants.size === product.variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(product.variants.map(v => v.id)));
    }
  };

  const handlePrintLabel = () => {
    if (selectedVariants.size === 0) {
      alert('Please select at least one variant to print labels');
      return;
    }

    if (!selectedLayoutId || labelLayouts.length === 0) {
      alert('Please create a label layout in Settings first');
      return;
    }

    const selectedLayout = labelLayouts.find(l => l.id === selectedLayoutId);
    if (!selectedLayout) {
      alert('Selected layout not found. Please select a valid layout.');
      return;
    }

    const selectedVariantList = product.variants.filter(v => selectedVariants.has(v.id));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to print label");

    const html = generateLabelsPageHTML(selectedLayout, selectedVariantList, product, formatAttributes, backgroundImage || undefined);

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-secondary border border-border-primary w-full max-w-6xl shadow-2xl rounded-lg overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-primary bg-tertiary">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent-blue/10 text-accent-blue rounded-lg flex items-center justify-center">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <p className="text-sm text-text-muted font-mono">SKU: {product.sku || product.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-2 hover:bg-primary rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Section */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-accent-blue" />
                Analytics
              </h3>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Total Stock</span>
                  <Package size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono">{totalStock}</div>
              </div>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Total Value</span>
                  <DollarSign size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono text-accent-green">${totalValue.toFixed(2)}</div>
              </div>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Units Sold</span>
                  <TrendingUp size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono">{totalQuantitySold}</div>
              </div>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Total Sales</span>
                  <DollarSign size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono text-accent-blue">${totalSales.toFixed(2)}</div>
              </div>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Avg. Price</span>
                  <DollarSign size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono">${averagePrice.toFixed(2)}</div>
              </div>

              <div className="bg-primary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Variants</span>
                  <Package size={16} className="text-text-muted" />
                </div>
                <div className="text-2xl font-bold font-mono">{product.variants.length}</div>
              </div>
            </div>

            {/* Variants Table Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} className="text-accent-blue" />
                  Variants ({product.variants.length})
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-muted">Layout:</label>
                    <select
                      value={selectedLayoutId || ''}
                      onChange={(e) => setSelectedLayoutId(e.target.value)}
                      className="bg-secondary border border-border-primary px-3 py-1.5 rounded-sm text-sm focus:border-accent-blue focus:outline-none"
                    >
                      {labelLayouts.length === 0 ? (
                        <option value="">No layouts available</option>
                      ) : (
                        labelLayouts.map(layout => (
                          <option key={layout.id} value={layout.id}>
                            {layout.name} ({layout.grid.rows}×{layout.grid.cols})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageInput
                      value={backgroundImage}
                      onChange={setBackgroundImage}
                      label="Background Image (Optional)"
                      showPreview={true}
                      previewSize="sm"
                      compact={true}
                      className="mb-0"
                    />
                  </div>
                  {labelLayouts.length === 0 && (
                    <span className="text-xs text-text-muted italic">
                      Create layouts in Settings
                    </span>
                  )}
                  <button
                    onClick={handlePrintLabel}
                    disabled={selectedVariants.size === 0 || !selectedLayoutId || labelLayouts.length === 0}
                    className="bg-accent-blue hover:bg-blue-600 disabled:bg-text-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors"
                    title={selectedVariants.size === 0 ? "Select variants to print labels" : !selectedLayoutId ? "Select a layout" : `Print ${selectedVariants.size} label(s)`}
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">
                      Print Label{selectedVariants.size > 0 ? ` (${selectedVariants.size})` : ''}
                    </span>
                  </button>
                </div>
              </div>

              <div className="border border-border-primary bg-primary rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary text-text-muted text-xs uppercase font-mono tracking-wider">
                      <tr>
                        <th className="p-3 border-b border-border-primary text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedVariants.size === product.variants.length && product.variants.length > 0}
                            onChange={handleSelectAllVariants}
                            className="cursor-pointer"
                            title="Select All"
                          />
                        </th>
                        <th className="p-3 border-b border-border-primary">SKU</th>
                        <th className="p-3 border-b border-border-primary">Attributes</th>
                        <th className="p-3 border-b border-border-primary text-right">Cost</th>
                        <th className="p-3 border-b border-border-primary text-right">Price</th>
                        <th className="p-3 border-b border-border-primary text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {product.variants.map((variant) => {
                        const cost = typeof variant.cost === 'number' ? variant.cost : 0;
                        const price = typeof variant.price === 'number' ? variant.price : 0;

                        return (
                          <tr key={variant.id} className="hover:bg-tertiary transition-colors">
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedVariants.has(variant.id)}
                                onChange={() => handleToggleVariantSelection(variant.id)}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono text-xs text-accent-blue">
                              {variant.sku || 'N/A'}
                            </td>
                            <td className="p-3 text-xs text-text-muted">
                              {variant.attributes && Object.keys(variant.attributes).length > 0
                                ? formatAttributes(variant.attributes)
                                : <span className="text-text-muted italic">No attributes</span>
                              }
                            </td>
                            <td className="p-3 text-right font-mono text-xs text-text-primary">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-mono text-xs text-text-primary font-semibold">
                              ${price.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-mono text-xs">
                              <span className={`${(variant.stock || 0) < (variant.lowStock || 0) ? 'text-accent-red font-bold' : 'text-text-primary'}`}>
                                {variant.stock || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}