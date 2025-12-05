// =======================
// POSPage.tsx — FULL FILE
// =======================

import React, { useEffect, useMemo, useRef, useState } from "react";
import DarkModeToggle from "../components/DarkModeToggle";
import { getVariants } from "../models/variants";
import { Customer, Variant } from "../types/models";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import CountHandler from "../components/CountHandler";
import Modal from "../components/Modal";
import Form, { type FormField } from "../components/Form";
import AutoCompleteSearch from "../components/AutoCompleteSearch";
import { getCustomers } from "../models/customers";

/** Local cart item */
type CartItem = Partial<Variant> & { count: number };

const CART_LS_KEY = "storix_pos_cart_v2";

const POSPage: React.FC = () => {
    const [posItems, setPOSItems] = useState<Variant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState<boolean>(false);
    const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);

    const searchRef = useRef<HTMLInputElement | null>(null);

    // Load variants
    useEffect(() => {
        loadVariants();
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
            }
        } catch {
            console.log("ERROR-1")
        }
    }, []);

    // Persist cart
    useEffect(() => {
        try {
            localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
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
            setPOSItems(fetched.map((v: any) => new Variant(v)));
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
                                    onClick={() => setActiveCategory(cat)}
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
                                            {!inCart ? (
                                                <button
                                                    onClick={() => addToCart(variant)}
                                                    className="w-full py-2 rounded-lg bg-blue-500 text-white font-medium"
                                                >
                                                    Add
                                                </button>
                                            ) : (
                                                <CountHandler
                                                    itemCount={count}
                                                    handleCountChange={(d) =>
                                                        handleCountChange(variant, d)
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
                                                    handleCountChange={(d) =>
                                                        handleCountChange(item, d)
                                                    }
                                                />

                                                <button
                                                    onClick={() =>
                                                        removeFromCart(item.id)
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

                                <button className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer">
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
                        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
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
                                                    handleCountChange={(d) =>
                                                        handleCountChange(item, d)
                                                    }
                                                />

                                                <button
                                                    onClick={() => removeFromCart(item.id)}
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

                                <button className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold">
                                    Checkout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg">{error}</div>}

            <CustomerModal show={true} onClose={() => { }} />
        </div>
    );
};

const CustomerModal: React.FC = ({ show, onClose }: { show: boolean; onClose: () => void }) => {

    const [customers, setCustomers] = useState<Customer[]>();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
    const [loading, setLoading] = useState<boolean>(true);
    const customerFormFields: FormField<Customer>[] = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'text' },
        { name: 'gstNumber', label: 'GST No', type: 'text' },
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

    useEffect(() => {
        loadCustomers();
    }, []);

    console.log("selectedCustomer: ", selectedCustomer)

    return <Modal show={show} size="xl" title="Customer Details" onClose={onClose}>

        <Loader loading={loading} />
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
                value={selectedCustomer}
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

        <div className="flex flex-row gap-2 justify-center items-center my-5">
            <div className="border-bottom border-1 w-[calc(50%-14rem)] border-gray-200 dark:border-gray-700 my-5 ms-auto me-2 align-end"></div>
            <p>OR</p>
            <div className="border-bottom border-1 w-[calc(50%-14rem)] border-gray-200 dark:border-gray-700 my-5 me-auto ms-2 align-start"></div>
        </div>

        <Form<Customer>
            fields={customerFormFields}
            onSubmit={() => { }}
            onClose={() => { }}
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

export default POSPage;
