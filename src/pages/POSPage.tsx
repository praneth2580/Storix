// =======================
// POSPage.tsx — FULL FILE
// =======================

import React, { useEffect, useMemo, useRef, useState } from "react";
import DarkModeToggle from "../components/DarkModeToggle";
import { getVariants } from "../models/variants";
import { Customer, Stock, Variant, type ICustomer, type IStock, type IVariant } from "../types/models";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import CountHandler from "../components/CountHandler";
import Modal from "../components/Modal";
import Form, { type FormField } from "../components/Form";
import AutoCompleteSearch from "../components/AutoCompleteSearch";
import { createCustomer, getCustomers, updateCustomer } from "../models/customers";
import { Toggle } from "../components/Toggle";
import { createBatchOrder } from "../models/order";
import { openNewTab } from "../utils";
import { getStocks } from "../models/stock";
import type { PaymentMethodType } from "../types/general";

/** Local cart item */
type CartItem = Partial<Variant> & { count: number };
type POSItem = Partial<Variant> & { quantity: number };

const CART_LS_KEY = "storix_pos_cart_v2";

const POSPage: React.FC = () => {
    const [posItems, setPOSItems] = useState<POSItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartStorageChecked, setIsCartStorageChecked] = useState<boolean>(false);
    const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
    const [chosenCustomer, setChosenCustomer] = useState<Customer>();
    const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
    const [cartOpen, setCartOpen] = useState<boolean>(false);
    const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);

    const searchRef = useRef<HTMLInputElement | null>(null);

    // Load variants
    useEffect(() => {
        (async () => {
            const [variants, stocks] = await Promise.all([
                loadVariants(),
                loadStocks()
            ]);

            const variantsWithCount = variants?.map(varaint => ({
                ...varaint,
                quantity: stocks?.filter(stock => stock.variantId === varaint.id).reduce((a, b) => a + b.quantity, 0) ?? 0
            }))

            setPOSItems(variantsWithCount ?? []);
        })();
    }, []);

    useEffect(() => {
        const check = () => setIsLargeScreen(window.innerWidth >= 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Load cart LS
    useEffect(() => {
        try {
            const raw = localStorage.getItem(CART_LS_KEY);
            if (raw) {
                const parsed: CartItem[] = JSON.parse(raw);
                setCart(parsed.map((c) => ({ ...c, count: c.count ?? 1 })));
                setIsCartStorageChecked(true);
            }
        } catch {
            console.log("ERROR-1")
        }
    }, []);

    // Persist cart
    useEffect(() => {
        try {
            if (isCartStorageChecked) localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
        } catch {
            console.log("ERROR-2")
        }
    }, [cart]);

    // keyboard shortcuts
    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
                ev.preventDefault();
                searchRef.current?.focus();
            } else if (ev.key.toLowerCase() === "c") {
                if (!isLargeScreen) setCartOpen((s) => !s);
            } else if (ev.key === "Escape") {
                setCartOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const loadVariants = async () => {
        try {
            setLoading(true);
            const fetched = await getVariants();
            return fetched.map((v: IVariant) => new Variant(v));
            // setPOSItems(fetched.map((v: IVariant) => new Variant(v)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const loadStocks = async () => {
        try {
            setLoading(true);
            const fetched = await getStocks();
            return fetched.map((v: IStock) => new Stock(v));
            // setStocks(fetched.map((v: IStock) => new Stock(v)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = Array.from(
            new Set(posItems.map((v) => v.product?.category).filter(Boolean))
        );
        return ["All", ...cats];
    }, [posItems]);

    const filteredItems = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return posItems.filter((v) => {
            const matchesCategory =
                activeCategory === "All" || v.product?.category === activeCategory;
            const matchesSearch =
                !q ||
                (v.product?.name || "").toLowerCase().includes(q) ||
                Object.values(v.attributes || {})
                    .join(" ")
                    .toLowerCase()
                    .includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [posItems, activeCategory, searchTerm]);

    /** CART **/
    const addToCart = (variant: Variant) => {
        setCart((prev) => {
            const idx = prev.findIndex((p) => p.id === variant.id);
            if (idx >= 0) {
                return prev.map((p) =>
                    p.id === variant.id ? ({ ...p, count: p.count + 1 } as CartItem) : p
                );
            }
            return [...prev, { ...variant, count: 1 }];
        });
        if (!isLargeScreen) setCartOpen(true);
    };

    const handleCountChange = (item: Variant | CartItem, delta: number) => {
        const id = (item as any).id;
        setCart((prev) =>
            prev
                .map((c) => {
                    if (c.id !== id) return c;
                    const newCount = c.count + delta;
                    if (newCount <= 0) return null;
                    return { ...c, count: newCount };
                })
                .filter((x): x is CartItem => x !== null)
        );
    };

    const removeFromCart = (id: string) =>
        setCart((prev) => prev.filter((c) => c.id !== id));

    const totalItems = useMemo(
        () => cart.reduce((a, b) => a + b.count, 0),
        [cart]
    );

    const subtotal = useMemo(
        () => cart.reduce((s, i) => s + (i.sellingPrice || 0) * i.count, 0),
        [cart]
    );

    const taxRate = 0.18;
    const totalTax = subtotal * taxRate;
    const total = subtotal + totalTax;

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <Loader loading={loading} />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-[url('/Storix/pos-banner.png')] h-12 w-40 bg-cover bg-center rounded-lg shadow-sm" />
                    <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                        Storix — Point of Sale
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        <div className="relative">
                            <input
                                ref={searchRef}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products — Ctrl/Cmd + K"
                                className="w-full md:w-96 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm placeholder-gray-400 focus:outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                ⌘K
                            </div>
                        </div>
                    </div>

                    <DarkModeToggle />

                    <button
                        onClick={() => !isLargeScreen && setCartOpen((s) => !s)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="10" cy="20" r="1" fill="currentColor" />
                            <circle cx="18" cy="20" r="1" fill="currentColor" />
                        </svg>
                        <span>{totalItems}</span>
                    </button>
                </div>
            </div>

            {/* MAIN */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: products */}
                <div className="flex-1">
                    {/* categories */}
                    <div className="mb-4">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat ?? "")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 ${activeCategory === cat
                                        ? "text-white bg-blue-500 dark:bg-blue-600"
                                        : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* product grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        <AnimatePresence>
                            {filteredItems.map((variant) => {
                                const inCart = cart.some((c) => c.id === variant.id);
                                const count =
                                    cart.find((c) => c.id === variant.id)?.count ?? 0;

                                return (
                                    <motion.div
                                        key={variant.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.14 }}
                                        className="rounded-2xl p-4 bg-white dark:bg-[#0e0e11] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition relative flex flex-col justify-between"
                                    >
                                        {/* top */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm line-clamp-2">
                                                    {variant.product?.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {Object.values(
                                                        variant.attributes || {}
                                                    )
                                                        .slice(0, 3)
                                                        .join(" • ")}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-lg font-bold text-blue-500">
                                                    ₹{variant.sellingPrice}
                                                </div>
                                                <div className="text-xs text-gray-400">each</div>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-3">
                                            {!inCart ?
                                                variant.quantity > 0 ? <button
                                                    onClick={() => addToCart(new Variant(variant as IVariant))}
                                                    className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition cursor-pointer"
                                                >
                                                    Add
                                                </button> : <button
                                                    className="w-full py-2 rounded-lg bg-red-800 hover:bg-red-900 text-red-200 font-medium transition cursor-not-allowed"
                                                >
                                                    Out Of Stock
                                                </button>
                                                : (
                                                    <CountHandler
                                                        itemCount={count}
                                                        maxCount={variant.quantity}
                                                        handleCountChange={(d) =>
                                                            handleCountChange(new Variant(variant as IVariant), d)
                                                        }
                                                    />
                                                )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {!loading && filteredItems.length === 0 && (
                        <div className="text-center mt-8 text-gray-500">
                            No products found.
                        </div>
                    )}
                </div>

                {/* DESKTOP CART */}
                <aside className="w-full lg:w-96 hidden lg:block">
                    <div className="sticky top-6 space-y-4">
                        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-inner">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold">Cart</h3>
                                <div className="text-sm text-gray-500">
                                    {totalItems} items
                                </div>
                            </div>

                            {/* CART LIST (FULLY REPLACED) */}
                            <div className="max-h-96 overflow-y-auto pr-2 flex flex-col gap-3">
                                {cart.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500">
                                        Your cart is empty
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm">
                                                        {item.product?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {Object.values(item.attributes || {})
                                                            .slice(0, 3)
                                                            .join(" • ")}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-blue-500">
                                                        ₹{(item.sellingPrice ?? 0) * item.count}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ₹{item.sellingPrice} each
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <CountHandler
                                                    itemCount={item.count}
                                                    maxCount={posItems.find(posI => posI.id === item.id)?.quantity ?? 0}
                                                    handleCountChange={(d) =>
                                                        handleCountChange(item, d)
                                                    }
                                                />

                                                <button
                                                    onClick={() =>
                                                        removeFromCart(item?.id ?? '')
                                                    }
                                                    className="text-xs text-red-400 hover:text-red-500"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* TOTALS */}
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-600">Tax (18%)</span>
                                    <span>₹{totalTax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between font-bold text-lg mt-4">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>

                                <button disabled={cart.length === 0} onClick={() => setCustomerModalOpen(true)} className="
                                    w-full mt-4 py-3 rounded-xl
                                    bg-blue-600 text-white font-semibold
                                    hover:bg-blue-700
                                    disabled:bg-gray-400 disabled:text-gray-200
                                    disabled:cursor-not-allowed
                                    transition
                                ">
                                    Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* MOBILE CART DRAWER */}
            <AnimatePresence>
                {!isLargeScreen && cartOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.25 }}
                        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-10"
                        onClick={() => setCartOpen(false)} // click outside closes
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.25 }}
                            className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-xl p-4 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()} // prevent close on inner click
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Cart</h3>
                                <button
                                    onClick={() => setCartOpen(false)}
                                    className="text-gray-500 dark:text-gray-300 text-sm"
                                >
                                    Close ✕
                                </button>
                            </div>

                            {/* CART LIST (same as desktop) */}
                            <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500">
                                        Your cart is empty
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm">
                                                        {item.product?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {Object.values(item.attributes || {})
                                                            .slice(0, 3)
                                                            .join(" • ")}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-blue-500">
                                                        ₹{(item.sellingPrice ?? 0) * item.count}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ₹{item.sellingPrice} each
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <CountHandler
                                                    itemCount={item.count}
                                                    maxCount={posItems.find(posI => posI.id === item.id)?.quantity ?? 0}
                                                    handleCountChange={(d) =>
                                                        handleCountChange(item, d)
                                                    }
                                                />

                                                <button
                                                    onClick={() => removeFromCart(item.id ?? "")}
                                                    className="text-xs text-red-400 hover:text-red-500"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* TOTALS */}
                            <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-4">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-600">Tax (18%)</span>
                                    <span>₹{totalTax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between font-bold text-lg mt-4">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>

                                <button onClick={() => {
                                    setCustomerModalOpen(true);
                                    setCartOpen(false);
                                }} disabled={cart.length === 0} className="
                                    w-full mt-4 py-3 rounded-xl
                                    bg-blue-600 text-white font-semibold
                                    hover:bg-blue-700
                                    disabled:bg-gray-400 disabled:text-gray-200
                                    disabled:cursor-not-allowed
                                    transition
                                ">
                                    Checkout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg">{error}</div>}

            <CustomerModal
                show={customerModalOpen}
                chosenCustomer={customer => {
                    setChosenCustomer(customer);
                    setPaymentModalOpen(true);
                }}
                setLoading={setLoading}
                onClose={() => setCustomerModalOpen(false)} />

            <PaymentModal
                show={paymentModalOpen}
                customer={chosenCustomer ?? new Customer({
                    id: '',
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                    gstNumber: '',
                    outstandingBalance: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })}
                setLoading={setLoading}
                cart={cart}
                onClose={() => setPaymentModalOpen(false)}
                onSuccess={(orderId) => {
                    setCart([]);
                    setLoading(false);
                    openNewTab(`/full/invoice/${orderId}`);
                    setPaymentModalOpen(false);
                }} />
        </div>
    );
};

const CustomerModal = ({ show, onClose, chosenCustomer, setLoading }: { show: boolean; onClose: () => void; chosenCustomer: (customer: Customer) => void, setLoading: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const [customers, setCustomers] = useState<Customer[]>();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
    const [key, setKey] = useState<number>(0);
    const customerFormFields: FormField<Customer>[] = [
        { name: 'name', label: 'Name', required: true, type: 'text' },
        { name: 'phone', label: 'Phone', required: true, type: 'phone' },
        { name: 'email', label: 'Email', required: false, type: 'email' },
        { name: 'address', label: 'Address', required: false, type: 'text' },
        { name: 'notes', label: 'Notes', required: false, type: 'text' },
        { name: 'gstNumber', label: 'GST No', required: false, type: 'text' },
        // { name: 'outstandingBalance', label: 'Outstanding Balance', type: 'number' },
    ];

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const fetched = await getCustomers();
            setCustomers(fetched.map(v => new Customer(v)));
        } catch (err) {
            console.log(err);
            // setError(err instanceof Error ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSubmit = async (formData: Partial<ICustomer>) => {
        setLoading(true);
        if (selectedCustomer) {
            const data = {
                id: selectedCustomer.id,
                name: formData.name ?? '',
                phone: formData.phone ?? '',
                email: formData.email ?? '',
                address: formData.address ?? '',
                notes: formData.notes ?? '',
                gstNumber: formData.gstNumber ?? '',
                outstandingBalance: selectedCustomer.outstandingBalance || 0,
                createdAt: selectedCustomer.createdAt,
                updatedAt: new Date().toISOString()
            };

            await updateCustomer(data);
            chosenCustomer(new Customer(data));

        } else {
            const data = {
                name: formData.name ?? '',
                phone: formData.phone ?? '',
                email: formData.email ?? '',
                address: formData.address ?? '',
                notes: formData.notes ?? '',
                gstNumber: formData.gstNumber ?? '',
                outstandingBalance: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const reslt = await createCustomer(data);

            chosenCustomer(new Customer({
                "id": reslt["id"],
                ...data
            }));
        }
    }

    useEffect(() => {
        setKey(key + 1);
    }, [selectedCustomer]);

    useEffect(() => {
        if (!show) return;
        loadCustomers();
        setSelectedCustomer(undefined);
    }, [show]);


    return <Modal show={show} size="xl" title="Customer Details" onClose={onClose}>
        <div
            className="
                w-full max-w-5xl mx-auto p-6 rounded-xl
                bg-white dark:bg-gray-900
                border border-gray-200 dark:border-gray-700
            ">

            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Existing Customers</p>
            <AutoCompleteSearch<Customer>
                id="auto-complete-customer-search"
                name="auto-complete-customer-search"
                value=""
                options={customers ?? []}
                key="phone"
                searchKeys={["name", "phone", 'email']}
                placeholder="Search via phone number....."
                onSelect={(customer) => setSelectedCustomer(customer)}
                renderOption={(customer) => <div className="px-3 py-3 flex flex-col hover:bg-gray-700">
                    <p className="font-lg font-bold ">{customer.name}</p>
                    <div className="flex flex-row gap-2">
                        <p className="font-md">{customer.phone}</p>
                        <p className="font-md">{customer.email}</p>
                    </div>
                </div>}
            />
        </div>

        <div className="flex flex-row gap-2 justify-center items-center my-3">
            <div className="border-bottom border-1 w-[calc(50%-10rem)] border-gray-200 dark:border-gray-700 my-5 ms-auto me-2 align-end"></div>
            <p className="font-bold text-md mx-5">OR</p>
            <div className="border-bottom border-1 w-[calc(50%-10rem)] border-gray-200 dark:border-gray-700 my-5 me-auto ms-2 align-start"></div>
        </div>

        <Form<Customer>
            key={key}
            fields={customerFormFields}
            onSubmit={handleCustomerSubmit}
            onClose={onClose}
            initialData={selectedCustomer ? selectedCustomer : new Customer({
                id: '',
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                gstNumber: '',
                outstandingBalance: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })} />
    </Modal>
}

const PaymentModal = ({ show, onClose, customer, cart, setLoading, onSuccess }: { show: boolean; onClose: () => void, customer: Customer, cart: CartItem[], setLoading: React.Dispatch<React.SetStateAction<boolean>>, onSuccess: (orderID: string) => void }) => {


    const totalItems = useMemo(
        () => cart.reduce((a, b) => a + b.count, 0),
        [cart]
    );

    const subtotal = useMemo(
        () => cart.reduce((s, i) => s + (i.sellingPrice || 0) * i.count, 0),
        [cart]
    );

    const taxRate = 0.18;
    const totalTax = subtotal * taxRate;
    const total = subtotal + totalTax;

    const totalOutStanding = customer.outstandingBalance + total;

    const [fullPayment, setFullPayment] = useState<boolean>(false);
    const [fullOutstandingPayment, setFullOutstandingPayment] = useState<boolean>(false);
    const [totalPaymentAmount, setTotalPaymentAmount] = useState(totalOutStanding);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
    const paymentMethodOptions: { label: string, value: PaymentMethodType } = [
        { label: "Cash", value: "cash" },
        { label: "Card", value: "card" },
        { label: "Cheque", value: "cheque" },
        { label: "UPI", value: "upi" },
        { label: "Bank Transfer", value: "bank" },
        { label: "Other", value: "other" },
        { label: "No Payment", value: "none" },
    ]

    const handlePaymentProceed = async () => {
        try {
            setLoading(true);

            const order = {
                customerId: customer.id,
                totalAmount: totalPaymentAmount,
                paymentMethod: paymentMethod,
                notes: ""
            }

            const items = cart.map(c => ({
                "variantId": c.id ?? '',
                "quantity": c.count ?? 0,
                "unit": c.product?.baseUnit ?? '',
                "sellingPrice": c.sellingPrice ?? 0,
                "total": (c.sellingPrice ?? 0) * c.count,
                "customerId": customer.id,
                "paymentMethod": paymentMethod
            }));

            const _customer = customer;
            _customer.outstandingBalance = totalOutStanding - totalPaymentAmount;

            const { orderId } = await createBatchOrder(order, items, _customer, total, totalPaymentAmount);
            setLoading(false);
            onSuccess(orderId);

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (!show) return;
        setTotalPaymentAmount(totalOutStanding);
        setLoading(false);
    }, [show])

    useEffect(() => {
        if (paymentMethod === 'none') {
            setTotalPaymentAmount(0);
        } else if (fullOutstandingPayment) {
            setTotalPaymentAmount(totalOutStanding);
        } else if (fullPayment) {
            setTotalPaymentAmount(total);
        }
    }, [fullPayment, fullOutstandingPayment, paymentMethod])


    return <Modal show={show} size="xl" title="Payment Details" onClose={onClose}>

        <div className="px-2 py-3 flex flex-row gap-4">
            <div className="flex flex-col flex-1">
                <label htmlFor="totalPaymentAmount" className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Amount Payed</label>
                <input
                    id="totalPaymentAmount"
                    type="number"
                    value={totalPaymentAmount}
                    onChange={(e) => setTotalPaymentAmount(parseFloat(e.target.value))}
                    disabled={fullPayment || fullOutstandingPayment || paymentMethod === 'none'}
                    required
                    className="
                        p-3 rounded-lg w-full
                        border border-gray-300 dark:border-gray-700
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-gray-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                />
            </div>
            <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Full Payment</label>
                <div className="h-full flex items-center justify-center">
                    <Toggle
                        checked={fullPayment}
                        onChange={(value) => setFullPayment(value)}
                        disabled={fullOutstandingPayment || paymentMethod === 'none'}
                        size="lg"
                    />
                </div>
            </div>
            <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Full Outstanding Payment</label>
                <div className="h-full flex items-center justify-center">
                    <Toggle
                        checked={fullOutstandingPayment}
                        onChange={(value) => setFullOutstandingPayment(value)}
                        disabled={fullPayment || paymentMethod === 'none'}
                        size="lg"
                    />
                </div>
            </div>
        </div>
        <div className="my-4 ms-2">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {paymentMethodOptions.map(payMethod => <button
                    key={payMethod.value}
                    onClick={() => setPaymentMethod((payMethod.value ?? "other") as pay)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 ${paymentMethod === payMethod.value
                        ? "text-white bg-blue-500 dark:bg-blue-600"
                        : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
                        }`}
                >
                    {payMethod.label}
                </button>)}
            </div>
        </div>
        <div>
            {/* TOTALS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-inner">
                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Items ({totalItems}) + Tax ({taxRate * 100}%)</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Outstanding</span>
                    <span>₹{customer.outstandingBalance.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>₹{totalPaymentAmount.toFixed(2)}</span>
                </div>

                {totalPaymentAmount < totalOutStanding && <div className="flex justify-between font-bold text-red-400 text-sm mt-4">
                    <span>Outstanding Amount [ - ]</span>
                    <span>₹{(totalOutStanding - totalPaymentAmount).toFixed(2)}</span>
                </div>}

                {totalPaymentAmount > totalOutStanding && <div className="flex justify-between font-bold text-green-400 text-sm mt-4">
                    <span>Outstanding Amount [ + ]</span>
                    <span>₹{(totalPaymentAmount - totalOutStanding).toFixed(2)}</span>
                </div>}

                <button disabled={cart.length === 0} onClick={handlePaymentProceed} className="
                    w-full mt-4 py-3 rounded-xl
                    bg-blue-600 text-white font-semibold
                    hover:bg-blue-700
                    disabled:bg-gray-400 disabled:text-gray-200
                    disabled:cursor-not-allowed
                    transition
                ">
                    Proceed
                </button>
            </div>
        </div>

    </Modal>
}

export default POSPage;
