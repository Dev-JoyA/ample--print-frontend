'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { productService } from '@/services/productService';

export default function ReorderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;
  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalOrder, setOriginalOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [existingBriefs, setExistingBriefs] = useState({});

  const [designInstructions, setDesignInstructions] = useState({});
  const [logoFiles, setLogoFiles] = useState({});
  const [imageFiles, setImageFiles] = useState({});
  const [voiceNotes, setVoiceNotes] = useState({});
  const [usePrevious, setUsePrevious] = useState({});

  useEffect(() => {
    fetchOriginalOrder();
    fetchProducts();
  }, [orderId]);

  useEffect(() => {
    console.log('Items updated:', items);
  }, [items]);

  const fetchOriginalOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      setOriginalOrder(orderData);

      if (orderData?.items) {
        const editableItems = [];

        for (const item of orderData.items) {
          const productId = item.productId?._id || item.productId;

          let productMinOrder = 1;
          let productDetails = null;
          try {
            const productRes = await productService.getById(productId);
            productDetails = productRes?.product || productRes?.data || productRes;
            productMinOrder = productDetails?.minOrder || 1;
          } catch (err) {
            console.log(`Could not fetch product details for ${productId}`);
          }

          editableItems.push({
            ...item,
            editableQuantity: item.quantity,
            productId: productId,
            productName: item.productName,
            price: item.price,
            selected: true,
            minOrder: productMinOrder,
            productDetails: productDetails,
            isNew: false,
          });

          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(
              orderId,
              productId
            );
            const briefData = briefResponse?.data || briefResponse;
            if (briefData?.customer) {
              setExistingBriefs((prev) => ({
                ...prev,
                [productId]: briefData.customer,
              }));
            }
          } catch (err) {
            console.log(`No brief found for product ${productId}`);
          }
          setUsePrevious((prev) => ({ ...prev, [productId]: false }));
        }

        setItems(editableItems);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productService.getList({ limit: 100 });
      let products = [];
      if (response?.products && Array.isArray(response.products)) {
        products = response.products;
      } else if (Array.isArray(response)) {
        products = response;
      }
      setAvailableProducts(products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const generateBriefDescription = (
    product,
    item,
    quantity,
    customInstructions,
    logos,
    imagery,
    voiceNote
  ) => {
    const productName = product?.name || item?.productName || 'Unknown Product';
    const collectionName = product?.collectionId?.name || item?.collectionId?.name || 'N/A';
    const dimensions =
      product?.dimension?.width && product?.dimension?.height
        ? `${product.dimension.width}mm x ${product.dimension.height}mm`
        : 'Not specified (will use standard)';
    const color = 'Not specified (to be discussed)';
    const productQuantity = quantity || item?.editableQuantity || 1;
    const material = product?.material || item?.material || 'Standard';
    const deliveryDay = product?.deliveryDay || item?.deliveryDay || 'Standard';
    const minOrder = product?.minOrder || item?.minOrder || 1;

    const hasCustomInstructions = customInstructions && customInstructions.trim().length > 0;
    const hasLogos = logos && logos.length > 0;
    const hasImages = imagery && imagery.length > 0;
    const hasVoiceNote = !!voiceNote;

    return `===========================================
PRODUCT CUSTOMIZATION BRIEF
===========================================

PRODUCT INFORMATION:
-------------------
Product Name: ${productName}
Collection: ${collectionName}

CUSTOMER SPECIFICATIONS:
----------------------
• Size/Dimensions: ${dimensions}
• Color: ${color}
• Quantity: ${productQuantity} units
• Material: ${material}

DESIGN INSTRUCTIONS:
-------------------
${hasCustomInstructions ? customInstructions : 'No design instructions provided'}

ADDITIONAL REQUIREMENTS:
-----------------------
${hasLogos ? `• Logo files uploaded: ${logos.length} file(s)` : '• No logo files uploaded'}
${hasImages ? `• Reference images uploaded: ${imagery.length} file(s)` : '• No reference images uploaded'}
${hasVoiceNote ? '• Voice briefing recorded and attached' : '• No voice briefing recorded'}

DELIVERY EXPECTATIONS:
---------------------
Expected Lead Time: ${deliveryDay}
Minimum Order Quantity: ${minOrder} units

SUBMISSION TIMESTAMP:
-------------------
${new Date().toLocaleString()}`;
  };

  const addNewProduct = () => {
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }

    const selectedProduct = availableProducts.find((p) => p._id === selectedProductId);

    if (!selectedProduct) {
      setError('Product not found');
      return;
    }

    const minOrder = selectedProduct.minOrder || 1;

    if (newProductQuantity < minOrder) {
      setError(`Minimum order quantity for ${selectedProduct.name} is ${minOrder}`);
      return;
    }

    const existingItemIndex = items.findIndex((item) => item.productId === selectedProduct._id);
    let updatedItems;

    if (existingItemIndex !== -1) {
      updatedItems = [...items];
      updatedItems[existingItemIndex].editableQuantity += newProductQuantity;
    } else {
      const newItem = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        editableQuantity: newProductQuantity,
        quantity: newProductQuantity,
        selected: true,
        isNew: true,
        minOrder: minOrder,
        productDetails: selectedProduct,
      };
      updatedItems = [...items, newItem];
      setUsePrevious((prev) => ({ ...prev, [selectedProduct._id]: false }));
    }

    setItems(updatedItems);
    setShowAddProduct(false);
    setSelectedProductId('');
    setNewProductQuantity(1);
    setError('');

    console.log('Product added. Total items:', updatedItems.length);
  };

  const updateQuantity = (index, newQuantity) => {
    const item = items[index];
    const minQty = item.minOrder || 1;
    let quantity = parseInt(newQuantity) || minQty;

    if (quantity < minQty) {
      setError(`${item.productName} minimum order quantity is ${minQty}`);
      quantity = minQty;
    } else {
      setError('');
    }

    const updatedItems = [...items];
    updatedItems[index].editableQuantity = quantity;
    setItems(updatedItems);
  };

  const toggleSelectItem = (index) => {
    const updatedItems = [...items];
    updatedItems[index].selected = !updatedItems[index].selected;
    setItems(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleDesignInstructionChange = (productId, value) => {
    setDesignInstructions((prev) => ({ ...prev, [productId]: value }));
  };

  const handleLogoUpload = (productId, files) => {
    setLogoFiles((prev) => ({ ...prev, [productId]: Array.from(files) }));
  };

  const handleImageUpload = (productId, files) => {
    setImageFiles((prev) => ({ ...prev, [productId]: Array.from(files) }));
  };

  const handleVoiceNoteUpload = (productId, file) => {
    setVoiceNotes((prev) => ({ ...prev, [productId]: file }));
  };

  const toggleUsePrevious = (productId) => {
    setUsePrevious((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const removeLogoFile = (productId, index) => {
    setLogoFiles((prev) => ({
      ...prev,
      [productId]: prev[productId].filter((_, i) => i !== index),
    }));
  };

  const removeImageFile = (productId, index) => {
    setImageFiles((prev) => ({
      ...prev,
      [productId]: prev[productId].filter((_, i) => i !== index),
    }));
  };

  const calculateSubtotal = () => {
    return items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.price * item.editableQuantity, 0);
  };

  const submitBriefForItem = async (newOrderId, productId) => {
    const item = items.find((i) => i.productId === productId);
    const product = item?.productDetails || null;
    const isExistingProduct = !item?.isNew;

    const usePrev = usePrevious[productId];
    const existingBrief = existingBriefs[productId];

    const newDescription = designInstructions[productId];
    const newLogos = logoFiles[productId];
    const newImages = imageFiles[productId];
    const newVoiceNote = voiceNotes[productId];

    const hasNewText = newDescription && newDescription.trim().length > 0;
    const hasNewFiles =
      (newLogos && newLogos.length > 0) || (newImages && newImages.length > 0) || newVoiceNote;

    const formData = new FormData();
    let descriptionText = '';

    if (usePrev && existingBrief && isExistingProduct) {
      descriptionText = existingBrief.description;
      formData.append('description', descriptionText);
    } else if (hasNewText || hasNewFiles) {
      descriptionText = generateBriefDescription(
        product,
        item,
        item?.editableQuantity,
        newDescription,
        newLogos,
        newImages,
        newVoiceNote
      );
      formData.append('description', descriptionText);

      if (newLogos && newLogos.length) {
        newLogos.forEach((file) => formData.append('logo', file));
      }
      if (newImages && newImages.length) {
        newImages.forEach((file) => formData.append('image', file));
      }
      if (newVoiceNote) {
        formData.append('voiceNote', newVoiceNote);
      }
    } else {
      if (isExistingProduct && existingBrief) {
        descriptionText = existingBrief.description;
      } else {
        descriptionText = generateBriefDescription(
          product,
          item,
          item?.editableQuantity,
          null,
          null,
          null,
          null
        );
      }
      formData.append('description', descriptionText);
    }

    await customerBriefService.submit(newOrderId, productId, formData);
  };

  const handleSubmit = async () => {
    const selectedItems = items.filter((item) => item.selected);

    console.log('Selected items for order:', selectedItems);

    if (selectedItems.length === 0) {
      setError('Please select at least one item to order');
      return;
    }

    for (const item of selectedItems) {
      const minQty = item.minOrder || 1;
      if (item.editableQuantity < minQty) {
        setError(`${item.productName} minimum order quantity is ${minQty}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      const orderData = {
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.editableQuantity,
        })),
      };

      console.log('Creating order with data:', orderData);

      const response = await orderService.create(orderData);
      const newOrderId = response?.order?._id || response?.data?._id || response?._id;

      if (!newOrderId) {
        throw new Error('Failed to create order');
      }

      console.log('New order created:', newOrderId);

      for (const item of selectedItems) {
        console.log('Submitting brief for product:', item.productId, 'isNew:', item.isNew);
        await submitBriefForItem(newOrderId, item.productId);
      }

      router.push(`/orders/summary?orderId=${newOrderId}`);
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Reorder Items"
        description="Review and edit your order before placing"
        robots="noindex, nofollow"
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Reorder Items</h1>
            <p className="mt-1 text-sm text-gray-400">
              Review and edit items from order #{originalOrder?.orderNumber}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowAddProduct(true)} icon="+">
              Add Product
            </Button>
          </div>

          {showAddProduct && (
            <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add New Product</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Select Product</label>
                  {loadingProducts ? (
                    <div className="py-2 text-center text-gray-400">Loading products...</div>
                  ) : (
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select a product --</option>
                      {availableProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - {formatCurrency(product.price)} (MOQ:{' '}
                          {product.minOrder || 1})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                    className="w-32 rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-white"
                  />
                  {selectedProductId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum order:{' '}
                      {availableProducts.find((p) => p._id === selectedProductId)?.minOrder || 1}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addNewProduct}
                    disabled={!selectedProductId}
                  >
                    Add to Order
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowAddProduct(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelectItem(index)}
                      className="mt-1 h-5 w-5 rounded border-gray-700 bg-slate-800"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <h3 className="font-semibold text-white">
                          {item.productName}
                          {item.isNew && <span className="ml-2 text-xs text-green-400">(New)</span>}
                        </h3>
                        <p className="font-bold text-primary">
                          {formatCurrency(item.price * item.editableQuantity)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">{formatCurrency(item.price)} each</p>
                      <p className="text-xs text-gray-500">Minimum: {item.minOrder || 1} units</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">Qty:</label>
                          <input
                            type="number"
                            min={item.minOrder || 1}
                            value={item.editableQuantity}
                            onChange={(e) => updateQuantity(index, e.target.value)}
                            className="w-20 rounded-lg border border-gray-700 bg-slate-800 px-2 py-1 text-center text-white"
                            disabled={!item.selected}
                          />
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                          className="text-sm text-primary hover:text-primary-dark"
                        >
                          {expandedItem === index ? 'Hide' : 'Customize'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedItem === index && (
                  <div className="border-t border-gray-800 bg-slate-800/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Customization</h4>
                      {existingBriefs[item.productId] && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={usePrevious[item.productId] || false}
                            onChange={() => toggleUsePrevious(item.productId)}
                            className="h-4 w-4 rounded border-gray-700"
                          />
                          <span className="text-gray-400">Use previous</span>
                        </label>
                      )}
                    </div>

                    {!usePrevious[item.productId] ? (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm text-gray-400">
                            Instructions <span className="text-gray-500">(optional)</span>
                          </label>
                          <Textarea
                            value={designInstructions[item.productId] || ''}
                            onChange={(e) =>
                              handleDesignInstructionChange(item.productId, e.target.value)
                            }
                            placeholder="Describe your design requirements..."
                            rows={3}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-gray-400">Logo</label>
                          <input
                            type="file"
                            accept="image/*,.svg,.pdf"
                            multiple
                            onChange={(e) => handleLogoUpload(item.productId, e.target.files)}
                            className="w-full text-sm text-gray-400 file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white"
                          />
                          {logoFiles[item.productId]?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {logoFiles[item.productId].map((file, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs"
                                >
                                  <span>{file.name}</span>
                                  <button
                                    onClick={() => removeLogoFile(item.productId, i)}
                                    className="text-red-400"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-gray-400">
                            Reference Images
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(item.productId, e.target.files)}
                            className="w-full text-sm text-gray-400 file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white"
                          />
                          {imageFiles[item.productId]?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {imageFiles[item.productId].map((file, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs"
                                >
                                  <span>{file.name}</span>
                                  <button
                                    onClick={() => removeImageFile(item.productId, i)}
                                    className="text-red-400"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-gray-400">Voice Note</label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) =>
                              handleVoiceNoteUpload(item.productId, e.target.files[0])
                            }
                            className="w-full text-sm text-gray-400 file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white"
                          />
                          {voiceNotes[item.productId] && (
                            <p className="mt-1 text-xs text-green-400">✓ Voice note added</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm italic text-gray-500">
                        Using previous customization from your past order.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center">
              <p className="text-gray-400">No items in this order</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddProduct(true)}
                className="mt-4"
              >
                Add Products
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-800 bg-slate-900/50 p-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Subtotal:</span>
                <span className="font-bold text-white">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting || items.filter((i) => i.selected).length === 0}
                  className="flex-1"
                >
                  {submitting ? 'Creating...' : 'Place Order'}
                </Button>
                <Button variant="secondary" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
