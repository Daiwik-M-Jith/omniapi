'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Check {
  id: string;
  status: string;
  responseTime: number | null;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
}

interface Api {
  id: string;
  name: string;
  url: string;
  method: string;
  description: string | null;
  category: string | null;
  createdAt: string;
  checks: Check[];
}

export default function ApiDetails() {
  const params = useParams();
  const router = useRouter();
  const [api, setApi] = useState<Api | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi();
    const interval = setInterval(fetchApi, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchApi = async () => {
    try {
      const res = await fetch(`/api/apis/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setApi(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch API:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApi = async () => {
    try {
      await fetch(`/api/apis/${params.id}/check`, { method: 'POST' });
      fetchApi();
    } catch (error) {
      console.error('Failed to check API:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!api) {
    return null;
  }

  const last24Hours = api.checks.filter(
    (c) => new Date(c.checkedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const uptime = last24Hours.length > 0
    ? (last24Hours.filter((c) => c.status === 'online').length / last24Hours.length) * 100
    : 0;
  const avgResponseTime = last24Hours.length > 0
    ? last24Hours.reduce((sum, c) => sum + (c.responseTime || 0), 0) / last24Hours.length
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-emerald-400';
      case 'slow':
        return 'text-amber-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500/20';
      case 'slow':
        return 'bg-amber-500/20';
      case 'offline':
        return 'bg-red-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{api.name}</h1>
              {api.category && (
                <span className="text-sm px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                  {api.category}
                </span>
              )}
            </div>
            <button
              onClick={checkApi}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              Check Now
            </button>
          </div>

          <div className="space-y-3 text-gray-300 mb-6">
            <div>
              <span className="text-gray-400">URL:</span>{' '}
              <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 break-all">
                {api.url}
              </a>
            </div>
            <div>
              <span className="text-gray-400">Method:</span> {api.method}
            </div>
            {api.description && (
              <div>
                <span className="text-gray-400">Description:</span> {api.description}
              </div>
            )}
            <div>
              <span className="text-gray-400">Created:</span> {new Date(api.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">24h Uptime</div>
              <div className="text-4xl font-bold text-emerald-400">{uptime.toFixed(2)}%</div>
            </div>
            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Avg Response Time</div>
              <div className="text-4xl font-bold text-white">{Math.round(avgResponseTime)}ms</div>
            </div>
            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total Checks</div>
              <div className="text-4xl font-bold text-white">{api.checks.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Check History</h2>
          <div className="space-y-3">
            {api.checks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No checks yet</p>
            ) : (
              api.checks.map((check) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${getStatusBg(check.status)} border border-white/10`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-sm font-semibold uppercase ${getStatusColor(check.status)}`}>
                      {check.status}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(check.checkedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {check.responseTime && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Response:</span> {check.responseTime}ms
                      </div>
                    )}
                    {check.statusCode && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Status:</span> {check.statusCode}
                      </div>
                    )}
                    {check.error && (
                      <div className="text-red-400">
                        <span className="text-gray-400">Error:</span> {check.error}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
