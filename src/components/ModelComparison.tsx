import React from 'react';
import { ForecastModel, StockData } from '../types';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface ModelComparisonProps {
  forecasts: ForecastModel[];
  stockData: StockData;
  darkMode: boolean;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ forecasts, stockData, darkMode }) => {
  const getModelIcon = (type: string) => {
    switch (type) {
      case 'moving_average':
        return <TrendingUp className="h-5 w-5" />;
      case 'linear_regression':
        return <BarChart3 className="h-5 w-5" />;
      case 'arima':
        return <Activity className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getModelColor = (index: number) => {
    const colors = ['bg-green-600', 'bg-yellow-600', 'bg-red-600', 'bg-purple-600'];
    return colors[index % colors.length];
  };

  const bestModel = forecasts.reduce((best, current) => 
    current.metrics.rmse < best.metrics.rmse ? current : best
  , forecasts[0]);

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center mb-6">
        <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Model Performance Comparison</h3>
      </div>

      {forecasts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No forecast models available</p>
        </div>
      ) : (
        <>
          {/* Best Model Highlight */}
          <div className={`mb-6 p-4 rounded-lg ${
            darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center mb-2">
              <div className="flex items-center text-green-600 mr-2">
                {getModelIcon(bestModel.type)}
              </div>
              <span className="font-semibold text-green-600">Best Performing Model</span>
            </div>
            <p className="text-lg font-bold">{bestModel.name}</p>
            <p className="text-sm text-gray-600">RMSE: {bestModel.metrics.rmse.toFixed(4)}</p>
          </div>

          {/* Model Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-4 font-semibold">Model</th>
                  <th className="text-right py-3 px-4 font-semibold">RMSE</th>
                  <th className="text-right py-3 px-4 font-semibold">MAE</th>
                  <th className="text-right py-3 px-4 font-semibold">MAPE (%)</th>
                  <th className="text-right py-3 px-4 font-semibold">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((model, index) => {
                  const nextDayForecast = model.predictions[0]?.value || 0;
                  const currentPrice = stockData.prices[stockData.prices.length - 1]?.close || 0;
                  const priceChange = ((nextDayForecast - currentPrice) / currentPrice) * 100;
                  
                  return (
                    <tr key={model.name} className={`border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    } hover:${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded mr-3 ${getModelColor(index)}`}></div>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {model.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {model.metrics.rmse.toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {model.metrics.mae.toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {model.metrics.mape.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="font-mono">${nextDayForecast.toFixed(2)}</div>
                        <div className={`text-sm ${
                          priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Model Accuracy Visualization */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-4">Model Accuracy (Lower RMSE = Better)</h4>
            <div className="space-y-3">
              {forecasts.map((model, index) => {
                const maxRMSE = Math.max(...forecasts.map(f => f.metrics.rmse));
                const accuracy = ((maxRMSE - model.metrics.rmse) / maxRMSE) * 100;
                
                return (
                  <div key={model.name} className="flex items-center">
                    <div className="w-24 text-sm font-medium truncate">{model.name}</div>
                    <div className="flex-1 mx-4">
                      <div className={`h-6 rounded-full ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${getModelColor(index)} transition-all duration-300`}
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm font-mono">{accuracy.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelComparison;