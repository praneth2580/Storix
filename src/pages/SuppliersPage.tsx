
import { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import type { FormField } from '../components/Form';
import { Supplier, type ISupplier } from '../types/models';
import { createSupplier, deleteSupplier, getSuppliers } from '../models/supplier';
import Modal from '../components/Modal';
import { ConfirmModal, type ModalData } from '../components/ConfirmModal';
import Loader from '../components/Loader';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<ModalData | null>(null);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedSuppliers = await getSuppliers();
            setSuppliers(fetchedSuppliers.map(p => new Supplier(p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Supplier },
        { header: 'Name', accessor: 'name' as keyof Supplier },
        { header: 'Contact Person', accessor: 'contactPerson' as keyof Supplier },
        { header: 'Phone', accessor: 'phone' as keyof Supplier },
        { header: 'Email', accessor: 'email' as keyof Supplier },
        { header: 'Address', accessor: 'address' as keyof Supplier },
        { header: 'Notes', accessor: 'notes' as keyof Supplier },
        {
            header: 'Actions',
            accessor: (row: Supplier) => (
                <button
                    onClick={() => handleDeleteInitiated(row.id)}
                    className="text-red-600 hover:text-red-800"
                >
                    Delete
                </button>
            )
        }
    ];

    const supplierFormFields: FormField<Supplier>[] = [
        { name: 'name', label: 'Supplier Name', type: 'text' },
        { name: 'contactPerson', label: 'Contact Person', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'text' }
    ];

    const handleAddProduct = async (formData: Partial<ISupplier>) => {
        try {
            setError(null);
            setLoading(true);
            const supplierData = {
                name: formData.name || '',
                contactPerson: formData.contactPerson,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                notes: formData.notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await createSupplier(supplierData);
            await loadSuppliers(); // Refresh the list
            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
        }
    };

    const handleDeleteInitiated = (id: string) => {
        setConfirmModalData({
            title: 'Confirm Action',
            body: 'Do you want to delete this Supplier',
            onSuccess: () => handleDeleteProduct(id)
        })
    }

    const handleDeleteProduct = async (id: string) => {
        try {
            setError(null);
            setLoading(true);
            setConfirmModalData(null);
            await deleteSupplier(id);
            await loadSuppliers(); // Refresh the list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    return (
        <>
            <Loader loading={loading} />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Supplier</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 text-sm font-medium text-white 
                                bg-blue-500 hover:bg-blue-600 
                                dark:bg-blue-600 dark:hover:bg-blue-700 
                                rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Supplier
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
                        data={suppliers}
                    />
                )}

                <Modal show={showModal} size='xl' onClose={() => setShowModal(false)} title='Add New Product'>
                    <Form<Supplier>
                        fields={supplierFormFields}
                        onSubmit={handleAddProduct}
                        onClose={() => setShowModal(false)}
                        initialData={new Supplier({
                            id: '',
                            name: '',
                            contactPerson: '',
                            phone: '',
                            email: '',
                            address: '',
                            notes: '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })}
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

export default SuppliersPage;
