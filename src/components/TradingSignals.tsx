import React from 'react';
import { TradingSignal } from '../types';
import { TrendingUp, TrendingDown, Minus, Target, Shield } from 'lucide-react';

interface TradingSignalsProps {
  signals: TradingSignal[];
  darkMode: boolean;
}

const TradingSignals: React.FC<TradingSignalsProps> = ({ signals, darkMode }) => {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-5 w-5" />;
      case 'sell':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'sell':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSignalColorDark = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-400 bg-green-900/20 border-green-800';
      case 'sell':
        return 'text-red-400 bg-red-900/20 border-red-800';
      default:
        return 'text-gray-400 bg-gray-800/20 border-gray-700';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-600';
    if (strength >= 0.6) return 'bg-yellow-600';
    if (strength >= 0.4) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center mb-6">
        <Target className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Trading Signals</h3>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No trading signals available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                darkMode ? getSignalColorDark(signal.type) : getSignalColor(signal.type)
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getSignalIcon(signal.type)}
                  <span className="ml-2 font-semibold uppercase text-sm">
                    {signal.type}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-2">Strength:</span>
                  <div className={`w-12 h-2 rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className={`h-full rounded-full ${getStrengthColor(signal.strength)}`}
                      style={{ width: `${signal.strength * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm ml-2 font-mono">
                    {(signal.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <p className="text-sm mb-3">{signal.reason}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(signal.timestamp).toLocaleString()}
                </span>
                <div className="flex items-center space-x-4">
                  {signal.targetPrice && (
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>Target: ${signal.targetPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {signal.stopLoss && (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Stop: ${signal.stopLoss.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradingSignals;