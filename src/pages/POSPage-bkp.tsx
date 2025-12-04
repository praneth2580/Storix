import { useEffect, useState } from "react";
import DarkModeToggle from "../components/DarkModeToggle";
import { getVariants } from "../models/variants";
import { Variant } from "../types/models";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import CountHandler from "../components/CountHandler";

type CartItem = Variant & { count: number };

const POSPage = () => {
    const [posItems, setPOSItems] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [cart, setCart] = useState<Partial<CartItem>[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const totalItems: number = cart.reduce((a, b) => a + (b.count ?? 0), 0);
    const subtotal = cart.reduce(
        (sum, item) => sum + ((item.sellingPrice || 0) * (item.count ?? 0)),
        0
    );

    const taxRate = 0.18;

    const totalTax = subtotal * taxRate;
    const total = subtotal + totalTax;

    // Format only when displaying
    const formattedSubtotal = subtotal.toFixed(2);
    const formattedTax = totalTax.toFixed(2);
    const formattedTotal = total.toFixed(2);



    useEffect(() => {
        loadVariants();
    }, []);

    const loadVariants = async () => {
        try {
            setLoading(true);
            const fetchedVariants = await getVariants();
            setPOSItems(fetchedVariants.map(p => new Variant(p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const categories = ["All", ...new Set(posItems.map(v => v.product?.category).filter(Boolean))];

    const filteredItems = posItems.filter(v => {
        const matchesCategory = activeCategory === "All" || v.product?.category === activeCategory;
        const matchesSearch = v.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleCountChange = (item: Partial<CartItem>, delta: number) => {
        setCart(prev =>
            prev
                .map(v => {
                    if (v.id !== item.id) return v;

                    const newCount = (v.count || 0) + delta;
                    if (newCount <= 0) return null;

                    return { ...v, count: newCount };
                })
                .filter((v): v is CartItem => v !== null)
        );
    };



    const addToCart = (variant: Variant) => {
        setCart(prev => {
            const found = prev.find(v => v.id === variant.id);
            if (found) {
                return prev.map(v =>
                    v.id === variant.id ? { ...v, count: (v.count ?? 0) + 1 } : v
                );
            }
            return [...prev, { ...variant, count: 1 } as CartItem];
        });
    };


    return (
        <div className="p-5 h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative overflow-hidden">

            <Loader loading={loading} />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">

                <div className="bg-[url('/Storix/pos-banner.png')] h-12 w-40 bg-cover bg-center rounded-lg shadow-sm" />

                <div className="flex items-center gap-4">

                    {/* SEARCH BOX */}
                    <div className="w-72 relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 
                            border border-gray-300 dark:border-gray-700 shadow-sm
                            focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* THEME TOGGLE */}
                    <div className="scale-110">
                        <DarkModeToggle />
                    </div>

                </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveCategory(cat ?? "")}
                        className={`px-5 py-2 rounded-full font-medium 
                        transition-all duration-200 whitespace-nowrap
                        shadow-sm border 
                        ${activeCategory === cat
                                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

                <AnimatePresence>
                    {filteredItems.map((variant, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                            shadow-sm hover:shadow-md transition cursor-pointer p-4 flex flex-col"
                        >
                            {/* IMAGE PLACEHOLDER */}
                            <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />

                            {/* TEXT */}
                            <p className="font-semibold text-lg">{variant.product?.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {Object.values(variant.attributes).join(" - ")}
                            </p>

                            <div className="mt-auto pt-3">
                                <p className="text-xl font-bold text-blue-600">₹{variant.sellingPrice || 200}</p>

                                {cart.findIndex(item => item.id === variant.id) === -1 ? <button
                                    onClick={() => addToCart(variant)}
                                    className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg 
                                    hover:bg-blue-700 active:scale-[0.98] transition"
                                >
                                    Add to Cart
                                </button> : <div className="w-fit mx-auto"><CountHandler handleCountChange={(increment) => handleCountChange(variant, increment)} itemCount={cart.find(item => item.id === variant.id)?.count || 0} /></div>}

                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

            </div>

            {/* EMPTY STATE */}
            {!loading && filteredItems.length === 0 && (
                <div className="text-center mt-16 text-lg text-gray-600 dark:text-gray-400">
                    No products match your search.
                </div>
            )}

            {/* CART BUTTON */}
            <motion.button
                onClick={() => setCartOpen(true)}
                whileTap={{ scale: 0.92 }}
                className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-4 rounded-full shadow-xl 
                hover:bg-blue-700 transition flex items-center gap-2"
            >
                <span className="font-semibold">Cart</span>
                <span className="bg-white text-blue-600 px-3 py-0.5 rounded-full text-sm font-bold">
                    {cart.length}
                </span>
            </motion.button>

            {/* CART DRAWER */}
            <AnimatePresence>
                {cartOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 250, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 
                        shadow-2xl border-l border-gray-300 dark:border-gray-700 p-5 z-50 flex flex-col"
                    >
                        <div className="flex flex-row justify-between items-center pb-4">
                            <h2 className="text-xl font-bold">Cart</h2>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="
                                    px-2 py-1 rounded-md bg-none
                                    hover:bg-gray-900 dark:hover:bg-gray-600
                                    text-gray-700 dark:text-gray-200
                                    transition
                                "
                            >
                                ✕
                            </button>
                        </div>

                        {/* CART ITEMS */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {cart.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group p-4 rounded-xl bg-gray-100 dark:bg-gray-800 
                                        border border-gray-200 dark:border-gray-700
                                        shadow-sm hover:shadow-md transition-all duration-200
                                        flex justify-between items-center gap-4"
                                >
                                    {/* LEFT: Product Name + Attributes */}
                                    <div className="flex flex-col gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {item.product?.name}
                                        </span>

                                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex flex-row flex-wrap gap-1">
                                            {item.attributes && Object.values(item.attributes)?.map(attr => <span className="rounded-full text-[10px] bg-blue-400 dark:bg-blue-200 w-fit py-1 px-2 text-white dark:text-black uppercase">{attr}</span>)}
                                        </span>
                                    </div>

                                    {/* RIGHT: Price + Quantity */}
                                    <div className="flex flex-col">
                                        {/* Price */}
                                        <span className="font-bold text-blue-500 dark:text-blue-400 text-lg text-end">
                                            ₹ {item.sellingPrice || 200}
                                        </span>

                                        {/* Quantity Controls */}
                                        <CountHandler handleCountChange={(increment) => handleCountChange(item, increment)} itemCount={item.count ?? 0} />
                                    </div>
                                </div>
                            ))}
                        </div>


                        {/* CARD SUMMARY */}
                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-y-auto space-y-3">
                            <div key="pre-total" className="flex justify-between items-center pr-1">
                                <span className="font-small">Items({totalItems})</span>
                                <span className="font-normal text-blue-400">₹ {formattedSubtotal}</span>
                            </div>
                            <div key="total-tax" className="flex justify-between items-center pr-1">
                                <span className="font-small">Tax ({taxRate * 100}%)</span>
                                <span className="font-normal text-blue-400">₹ {formattedTax}</span>
                            </div>
                            <div key="total-tax" className="flex justify-between items-center pr-1">
                                <span className="font-small">Total Amount</span>
                                <span className="font-normal text-blue-400">₹ {formattedTotal}</span>
                            </div>
                        </div>

                        {/* CLOSE BUTTON */}
                        <button
                            onClick={() => setCartOpen(false)}
                            className="w-full mt-4 bg-green-700 text-white py-2 rounded-lg hover:bg-green-600 hover:outline-2 outline-offset-1 outline-green-200 transition"
                        >
                            CHECKOUT
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="absolute bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default POSPage;
