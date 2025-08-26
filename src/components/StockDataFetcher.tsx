import React, { useState } from 'react';
import { Search, Calendar, TrendingUp } from 'lucide-react';

interface StockDataFetcherProps {
  onFetchData: (ticker: string, range: string) => void;
  loading: boolean;
  darkMode: boolean;
}

const StockDataFetcher: React.FC<StockDataFetcherProps> = ({ onFetchData, loading, darkMode }) => {
  const [ticker, setTicker] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('1y');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchData(ticker.toUpperCase(), timeRange);
  };

  const popularTickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
  const timeRanges = [
    { value: '1mo', label: '1 Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' }
  ];

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Stock Data Analysis</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stock Ticker</label>
            <div className="relative">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Enter ticker symbol"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Time Range</label>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Popular Tickers</label>
          <div className="flex flex-wrap gap-2">
            {popularTickers.map(symbol => (
              <button
                key={symbol}
                type="button"
                onClick={() => setTicker(symbol)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  ticker === symbol
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>Analyze Stock</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default StockDataFetcher;