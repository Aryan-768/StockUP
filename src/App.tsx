import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Settings, Download, AlertTriangle } from 'lucide-react';
import StockDataFetcher from './components/StockDataFetcher';
import Chart from './components/Chart';
import ModelComparison from './components/ModelComparison';
import TradingSignals from './components/TradingSignals';
import MetricsPanel from './components/MetricsPanel';
import AnomalyDetector from './components/AnomalyDetector';
import { StockData, ForecastModel, TradingSignal, Anomaly } from './types';
import { fetchStockData, generateForecasts, detectAnomalies, generateTradingSignals, fetchIntradayData } from './utils/stockAnalysis';
import IntradayAnalysis from './components/IntradayAnalysis';

function App() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [forecasts, setForecasts] = useState<ForecastModel[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('1y');
  const [darkMode, setDarkMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [intradayData, setIntradayData] = useState<any>(null);
  const [intradayInterval, setIntradayInterval] = useState(5);
  const [maWindow, setMaWindow] = useState(3);

  const handleFetchData = async (ticker: string, range: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchStockData(ticker, range);
      setStockData(data);
      setSelectedTicker(ticker);
      setTimeRange(range);
      
      // Generate forecasts
      const forecastResults = await generateForecasts(data);
      setForecasts(forecastResults);
      
      // Detect anomalies
      const anomalyResults = detectAnomalies(data);
      setAnomalies(anomalyResults);
      
      // Generate trading signals
      const signals = generateTradingSignals(data, forecastResults);
      setTradingSignals(signals);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const downloadForecastData = () => {
    if (!forecasts.length) return;
    
    const csv = forecasts.map(forecast => 
      forecast.predictions.map(pred => 
        `${forecast.name},${pred.date},${pred.value.toFixed(2)}`
      ).join('\n')
    ).join('\n');
    
    const blob = new Blob([`Model,Date,Predicted_Price\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTicker}_forecast_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdvancedAnalysis = async () => {
    setShowAdvanced(true);
    setLoading(true);
    
    try {
      // Simulate fetching intraday data
      const data = await fetchIntradayData(selectedTicker, intradayInterval, maWindow);
      setIntradayData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch intraday data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data
    handleFetchData('AAPL', '1y');
  }, []);

  const currentPrice = stockData?.prices[stockData.prices.length - 1]?.close || 0;
  const previousPrice = stockData?.prices[stockData.prices.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold">Stock Market Analyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={downloadForecastData}
                disabled={!forecasts.length}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Forecast</span>
              </button>
              <button
                onClick={handleAdvancedAnalysis}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Advanced Analysis</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Data Fetcher */}
        <div className="mb-8">
          <StockDataFetcher 
            onFetchData={handleFetchData} 
            loading={loading}
            darkMode={darkMode}
          />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {stockData && (
          <>
            {/* Current Price Display */}
            <div className={`mb-8 p-6 rounded-lg shadow-sm ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{selectedTicker}</h2>
                  <p className="text-2xl font-semibold">${currentPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center ${
                    priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChange >= 0 ? (
                      <TrendingUp className="h-5 w-5 mr-1" />
                    ) : (
                      <TrendingDown className="h-5 w-5 mr-1" />
                    )}
                    <span className="font-semibold">
                      {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Since yesterday</p>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="mb-8">
              <Chart 
                stockData={stockData} 
                forecasts={forecasts}
                anomalies={anomalies}
                darkMode={darkMode}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Trading Signals */}
              <div className="lg:col-span-1">
                <TradingSignals 
                  signals={tradingSignals} 
                  darkMode={darkMode}
                />
              </div>
              
              {/* Metrics Panel */}
              <div className="lg:col-span-1">
                <MetricsPanel 
                  forecasts={forecasts} 
                  stockData={stockData}
                  darkMode={darkMode}
                />
              </div>
              
              {/* Anomaly Detection */}
              <div className="lg:col-span-1">
                <AnomalyDetector 
                  anomalies={anomalies} 
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Model Comparison */}
            <div className="mb-8">
              <ModelComparison 
                forecasts={forecasts} 
                stockData={stockData}
                darkMode={darkMode}
              />
            </div>
          </>
        )}

        {/* Advanced Intraday Analysis Modal/Section */}
        {showAdvanced && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
              <div className={`sticky top-0 p-6 border-b ${
                darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Advanced Intraday Analysis - {selectedTicker}</h2>
                  <button
                    onClick={() => setShowAdvanced(false)}
                    className={`p-2 rounded-lg ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Advanced Controls */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Interval (minutes)</label>
                    <select
                      value={intradayInterval}
                      onChange={(e) => setIntradayInterval(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value={1}>1 minute</option>
                      <option value={2}>2 minutes</option>
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Moving Average Window</label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={maWindow}
                      onChange={(e) => setMaWindow(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleAdvancedAnalysis}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {intradayData ? (
                  <IntradayAnalysis data={intradayData} darkMode={darkMode} />
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading intraday analysis...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;