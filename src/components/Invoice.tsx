import { useRef } from "react";
import jsPDF from "jspdf";
import domToImage from "dom-to-image-more";
import { blobToBase64, formatDateForUI } from "../utils";

export interface InvoiceItem {
    name: string;
    sku: string;
    quantity: number;
    unit: string;
    sellingPrice: number;
    total: number;
}

export interface InvoiceData {
    orderId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    date: string;
    paymentMethod: string;
    items: InvoiceItem[];
    subTotal: number;
    tax: number;
    total: number;
}


export function Invoice({ data }: { data: InvoiceData }) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    function PrintableInvoice({ data }: { data: InvoiceData }) {
        return (
            <div
                id="invoiceCapture"
                className="w-full mx-auto bg-white overflow-hidden text-black rounded shadow border hidden flex flex-col justify-between"
                style={{
                    fontFamily: "Arial, sans-serif",
                }}
            >
                {/* Header */}
                <div className="text-center bg-[var(--base-color)] mb-6 flex justify-center overflow-hidden">
                    <img src="/Storix/banner.png" alt="Storix banner" className="h-20 scale-200" />
                </div>

                <div className="flex flex-row justify-between px-6">
                    <div className="text-center mb-6 flex flex-col items-start gap-1">
                        <h1 className="text-[60px] text-(--base-color) font-bold font-[Charcoal]">INVOICE</h1>
                        <p className="text-sm">Order #{data?.orderId}</p>
                    </div>

                    <hr className="my-4" />

                    {/* Customer Info */}
                    <div className="mb-6 bg-gray-100 p-5 rounded-md flex flex-col gap-1">
                        {/* <h2 className="font-bold text-lg">Customer</h2> */}
                        <div className="text-sm leading-5">
                            <p className="text-lg font-semibold">{data?.customerName}</p>
                            <p className="text-gray-500">Phone: <span className="font-semibold text-black">{data.customerPhone}</span></p>
                            <p className="text-gray-500">Email: <span className="font-semibold text-black">{data.customerEmail}</span></p>
                            <p className="text-gray-500">Date: <span className="font-semibold text-black">{formatDateForUI(data.date)}</span></p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {/* Items Table */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Items</h2>

                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-(--base-color) text-semibold text-gray-100">
                                <tr>
                                    <th className="text-left p-3 font-medium">Product</th>
                                    <th className="text-center p-3 font-medium">Qty</th>
                                    <th className="text-right p-3 font-medium">Price</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.items?.map((item, i) => (
                                    <tr
                                        key={i}
                                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                    >
                                        <td className="p-3 text-gray-800">{item.name}</td>
                                        <td className="text-center p-3 text-gray-700">
                                            {item.quantity}
                                        </td>
                                        <td className="text-right p-3 font-medium text-gray-900">
                                            ₹{item.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-xs bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm text-sm">
                        <div className="flex justify-between py-1 text-gray-700">
                            <span>Subtotal</span>
                            <span>₹{data?.subTotal}</span>
                        </div>

                        <div className="flex justify-between py-1 text-gray-700">
                            <span>Tax</span>
                            <span>₹{data?.tax}</span>
                        </div>

                        <div className="border-t mt-3 pt-3 flex justify-between text-lg font-bold text-(--base-color)">
                            <span>Total</span>
                            <span>₹{data?.total}</span>
                        </div>
                    </div>
                </div>

                <hr className="mb-4 mt-65" />

                {/* Footer */}
                <div className="text-center text-xs text-gray-500" id="footer">
                    Thank you for your purchase!
                </div>
            </div>
        );
    }

    /** PRINT */
    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Invoice_${data.orderId}`;
        window.print();
        document.title = originalTitle;
    };


    /** DOWNLOAD PDF */
    const handleDownload = async () => {
        if (!invoiceRef.current) return;

        const blob = await domToImage.toBlob(invoiceRef.current);

        const pdf = new jsPDF("p", "mm", "a4");
        const img = await blobToBase64(blob);

        pdf.addImage(img, "PNG", 0, 0, 210, 297);
        pdf.save(`Invoice_${data.orderId}.pdf`);
    };

    /** SHARE via WhatsApp */
    const handleShareWhatsapp = () => {
        if (data.customerPhone) {
            const msg = `Hello ${data.customerName}, here is your invoice.\nTotal: ₹${data.total}\nOrder ID: ${data.orderId}`;
            window.open(`https://wa.me/${data.customerPhone}?text=${encodeURIComponent(msg)}`, "_blank");
            return;
        }

        alert("No phone or email available for sharing.");
    };

    /** SHARE via Email */
    const handleShareMail = () => {
        if (data.customerEmail) {
            const body = `Hello ${data.customerName},\n\nYour invoice details:\nTotal: ₹${data.total}\nOrder: ${data.orderId}`;
            // window.location.href = `mailto:${data.customerEmail}?subject=Invoice ${data.orderId}&body=${encodeURIComponent(body)}`;
            window.open(`mailto:${data.customerEmail}?subject=Invoice ${data.orderId}&body=${encodeURIComponent(body)}`, "_blank");
            return;
        }

        alert("No phone or email available for sharing.");
    };

    return (
        <>
            <PrintableInvoice data={data} />
            <div id="none-printable-invoice" className="w-full min-h-screen flex justify-center py-10 px-4 bg-gray-100 dark:bg-gray-900 transition-colors">
                <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-xl flex overflow-hidden transition-colors">

                    {/* MAIN CONTENT */}
                    <div className="flex-1 p-8 invoice-canvas" ref={invoiceRef}>

                        {/* Breadcrumb + Status */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                PAYMENTS / INVOICE {data.orderId}
                            </p>

                            <button
                                className="text-sm text-blue-500 flex items-center gap-2"
                                onClick={handleShareMail}
                            >
                                <span>Send to email</span>
                                📧
                            </button>
                        </div>

                        {/* Title + Status */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded-full">
                                INVOICE
                            </span>

                            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                INVOICE Nº {data.orderId}
                            </h1>
                        </div>

                        {/* CENTER PAPER CARD */}
                        <div className="bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-md p-8 max-w-3xl mx-auto transition-colors">

                            {/* ORDER DETAILS */}
                            <div>
                                <h2 className="text-gray-800 dark:text-gray-100 font-semibold mb-4">
                                    ORDER DETAILS
                                </h2>

                                <div className="grid grid-cols-3 text-sm py-2">
                                    <p className="text-gray-500 dark:text-gray-300">Name</p>
                                    <p className="col-span-2 font-medium dark:text-gray-100">
                                        {data.customerName}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 text-sm py-2 border-b dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-300">Tansaction Date</p>
                                    <p className="col-span-2 font-medium dark:text-gray-100">
                                        {formatDateForUI(data.date)}
                                    </p>
                                </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="mt-6">
                                <h2 className="text-gray-800 dark:text-gray-100 font-semibold mb-4">
                                    ITEMS
                                </h2>

                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-500 dark:text-gray-300 border-b dark:border-gray-600">
                                            <th className="text-left py-2">Item</th>
                                            <th className="text-left py-2">Qty</th>
                                            <th className="text-left py-2">Price</th>
                                            <th className="text-right py-2">Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {data.items.map((item, i) => (
                                            <tr key={i} className="border-b dark:border-gray-600">
                                                <td className="py-3 font-medium text-gray-700 dark:text-gray-100">{item.name}</td>
                                                <td className="py-3 text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                                <td className="py-3 text-gray-600 dark:text-gray-300">₹{item.sellingPrice}</td>
                                                <td className="py-3 text-right font-semibold text-gray-800 dark:text-gray-100">
                                                    ₹{item.total}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* SUBTOTALS */}
                                <div className="mt-6 space-y-1">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                        <span>Subtotal</span>
                                        <span>₹{data.subTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                        <span>Tax</span>
                                        <span>₹{data.tax}</span>
                                    </div>

                                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 border-t dark:border-gray-600 pt-3 mt-3">
                                        <span>Total</span>
                                        <span>₹{data.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l dark:border-gray-700 p-8 flex flex-col justify-between transition-colors">

                        <div>
                            <h2 className="text-gray-800 dark:text-gray-100 font-semibold mb-4">ORDER DETAIL</h2>

                            <div className="space-y-3 text-sm">
                                <p className="font-medium dark:text-gray-100">{data.customerName}</p>

                                {data.customerPhone && (
                                    <p className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
                                        📞 {data.customerPhone}
                                    </p>
                                )}
                                {data.customerEmail && (
                                    <p className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
                                        📧 {data.customerEmail}
                                    </p>
                                )}
                            </div>

                            <h2 className="text-gray-800 dark:text-gray-100 font-semibold mt-8 mb-2">
                                PRICING DETAILS
                            </h2>

                            <p className="text-3xl font-bold text-blue-600">
                                ₹{data.total}
                            </p>

                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                                <p>Payment: {data.paymentMethod}</p>
                                <p>Date: {formatDateForUI(data.date)}</p>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col gap-3 mt-6">
                            <button
                                className="py-2 rounded-lg bg-blue-500 text-white font-medium"
                                onClick={handlePrint}
                            >
                                Invoice
                            </button>

                            <button
                                className="py-2 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700 font-medium"
                                onClick={handleDownload}
                            >
                                Download
                            </button>

                            <button
                                className="py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium"
                                onClick={handleShareWhatsapp}
                            >
                                Share
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}