'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ApiStatus {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  status: 'online' | 'slow' | 'offline' | 'unknown';
  uptime24h: number;
  avgResponseTime: number;
  lastCheck: {
    checkedAt: string;
    responseTime: number | null;
    sslDaysRemaining: number | null;
  } | null;
  recentIncidents: Array<{
    id: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
  }>;
}

export default function PublicStatusPage() {
  const params = useParams();
  const id = params?.slug as string;
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/status/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('API not found or not public');
        } else {
          setError('Failed to fetch status');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setApiStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' };
      case 'slow':
        return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' };
      case 'offline':
        return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'online':
        return 'All Systems Operational';
      case 'slow':
        return 'Performance Degraded';
      case 'offline':
        return 'Service Unavailable';
      default:
        return 'Status Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error || !apiStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">{error || 'Not Found'}</h1>
          <p className="text-gray-400">This API status page is not available or doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const statusColors = getStatusColor(apiStatus.status);
  const openIncidents = apiStatus.recentIncidents.filter(i => i.status === 'open');
  const recentResolvedIncidents = apiStatus.recentIncidents
    .filter(i => i.status === 'resolved')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {apiStatus.name}
              </h1>
              <p className="text-gray-400">{apiStatus.description || apiStatus.url}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border ${statusColors.border}`}>
                <div className={`w-3 h-3 rounded-full ${statusColors.bg} animate-pulse`}></div>
                <span className={`font-semibold ${statusColors.text}`}>
                  {getStatusMessage(apiStatus.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Current Status Banner */}
        {openIncidents.length > 0 && (
          <div className="mb-8 bg-red-500/10 backdrop-blur-sm border border-red-500/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">🚨 Active Incident</h2>
            <p className="text-gray-300">
              Service is currently experiencing issues. Started{' '}
              {new Date(openIncidents[0].startedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Current Status</div>
            <div className={`text-2xl font-bold ${statusColors.text} capitalize`}>
              {apiStatus.status}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">24h Uptime</div>
            <div className={`text-2xl font-bold ${
              apiStatus.uptime24h >= 99 ? 'text-emerald-400' : 
              apiStatus.uptime24h >= 95 ? 'text-amber-400' : 
              'text-red-400'
            }`}>
              {apiStatus.uptime24h.toFixed(2)}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold text-white">
              {apiStatus.avgResponseTime}ms
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">
              {apiStatus.lastCheck?.sslDaysRemaining !== null && apiStatus.lastCheck?.sslDaysRemaining !== undefined
                ? 'SSL Certificate'
                : 'Last Checked'}
            </div>
            <div className={`text-2xl font-bold ${
              apiStatus.lastCheck?.sslDaysRemaining !== null && apiStatus.lastCheck?.sslDaysRemaining !== undefined
                ? apiStatus.lastCheck.sslDaysRemaining < 30 ? 'text-amber-400' : 'text-emerald-400'
                : 'text-white'
            }`}>
              {apiStatus.lastCheck?.sslDaysRemaining !== null && apiStatus.lastCheck?.sslDaysRemaining !== undefined
                ? `${apiStatus.lastCheck.sslDaysRemaining} days`
                : apiStatus.lastCheck
                ? new Date(apiStatus.lastCheck.checkedAt).toLocaleTimeString()
                : 'Never'}
            </div>
          </div>
        </div>

        {/* API Information */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">API Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Endpoint:</span>{' '}
              <span className="text-white break-all">{apiStatus.url}</span>
            </div>
            {apiStatus.category && (
              <div>
                <span className="text-gray-400">Category:</span>{' '}
                <span className="text-white">{apiStatus.category}</span>
              </div>
            )}
            {apiStatus.lastCheck && (
              <>
                <div>
                  <span className="text-gray-400">Last Response Time:</span>{' '}
                  <span className="text-white">
                    {apiStatus.lastCheck.responseTime !== null 
                      ? `${apiStatus.lastCheck.responseTime}ms` 
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Last Checked:</span>{' '}
                  <span className="text-white">
                    {new Date(apiStatus.lastCheck.checkedAt).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        {(openIncidents.length > 0 || recentResolvedIncidents.length > 0) && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Incidents</h2>
            <div className="space-y-3">
              {openIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500/20 text-red-300">
                      ONGOING
                    </span>
                    <span className="text-gray-400 text-sm">
                      Started {new Date(incident.startedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white">Service is currently experiencing issues.</p>
                </div>
              ))}
              {recentResolvedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-300">
                      RESOLVED
                    </span>
                    <span className="text-gray-400 text-sm">
                      {incident.endedAt && (
                        <>
                          Duration:{' '}
                          {Math.round(
                            (new Date(incident.endedAt).getTime() -
                              new Date(incident.startedAt).getTime()) /
                              60000
                          )}{' '}
                          minutes
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {new Date(incident.startedAt).toLocaleString()} -{' '}
                    {incident.endedAt && new Date(incident.endedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Status Badge</h2>
          <p className="text-gray-400 mb-4">
            Embed this badge in your README or website to show real-time status:
          </p>
          <div className="flex items-center gap-4">
            <img
              src={`/api/status/${id}?badge=true`}
              alt={`${apiStatus.name} Status`}
              className="h-6"
            />
            <code className="flex-1 px-4 py-2 bg-black/30 text-gray-300 rounded text-sm overflow-x-auto">
              {`![${apiStatus.name} Status](${typeof window !== 'undefined' ? window.location.origin : ''}/api/status/${id}?badge=true)`}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Powered by OmniAPI • Updates every 60 seconds</p>
        </div>
      </div>
    </div>
  );
}
