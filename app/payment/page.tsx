"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, Banknote, ShieldCheck, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import Footer from "../component/footer";

const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString("en-LK")}.00`;
};

const BANKS = [
    { name: "Sampath", logo: "/sampath.png" },
    { name: "Commercial", logo: "/com.png" },
    { name: "Nations Trust", logo: "/ntb.png" },
    { name: "HSBC", logo: "/hsbc.png" },
    { name: "BOC", logo: "/boc.png" },
    { name: "DFCC", logo: "/dfcc.png" },
    { name: "NDB", logo: "/ndb.png" },
    { name: "HNB", logo: "/hnb.png" },
    { name: "Peoples Bank", logo: "/peoples.png" },
    { name: "Union Bank", logo: "/union.png" },
    { name: "Seylan", logo: "/seylan.png" },
    { name: "LOLC", logo: "/lolc.png" },
  ];

const EMI_BANKS = ["Sampath", "HNB", "Seylan", "LOLC"];
const TENURES = [3, 6, 12, 24, 48];
const SHIPPING_FEE = 3500;

type CartItem = {
  id: number;
  name: string;
  price: string | number;
  qty?: number;
  quantity?: number;
  img?: string;
  image?: string;
};

type PaymentMethod = "card" | "emi" | "cod";

type SavedOrder = {
  orderId: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  bank: string | null;
  tenure: number | null;
  shippingFee: number;
  subtotal: number;
  total: number;
  emiMonthly: number | null;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  status: string;
};

const parsePrice = (price: string | number) => {
  if (typeof price === "number") return price;
  return Number(String(price).replace(/[^0-9.]/g, "")) || 0;
};

const generateOrderId = () => {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);
  return `OPU-${time}-${random}`;
};

const formatPaymentLabel = (method: PaymentMethod) => {
  if (method === "card") return "OUTRIGHT PURCHASE";
  if (method === "emi") return "EASY EMI";
  return "CASH ON DELIVERY";
};

export default function PaymentPage() {
  const router = useRouter();

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card");
  const [selectedBank, setSelectedBank] = React.useState("");
  const [selectedTenure, setSelectedTenure] = React.useState(12);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [completedOrder, setCompletedOrder] = React.useState<SavedOrder | null>(null);

  React.useEffect(() => {
    try {
      const rawCart = localStorage.getItem("opulentia_cart");
      const parsedCart = rawCart ? JSON.parse(rawCart) : [];

      if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
        router.push("/cart");
        return;
      }

      setCartItems(parsedCart);
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load payment data:", error);
      router.push("/cart");
    }
  }, [router]);

  const subtotal = cartItems.reduce((sum, item) => {
    const quantity = item.quantity ?? item.qty ?? 1;
    return sum + parsePrice(item.price) * quantity;
  }, 0);

  const total = subtotal + SHIPPING_FEE;
  const emiMonthly = Math.round(total / selectedTenure);

  const validatePayment = () => {
    if (paymentMethod === "card" && !selectedBank) {
      return "Please select a bank for outright purchase.";
    }

    if (paymentMethod === "emi" && !selectedBank) {
      return "Please select a bank for EMI.";
    }

    return "";
  };

  const handleFinalizeOrder = () => {
    const validationError = validatePayment();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);

    const orderId = generateOrderId();
    const createdAt = new Date().toISOString();

    const orderDetails: SavedOrder = {
      orderId,
      createdAt,
      paymentMethod,
      bank: selectedBank || null,
      tenure: paymentMethod === "emi" ? selectedTenure : null,
      shippingFee: SHIPPING_FEE,
      subtotal,
      total,
      emiMonthly: paymentMethod === "emi" ? emiMonthly : null,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ?? item.qty ?? 1,
        price: parsePrice(item.price),
        image: item.image || item.img || "",
      })),
      status:
        paymentMethod === "cod"
          ? "ORDER CONFIRMED - PAY ON DELIVERY"
          : paymentMethod === "emi"
          ? "ORDER CONFIRMED - EMI SELECTED"
          : "ORDER CONFIRMED - PAID IN FULL",
    };

    setTimeout(() => {
      try {
        localStorage.setItem("opulentia_last_order", JSON.stringify(orderDetails));

        const existingOrders = JSON.parse(localStorage.getItem("opulentia_order_history") || "[]");
        const updatedOrders = Array.isArray(existingOrders)
          ? [orderDetails, ...existingOrders]
          : [orderDetails];

        localStorage.setItem("opulentia_order_history", JSON.stringify(updatedOrders));

        localStorage.removeItem("opulentia_cart");
        localStorage.removeItem("opulentia_order_total");
        window.dispatchEvent(new Event("cartUpdated"));

        setCompletedOrder(orderDetails);
        setIsProcessing(false);
        setShowReceiptModal(true);
      } catch (error) {
        console.error("Failed to finalize order:", error);
        setIsProcessing(false);
        setErrorMessage("Something went wrong while saving your order. Please try again.");
      }
    }, 1800);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    router.push("/");
  };

  const handleDownloadReceipt = () => {
    if (!completedOrder) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - ${completedOrder.orderId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #0A192F;
            }
            h1, h2, h3, p {
              margin: 0;
            }
            .header {
              margin-bottom: 24px;
              border-bottom: 2px solid #D4AF37;
              padding-bottom: 16px;
            }
            .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 16px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
            }
            .card {
              border: 1px solid #ddd;
              padding: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              margin-bottom: 24px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #f7f7f7;
            }
            .totals {
              width: 320px;
              margin-left: auto;
              border: 1px solid #ddd;
              padding: 16px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .totals-row.total {
              border-top: 1px solid #ddd;
              padding-top: 10px;
              font-weight: bold;
              font-size: 16px;
            }
            .status {
              color: green;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OPULENTIA RECEIPT</h1>
            <p style="margin-top:8px;">Thank you for your purchase.</p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Order ID</div>
              <div class="value">${completedOrder.orderId}</div>

              <div class="label">Date</div>
              <div class="value">${new Date(completedOrder.createdAt).toLocaleString()}</div>
            </div>

            <div class="card">
              <div class="label">Payment Method</div>
              <div class="value">${formatPaymentLabel(completedOrder.paymentMethod)}</div>

              <div class="label">Status</div>
              <div class="value status">${completedOrder.status}</div>
            </div>
          </div>

          ${
            completedOrder.bank || completedOrder.tenure
              ? `
            <div class="grid">
              ${
                completedOrder.bank
                  ? `
                <div class="card">
                  <div class="label">Selected Bank</div>
                  <div class="value">${completedOrder.bank}</div>
                </div>
              `
                  : ""
              }

              ${
                completedOrder.tenure
                  ? `
                <div class="card">
                  <div class="label">EMI Tenure</div>
                  <div class="value">${completedOrder.tenure} MONTHS</div>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <h3 style="margin-bottom:12px;">Purchased Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${completedOrder.items
                .map(
                  (item) => `
                <tr>
                  <td>${String(item.name).toUpperCase()}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatCurrency(completedOrder.subtotal)}</span>
            </div>
            <div class="totals-row">
              <span>Shipping</span>
              <span>${formatCurrency(completedOrder.shippingFee)}</span>
            </div>
            ${
              completedOrder.paymentMethod === "emi" && completedOrder.emiMonthly
                ? `
              <div class="totals-row">
                <span>Approx. EMI / month</span>
                <span>${formatCurrency(completedOrder.emiMonthly)}</span>
              </div>
            `
                : ""
            }
            <div class="totals-row total">
              <span>Total</span>
              <span>${formatCurrency(completedOrder.total)}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-[#0A192F] flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <div className="flex items-center justify-center mb-16 max-w-xl mx-auto">
          {[
            { id: 1, label: "Address" },
            { id: 2, label: "Payment" },
            { id: 3, label: "Confirmation" },
          ].map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    step.id === 2
                      ? "bg-[#0A192F] border-[#0A192F] text-white"
                      : step.id < 2
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-200 text-gray-400"
                  )}
                >
                  {step.id < 2 ? <Check size={18} /> : step.id}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-7 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap",
                    step.id === 2 ? "text-[#0A192F]" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={cn("h-[2px] flex-1 mx-4", step.id < 2 ? "bg-green-500" : "bg-gray-200")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
          <div className="lg:col-span-8 space-y-10">
            <section>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                Credit/Debit Cards Outright Purchase
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BANKS.map((bank) => (
                  <button
                    key={bank.name}
                    onClick={() => {
                      setPaymentMethod("card");
                      setSelectedBank(bank.name);
                      setErrorMessage("");
                    }}
                    className={cn(
                      "h-16 border rounded-sm flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all bg-white",
                      paymentMethod === "card" && selectedBank === bank.name
                        ? "border-[#D4AF37] grayscale-0 shadow-md ring-1 ring-[#D4AF37]"
                        : "border-gray-200"
                    )}
                  >
                    <img
                        src={bank.logo}
                        alt={bank.name}
                        className="max-h-8 max-w-[90px] object-contain"
                        />


                  </button>
                ))}
              </div>

              {paymentMethod === "card" && selectedBank && (
                <div className="mt-6 bg-white border border-gray-100 p-6 rounded-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <CreditCard size={18} className="text-[#D4AF37]" />
                    <span>
                      Paying in full via <strong>{selectedBank}</strong>
                    </span>
                  </div>

                  <button
                    onClick={handleFinalizeOrder}
                    className="w-full bg-[#E91E63] text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2185B] transition-colors"
                  >
                    Confirm Outright Purchase
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-6 pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                Credit Card Easy Installments (Easy EMI)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BANKS.filter((b) => EMI_BANKS.includes(b.name)).map((bank) => (
                  <button
                    key={bank.name + "emi"}
                    onClick={() => {
                      setPaymentMethod("emi");
                      setSelectedBank(bank.name);
                      setErrorMessage("");
                    }}
                    className={cn(
                      "h-16 border rounded-sm flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all bg-white",
                      paymentMethod === "emi" && selectedBank === bank.name
                        ? "border-[#D4AF37] grayscale-0 shadow-md ring-1 ring-[#D4AF37]"
                        : "border-gray-200"
                    )}
                  >
                    <img
                    src={bank.logo}
                    alt={bank.name}
                    className="max-h-8 max-w-[90px] object-contain"
                    />

                  </button>
                ))}
              </div>

              <AnimatePresence>
                {paymentMethod === "emi" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="bg-white border border-gray-100 p-6 rounded-sm space-y-6 overflow-hidden"
                  >
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Tenure (Months)
                      </p>
                      <div className="flex flex-wrap gap-6">
                        {TENURES.map((t) => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="tenure"
                              checked={selectedTenure === t}
                              onChange={() => setSelectedTenure(t)}
                              className="accent-[#D4AF37]"
                            />
                            <span className="text-xs font-medium text-gray-700 group-hover:text-[#D4AF37]">
                              {t} month
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4 text-xs">
                      <div className="flex justify-between">
                        <span>Order Value</span>
                        <span className="font-bold">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Handling Fee</span>
                        <span>Rs. 0.00</span>
                      </div>
                      <div className="flex justify-between text-[#D4AF37] font-bold pt-2 border-t mt-2">
                        <span>EMI/month (approx)</span>
                        <span>{formatCurrency(emiMonthly)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleFinalizeOrder}
                      className="w-full bg-[#E91E63] text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2185B] transition-colors"
                    >
                      Choose This Plan
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="pt-6 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-gray-100 rounded-sm hover:border-[#D4AF37] transition-all">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => {
                    setPaymentMethod("cod");
                    setSelectedBank("");
                    setErrorMessage("");
                  }}
                  className="accent-[#D4AF37]"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <Banknote size={16} /> Cash on Delivery
                </span>
              </label>

              {paymentMethod === "cod" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <button
                    onClick={handleFinalizeOrder}
                    className="w-full bg-[#E91E63] text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2185B] transition-colors"
                  >
                    Confirm Cash on Delivery
                  </button>
                </motion.div>
              )}
            </section>

            {errorMessage && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-sm px-4 py-3 text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-[#F4F4F4] p-8 sticky top-32 rounded-sm space-y-6">
              <h2 className="text-lg font-semibold text-gray-700">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-bold text-gray-800">{formatCurrency(SHIPPING_FEE)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-[#0A192F]">{formatCurrency(total)}</span>
              </div>

              <div className="bg-white border border-green-200 p-4 rounded-sm flex items-center gap-3 text-[10px] text-green-700 font-bold uppercase tracking-wider">
                <ShieldCheck size={20} /> Secure Encryption Enabled
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-sm text-xs text-gray-600 space-y-2">
                <p className="font-bold uppercase tracking-wider text-gray-500">Items</p>
                {cartItems.map((item) => {
                  const quantity = item.quantity ?? item.qty ?? 1;
                  return (
                    <div key={item.id} className="flex justify-between gap-4">
                      <span className="line-clamp-1">{String(item.name).toUpperCase()} x{quantity}</span>
                      <span className="font-semibold">
                        {formatCurrency(parsePrice(item.price) * quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0A192F]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
          >
            <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={48} />
            <p className="text-[10px] tracking-[0.5em] uppercase font-bold">
              Processing Secured Payment
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptModal && completedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl bg-white rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="bg-[#0A192F] text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] mb-2">
                    Purchase Confirmed
                  </p>
                  <h2 className="text-2xl font-semibold">Order Receipt</h2>
                </div>
                <button
                  onClick={handleCloseReceipt}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close receipt"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Order ID</p>
                    <p className="font-bold text-[#0A192F]">{completedOrder.orderId}</p>
                  </div>
                  <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Payment Method</p>
                    <p className="font-bold text-[#0A192F]">{formatPaymentLabel(completedOrder.paymentMethod)}</p>
                  </div>
                  <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Order Status</p>
                    <p className="font-bold text-green-700">{completedOrder.status}</p>
                  </div>
                  <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Date</p>
                    <p className="font-bold text-[#0A192F]">
                      {new Date(completedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {(completedOrder.bank || completedOrder.tenure) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {completedOrder.bank && (
                      <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Selected Bank</p>
                        <p className="font-bold text-[#0A192F]">{completedOrder.bank}</p>
                      </div>
                    )}

                    {completedOrder.tenure && (
                      <div className="bg-[#F8F8F8] p-4 rounded-sm border border-gray-200">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">EMI Tenure</p>
                        <p className="font-bold text-[#0A192F]">{completedOrder.tenure} MONTHS</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border border-gray-200 rounded-sm overflow-hidden">
                  <div className="bg-[#F7F7F7] px-4 py-3 border-b border-gray-200">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Purchased Items</p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {completedOrder.items.map((item) => (
                      <div key={item.id} className="px-4 py-4 flex justify-between gap-4 text-sm">
                        <div>
                          <p className="font-bold text-[#0A192F]">{String(item.name).toUpperCase()}</p>
                          <p className="text-gray-500 text-xs">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-[#0A192F]">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FAFAFA] border border-gray-200 rounded-sm p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(completedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-semibold">{formatCurrency(completedOrder.shippingFee)}</span>
                  </div>

                  {completedOrder.paymentMethod === "emi" && completedOrder.emiMonthly && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Approx. EMI / month</span>
                      <span className="font-semibold text-[#D4AF37]">
                        {formatCurrency(completedOrder.emiMonthly)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-[#0A192F]">Total</span>
                    <span className="font-bold text-[#0A192F]">{formatCurrency(completedOrder.total)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex-1 border border-[#0A192F] text-[#0A192F] py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#0A192F] hover:text-white transition-colors"
                  >
                    Download Receipt
                  </button>

                  <button
                    onClick={handleCloseReceipt}
                    className="flex-1 bg-[#0A192F] text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}