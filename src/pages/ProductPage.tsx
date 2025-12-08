
import { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import type { FormField } from '../components/Form';
import { Product, Variant, type IProduct, type IVariant } from '../types/models';
import { getProducts, createProduct, deleteProduct, updateProduct } from '../models/product';
import { createVariant, deleteVariant, getVariants, updateVariant } from '../models/variants';
import Modal from '../components/Modal';
import { ConfirmModal, type ModalData } from '../components/ConfirmModal';
import { formatOptions } from '../utils';
import Loader from '../components/Loader';

const ProductPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [confirmModalData, setConfirmModalData] = useState<ModalData | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (editProduct != null && !showModal) setShowModal(true);
    }, [editProduct]);

    useEffect(() => {
        if (!showModal) setEditProduct(null);
    }, [showModal]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts.map(p => new Product(p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Product },
        { header: 'Name', accessor: 'name' as keyof Product },
        { header: 'Category', accessor: 'category' as keyof Product },
        { header: 'Type', accessor: 'type' as keyof Product },
        { header: 'Unit*', accessor: 'baseUnit' as keyof Product },
        { header: 'Selling Price*', accessor: 'defaultSellingPrice' as keyof Product },
        { header: 'Profit Margin*', accessor: (row: Product) => row.baseProfitMargin },
        {
            header: 'Varients',
            accessor: (row: Product) => (
                <button
                    onClick={() => handleViewVarient(row.id)}
                    className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-600"
                >
                    View
                </button>
            )
        },
        {
            header: 'Actions',
            accessor: (row: Product) => (
                <div className='flex gap-2'>
                    <button
                        onClick={() => setEditProduct(row)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-200 dark:hover:text-blue-600"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDeleteInitiated(row.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-200 dark:hover:text-red-600"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    const productFormFields: FormField<Product>[] = [
        { name: 'name', label: 'Product Name', required: true, type: 'text' },
        { name: 'category', label: 'Category', required: true, type: 'select', options: formatOptions(['Electronics', 'Furniture', 'Kitchenware', 'Stationery']) },
        { name: 'description', label: 'Description', required: true, type: 'text' },
        { name: 'type', label: 'Type', type: 'select', required: true, options: formatOptions(['simple', 'measured', 'variant']) },
        { name: 'hasVariants', label: 'Has Variants', type: 'radio', required: true, options: [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }] },
        { name: 'barcode', label: 'Barcode', required: false, type: 'text' },
        { name: 'baseUnit', label: 'Base Unit', required: true, type: 'text' },
        { name: 'defaultCostPrice', label: 'Default Cost Price', required: true, type: 'number' },
        { name: 'defaultSellingPrice', label: 'Default Selling Price', required: true, type: 'number' }
    ];

    const handleAddProduct = async (formData: Partial<IProduct>) => {
        try {
            setError(null);
            setLoading(true);
            const productData = {
                name: formData.name || '',
                category: formData.category || '',
                description: formData.description,
                type: formData.type || 'simple',
                hasVariants: formData.hasVariants || false,
                barcode: formData.barcode,
                baseUnit: formData.baseUnit,
                defaultCostPrice: formData.defaultCostPrice || 0,
                defaultSellingPrice: formData.defaultSellingPrice || 0
            };

            await createProduct(productData);
            await loadProducts(); // Refresh the list
            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleUpdateProduct = async (formData: Partial<IProduct>) => {
        try {
            setError(null);
            setLoading(true);
            const productData = {
                id: formData.id || '',
                name: formData.name || '',
                category: formData.category || '',
                description: formData.description,
                type: formData.type || 'simple',
                hasVariants: formData.hasVariants || false,
                barcode: formData.barcode,
                baseUnit: formData.baseUnit,
                defaultCostPrice: formData.defaultCostPrice || 0,
                defaultSellingPrice: formData.defaultSellingPrice || 0,
                createdAt: formData.createdAt,
                updatedAt: new Date().toISOString()
            };

            await updateProduct(productData);
            await loadProducts(); // Refresh the list
            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleDeleteInitiated = (id: string) => {
        setConfirmModalData({
            title: 'Confirm Action',
            body: 'Do you want to delete this Product',
            onSuccess: () => handleDeleteProduct(id)
        })
    }

    const handleDeleteProduct = async (id: string) => {
        try {
            setError(null);
            setLoading(true);
            setConfirmModalData(null);
            await deleteProduct(id);
            await loadProducts(); // Refresh the list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    const handleViewVarient = async (id: string) => {
        try {
            setError(null);
            setSelectedProduct(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    return (
        <>
            <Loader loading={loading} />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Product</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 text-sm font-medium text-white 
                                bg-blue-500 hover:bg-blue-600 
                                dark:bg-blue-600 dark:hover:bg-blue-700 
                                rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Product
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {loading ? <></> : (
                    <Table
                        columns={columns}
                        data={products}
                    />
                )}

                <Modal show={showModal} size='xl' onClose={() => setShowModal(false)} title='Add New Product'>
                    <Form<Product>
                        fields={productFormFields}
                        onSubmit={editProduct ? handleUpdateProduct : handleAddProduct}
                        onClose={() => setShowModal(false)}
                        initialData={editProduct ? editProduct : new Product({
                            id: '',
                            name: '',
                            category: '',
                            description: '',
                            type: 'simple',
                            hasVariants: false,
                            barcode: '',
                            baseUnit: '',
                            defaultCostPrice: 0,
                            defaultSellingPrice: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })}
                    />
                </Modal>

                <Modal show={selectedProduct != null} size='xl' onClose={() => setSelectedProduct(null)} title='Variants'>
                    <VariantsPage product_id={selectedProduct || ''} />
                </Modal>
                <ConfirmModal
                    show={confirmModalData != null}
                    size='sm'
                    onClose={() => setConfirmModalData(null)}
                    title={confirmModalData?.title || ""}
                    body={confirmModalData?.body || ""}
                    onSuccess={confirmModalData?.onSuccess}
                />
            </div>
        </>
    );
};

const VariantsPage = ({ product_id }: { product_id: string }) => {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [editVariant, setEditVariant] = useState<Variant | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadVariants();
    }, []);

    useEffect(() => {
        if (editVariant != null && !showForm) setShowForm(true);
    }, [editVariant]);

    useEffect(() => {
        if (!showForm) setEditVariant(null);
    }, [showForm]);

    const loadVariants = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedVariants = await getVariants({ 'productId': product_id });
            setVariants(fetchedVariants.map(p => new Variant(p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Variant },
        // { header: 'Product ID', accessor: 'productId' as keyof Variant },
        { header: 'SKU', accessor: 'sku' as keyof Variant },
        {
            header: 'Attributes', accessor: (row: Variant) => <div className='flex gap-1 wrap'>{
                Object.entries(row.attributes)?.map(_variant => {
                    return <div className='rounded-full bg-blue-400 dark:bg-blue-200 w-fit py-1 px-2 text-white dark:text-black uppercase font-bold'>{_variant[1]}</div>
                })}</div>
        },
        { header: 'Cost Price', accessor: 'costPrice' as keyof Variant },
        { header: 'Selling Price', accessor: 'sellingPrice' as keyof Variant },
        {
            header: 'Actions',
            accessor: (row: Variant) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => setEditVariant(row)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-200 dark:hover:text-blue-600"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDeleteVariant(row.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-200 dark:hover:text-red-600"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    const variantFormFields: FormField<Variant>[] = [
        { name: 'sku', label: 'SKU', required: true, type: 'text' },
        { name: 'attributes', label: 'Attributes', required: true, type: 'json' },
        { name: 'costPrice', label: 'Cost Price', required: true, type: 'number' },
        { name: 'sellingPrice', label: 'Selling Price', required: true, type: 'number' },
    ];

    const handleAddProduct = async (formData: Partial<IVariant>) => {
        try {
            setError(null);
            setLoading(true);
            const variantData = {
                productId: product_id,
                sku: formData.sku,
                attributes: formData.attributes || {},
                costPrice: formData.costPrice,
                sellingPrice: formData.sellingPrice,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await createVariant(variantData);
            await loadVariants(); // Refresh the list
            setShowForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleUpdateProduct = async (formData: Partial<IVariant>) => {
        try {
            setError(null);
            setLoading(true);
            const variantData = {
                id: formData.id || '',
                productId: product_id,
                sku: formData.sku,
                attributes: formData.attributes || {},
                costPrice: formData.costPrice,
                sellingPrice: formData.sellingPrice,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await updateVariant(variantData);
            await loadVariants(); // Refresh the list
            setShowForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleDeleteVariant = async (id: string) => {
        try {
            setError(null);
            setLoading(true);
            await deleteVariant(id);
            await loadVariants(); // Refresh the list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    return (
        <div className="container mx-auto p-4">
            {showForm ? (
                <>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Add New Variant</h3>
                    <div className="mt-2 px-7 py-3">
                        <Form<Variant>
                            fields={variantFormFields}
                            onSubmit={editVariant ? handleUpdateProduct : handleAddProduct}
                            onClose={() => setShowForm(false)}
                            initialData={editVariant ? editVariant : new Variant({
                                id: '',
                                productId: product_id,
                                sku: '',
                                attributes: {},
                                costPrice: 0,
                                sellingPrice: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            })}
                        />
                    </div>
                </>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold"></h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 text-sm font-medium text-white 
                                bg-blue-500 hover:bg-blue-600 
                                dark:bg-blue-600 dark:hover:bg-blue-700 
                                rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Variant
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={variants}
                        />
                    )} */}
                    <Loader loading={loading} />
                    <Table
                        columns={columns}
                        data={variants}
                    />
                </div>
            )}
        </div>
    );
}

export default ProductPage;
