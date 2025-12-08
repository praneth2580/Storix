
import { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import type { FormField } from '../components/Form';
import { Product, Stock, Variant, type IStock } from '../types/models';
import { getProducts } from '../models/product';
import { getVariants } from '../models/variants';
import Modal from '../components/Modal';
import { ConfirmModal, type ModalData } from '../components/ConfirmModal';
import { createStock, getStocks } from '../models/stock';
import Loader from '../components/Loader';

const StockPage = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<ModalData | null>(null);

    useEffect(() => {
        loadStocks();
    }, []);

    useEffect(() => {
        if (showModal) loadProducts();
    }, [showModal])

    const loadStocks = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedStocks = await getStocks();
            setStocks(fetchedStocks.map(p => new Stock(p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

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

    const getProductVariants = async (product_id: string) => {
        try {
            setError(null);
            const fetchedVariants = await getVariants({ 'productId': product_id });
            const fetchedVariantClass = fetchedVariants.map(p => new Variant(p))
            return fetchedVariantClass.map(variant => ({ label: Object.values(variant.attributes).join(" - "), value: variant.id }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Stock },
        { header: 'Product Name', accessor: (row: Stock) => row.product?.name
        },
        {
            header: 'Variant', accessor: (row: Stock) => row.variant?.attributes ?
                <div className='flex gap-1 wrap'>{Object.entries(row.variant.attributes)?.map(_variant => { return <div className='rounded-full bg-blue-400 w-fit py-1 px-2 text-white uppercase font-bold'>{_variant[1]}</div> })}</div> :
                ""
        },
        { header: 'Quantity', accessor: 'quantity' as keyof Stock },
        {
            header: 'Actions',
            accessor: (row: Stock) => (
                <button
                    onClick={() => handleDeleteInitiated(row.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-200 dark:hover:text-red-600"
                >
                    Delete
                </button>
            )
        }
    ];

    const stockFormFields: FormField<Stock>[] = [
        { name: 'productId', label: 'Product', required: true, type: 'select', options: products.map(product => ({ value: product.id, label: product.name })) },
        {
            name: 'variantId', label: 'Variant', required: true, type: 'select', dependsOn: 'productId', getOptions: async (category) => {
                const optiondata = await getProductVariants(String(category));
                return optiondata || [];
            }
        },
        { name: 'quantity', label: 'Quantity', required: true, type: 'number' },
    ];

    const handleAddStock = async (formData: Partial<IStock>) => {
        try {
            setError(null);
            setLoading(true);
            const stockData = {
                id: formData.id || '',
                productId: formData.productId || '',
                variantId: formData.variantId || '',
                quantity: formData.quantity || 0,
                updatedAt: new Date().toISOString()
            };

            await createStock(stockData);
            await loadStocks(); // Refresh the list
            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleDeleteInitiated = (id: string) => {
        setConfirmModalData({
            title: 'Confirm Action' + id,
            body: 'Do you want to delete this Product',
            onSuccess: () => { }
        })
    }

    return (
        <>
            <Loader loading={loading}/>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Stock</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 text-sm font-medium text-white 
                                bg-blue-500 hover:bg-blue-600 
                                dark:bg-blue-600 dark:hover:bg-blue-700 
                                rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Stock
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
                        data={stocks}
                    />
                )}

                <Modal show={showModal} size='xl' onClose={() => setShowModal(false)} title='Add New Stock'>
                    <Form<Stock>
                        fields={stockFormFields}
                        onSubmit={handleAddStock}
                        onClose={() => setShowModal(false)}
                        initialData={new Stock({
                            id: '',
                            productId: '',
                            variantId: '',
                            quantity: 0,
                            updatedAt: new Date().toISOString()
                        })}
                    />
                </Modal>

                {/* <Modal show={selectedProduct != null} size='xl' onClose={() => setSelectedProduct(null)} title='Variants'>
                        <VariantsPage product_id={selectedProduct || ''} />
                    </Modal> */}
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

export default StockPage;
