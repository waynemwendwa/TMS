'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/config';
import Link from 'next/link';

interface SupplierComparison {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  isRecommended: boolean;
  remarks?: string;
  metrics: {
    totalQuotes: number;
    totalMarketItems: number;
    totalProcurementItems: number;
    avgQuoteAmount: number;
    avgMarketPrice: number;
    priceCompetitiveness: number;
    responseRate: number;
    overallScore: number;
  };
  quotes: Array<{
    id: string;
    quoteNumber: string;
    totalAmount: number;
    status: string;
    validUntil: string;
    submittedAt: string;
  }>;
  lastActivity: string;
}

interface ComparisonSummary {
  avgRating: number;
  avgPriceCompetitiveness: number;
  avgResponseRate: number;
  recommendedCount: number;
}

export default function SupplierComparisonPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [comparison, setComparison] = useState<SupplierComparison[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'response' | 'score'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('getApiUrl('/api')/suppliers/products');
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSupplierComparison = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProduct) params.append('product', selectedProduct);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);

      const response = await fetch(
        `getApiUrl('/api')/suppliers/comparison?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setComparison(data.comparison);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching supplier comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct || (priceRange.min && priceRange.max)) {
      fetchSupplierComparison();
    }
  }, [selectedProduct, priceRange, sortBy, sortOrder, fetchSupplierComparison]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };


  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading supplier comparison...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Comparison</h1>
        <Link
          href="/suppliers"
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Suppliers
        </Link>
      </div>

      {/* Product and Price Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a product</option>
              {availableProducts.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (KES):</label>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (KES):</label>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000000"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSelectedProduct('');
              setPriceRange({ min: '', max: '' });
              setComparison([]);
              setSummary(null);
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {!selectedProduct && !priceRange.min && !priceRange.max ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Product or Price Range</h2>
          <p className="text-gray-600">Choose a product or set a price range to view supplier comparison</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-blue-600">{summary.avgRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(summary.avgPriceCompetitiveness)}
                </div>
                <div className="text-sm text-gray-600">Price Competitiveness</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercentage(summary.avgResponseRate)}
                </div>
                <div className="text-sm text-gray-600">Response Rate</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-2xl font-bold text-orange-600">{summary.recommendedCount}</div>
                <div className="text-sm text-gray-600">Recommended</div>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'rating' | 'price' | 'response')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Overall Score</option>
                <option value="rating">Rating</option>
                <option value="price">Price Competitiveness</option>
                <option value="response">Response Rate</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Supplier Comparison Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Supplier Comparison</h2>
            </div>
            
            {comparison.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No suppliers found for this project</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price Competitiveness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quotes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparison.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.email}</div>
                            <div className="text-sm text-gray-500">{supplier.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(supplier.rating)}`}>
                            {supplier.rating}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getScoreColor(supplier.metrics.overallScore)}`}>
                            {supplier.metrics.overallScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(supplier.metrics.priceCompetitiveness)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(supplier.metrics.responseRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier.metrics.totalQuotes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {supplier.isRecommended ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Recommended
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Under Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            View Details
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            {supplier.isRecommended ? 'Unrecommend' : 'Recommend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}














