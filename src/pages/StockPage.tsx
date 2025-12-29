
import { useState } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import type { FormField } from '../components/Form';
import { Stock, type IStock } from '../types/models';
import Modal from '../components/Modal';
import { ConfirmModal, type ModalData } from '../components/ConfirmModal';
import Loader from '../components/Loader';
import { useAllProducts, useAllStocks, useSyncStatus } from '../store/hooks';
import { createItem, deleteItem } from '../store/operations';

const StockPage = () => {
    // Redux Data
    const stocks = useAllStocks();
    const products = useAllProducts();
    const { pending, syncing } = useSyncStatus();

    // Local UI State
    const [showModal, setShowModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<ModalData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Derived State
    const loading = syncing && stocks.length === 0; // Only show full loader if initial sync

    const getProductVariants = async (product_id: string) => {
        // Find product in Redux store
        const product = products.find(p => p.id === product_id);
        if (!product || !product.variants) return [];

        return product.variants.map((v: any) => ({
            label: Object.values(v.attributes || {}).join(" - ") || v.sku,
            value: v.id
        }));
    };

    console.log(products, stocks)

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Stock },
        {
            header: 'Product Name', accessor: (row: any) => products.find(p => p.id === row.variant?.productId)?.name
        },
        {
            header: 'Variant', accessor: (row: any) => row.variant?.attributes ?
                <div className='flex gap-1 wrap'>{Object.entries(JSON.parse(row.variant.attributes))?.map(_variant => { return <div className='rounded-full bg-blue-400 w-fit py-1 px-2 text-white uppercase font-bold'>{_variant[1] as string}</div> })}</div> :
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
        // Map products from Redux
        { name: 'productId', label: 'Product', required: true, type: 'select', options: products.map(product => ({ value: product.id, label: product.name })) },
        {
            name: 'variantId', label: 'Variant', required: true, type: 'select', dependsOn: 'productId', getOptions: async (category) => {
                return getProductVariants(String(category));
            }
        },
        { name: 'quantity', label: 'Quantity', required: true, type: 'number' },
    ];

    const handleAddStock = async (formData: Partial<IStock>) => {
        try {
            setError(null);

            // Reconstruct minimal object for creation
            // Note: DB ID generation happens on backend, but we need ID for optimistic update.
            // If backend generates ID, sync engine needs to handle ID replacement or we generate UUID here?
            // "script.js" uses nextId logic if we send empty ID or keeps our ID.
            // Let's generate a temporary ID if one isn't provided, 
            // OR let the store operations/sync engine handle it.
            // For optimistic UI, we usually need an ID.

            const tempId = formData.id || 'temp_' + Date.now();

            const stockData = {
                id: tempId,
                productId: formData.productId || '', // Ensure productId is saved (missing in original?)
                // Original code relied on variant.productId? 
                // Stock model has variantId. Stock join brings product.
                // We should ensure we save whatever schema requires.
                // Schema: Stock: [id, variantId, quantity, unit, batchCode, metadata, location, updatedAt]
                // Wait, Stock schema in script.js does NOT have productId! It relies on variantId.

                variantId: formData.variantId || '',
                // variant object is not needed for DB save, but might be needed for optimistic join if we want to see it immediately?
                // The join logic in operations.ts joins 'variant' from state.data.Variants[stock.variantId].
                // So as long as variantId connects to an existing Variant in store, we are good.

                quantity: formData.quantity ?? 0,
                unit: formData.unit || '',
                batchCode: formData.batchCode || '',
                metadata: formData.metadata || '',
                location: formData.location || '',
                updatedAt: new Date().toISOString(),
            };

            // Note: We might need to handle 'supplierId' if that was part of it? 
            // Original code didn't seem to set supplierId.

            await createItem('Stock', stockData);

            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add stock');
        }
    };

    const handleDeleteInitiated = (id: string) => {
        setConfirmModalData({
            title: 'Delete Stock',
            body: 'Are you sure you want to delete this stock item?',
            onSuccess: () => {
                deleteItem('Stock', id);
                setConfirmModalData(null);
            }
        })
    }

    return (
        <>
            <Loader loading={loading} />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Stock</h1>
                    <div className="flex items-center gap-4">
                        {pending.length > 0 && <span className="text-yellow-600 text-sm">Saving... ({pending.length})</span>}
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
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Table handles data display */}
                <Table
                    columns={columns}
                    data={stocks} // Now passing joined stocks from Redux
                />

                <Modal show={showModal} size='xl' onClose={() => setShowModal(false)} title='Add New Stock'>
                    <Form<Stock>
                        fields={stockFormFields}
                        onSubmit={handleAddStock}
                        onClose={() => setShowModal(false)}
                        initialData={new Stock({
                            id: '',
                            variantId: "",
                            variant: {
                                id: "",
                                productId: "",
                                sku: "",
                                attributes: {},
                                costPrice: 0,
                                sellingPrice: 0,
                                createdAt: "",
                                updatedAt: ""
                            },
                            quantity: 0,
                            unit: "",
                            batchCode: "",
                            metadata: "",
                            location: "",
                            updatedAt: "",
                        } as any)}
                    />
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

export default StockPage;
