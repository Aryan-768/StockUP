import React from 'react';
import { Anomaly } from '../types';
import { AlertTriangle, Activity, TrendingUp, BarChart3 } from 'lucide-react';

interface AnomalyDetectorProps {
  anomalies: Anomaly[];
  darkMode: boolean;
}

const AnomalyDetector: React.FC<AnomalyDetectorProps> = ({ anomalies, darkMode }) => {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'price_spike':
        return <TrendingUp className="h-5 w-5" />;
      case 'volume_spike':
        return <BarChart3 className="h-5 w-5" />;
      case 'trend_reversal':
        return <Activity className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityColorDark = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-900/20 border-red-800';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'low':
        return 'text-green-400 bg-green-900/20 border-green-800';
      default:
        return 'text-gray-400 bg-gray-800/20 border-gray-700';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const anomalyTypeCounts = anomalies.reduce((counts, anomaly) => {
    counts[anomaly.type] = (counts[anomaly.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const severityCounts = anomalies.reduce((counts, anomaly) => {
    counts[anomaly.severity] = (counts[anomaly.severity] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center mb-6">
        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Anomaly Detection</h3>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No anomalies detected</p>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-3 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-blue-600">
                {anomalies.length}
              </div>
              <div className="text-sm text-gray-500">Total Anomalies</div>
            </div>
            <div className={`p-3 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-red-600">
                {severityCounts.high || 0}
              </div>
              <div className="text-sm text-gray-500">High Severity</div>
            </div>
          </div>

          {/* Anomaly Type Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Anomaly Types</h4>
            <div className="space-y-2">
              {Object.entries(anomalyTypeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getAnomalyIcon(type)}
                    <span className="ml-2 text-sm capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-12 h-2 rounded-full mr-2 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(count / anomalies.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-mono">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Anomalies */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Recent Anomalies</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    darkMode ? getSeverityColorDark(anomaly.severity) : getSeverityColor(anomaly.severity)
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getAnomalyIcon(anomaly.type)}
                      <span className="ml-2 text-sm font-medium capitalize">
                        {anomaly.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getSeverityDot(anomaly.severity)}`}></div>
                      <span className="text-xs font-medium uppercase">
                        {anomaly.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{anomaly.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </span>
                    <span className="font-mono">
                      Value: {anomaly.value.toFixed(2)} (Threshold: {anomaly.threshold.toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnomalyDetector;