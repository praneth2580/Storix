import { useEffect, useState } from "react";
import { Invoice, type InvoiceData, type InvoiceItem } from "../components/Invoice";
import { useParams } from "react-router-dom";
import { getOrders } from "../models/order";
import { getCustomers } from "../models/customers";
import { getSales } from "../models/sale";
import { getVariants } from "../models/variants";
import Loader from "../components/Loader";

const InvoicePage = () => {
  const [orderData, setOrderData] = useState<InvoiceData>();
  const [loading, setLoading] = useState<boolean>(true);
  const params = useParams();
  const orderId = params["OI"];

  const fetchOrders = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const [sales, orders] = await Promise.all([
      getSales({ orderId }),
      getOrders({ id: orderId })
    ]);
    const order = orders?.[0];

    if (!order || orders.length === 0) {
      setLoading(false);
      return;
    }

    let customer;
    if (order.customerId) customer = (await getCustomers({ id: order.customerId }))?.[0];

    const variantsId = sales.map(sale => sale.variantId);
    const variants = await getVariants({ id: variantsId.join(",") });

    console.log(variants)

    const invoiceItems = sales.map(sale => {
      const variant = variants.find(variant => variant.id === sale.variantId);

      return {
        name: variant?.product?.name,
        sku: variant?.sku,
        quantity: sale.quantity,
        unit: sale.unit,
        sellingPrice: sale.sellingPrice,
        total: sale.total
      }
    });

    setOrderData({
      orderId: orderId,
      customerName: customer?.name ?? "",
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
      date: order.date,
      paymentMethod: order.paymentMethod ?? "",
      items: invoiceItems as InvoiceItem,
      subTotal: order.totalAmount,
      tax: (order.totalAmount),
      total: order.totalAmount,
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  },[orderId])

  return <div>
    <Loader loading={loading}/>
    {orderData ? <Invoice
      fullscreen
      data={orderData} /> : <div><p>No Order Found</p></div>}
  </div>;
};

export default InvoicePage;
