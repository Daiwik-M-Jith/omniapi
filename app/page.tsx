'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Api {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  uptime: number;
  avgResponseTime: number;
  isPublic: boolean;
  sslCheckEnabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  lastCheck: {
    status: string;
    responseTime: number | null;
    checkedAt: string;
    sslDaysRemaining: number | null;
  } | null;
}

interface Incident {
  id: string;
  apiId: string;
  api: { name: string };
  status: string;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
}

interface Webhook {
  id: string;
  apiId: string;
  type: 'webhook' | 'slack' | 'discord' | 'email';
  url: string | null;
  email: string | null;
  isActive: boolean;
  events: string[];
}

type Tab = 'apis' | 'incidents' | 'webhooks';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('apis');
  const [apis, setApis] = useState<Api[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedApiForWebhooks, setSelectedApiForWebhooks] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedApi, setSelectedApi] = useState<Api | null>(null);
  const [newApi, setNewApi] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    isPublic: false,
    sslCheckEnabled: true,
    intervalSeconds: 300,
    timeoutMs: 10000,
    expectedStatus: '200',
  });
  const [newWebhook, setNewWebhook] = useState({
    type: 'webhook' as 'webhook' | 'slack' | 'discord' | 'email',
    url: '',
    email: '',
    events: ['statusChange'] as string[],
  });

  useEffect(() => {
    fetchApis();
    const interval = setInterval(fetchApis, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'incidents' && apis.length > 0) {
      fetchAllIncidents();
    }
  }, [activeTab, apis]);

  const fetchApis = async () => {
    try {
      const res = await fetch('/api/apis');
      const data = await res.json();
      setApis(data);
    } catch (error) {
      console.error('Failed to fetch APIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllIncidents = async () => {
    try {
      const allIncidents: Incident[] = [];
      for (const api of apis) {
        const res = await fetch(`/api/apis/${api.id}/incidents`);
        const data = await res.json();
        allIncidents.push(...data);
      }
      setIncidents(allIncidents.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  const fetchWebhooks = async (apiId: string) => {
    try {
      const res = await fetch(`/api/apis/${apiId}/webhooks`);
      const data = await res.json();
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  const checkApi = async (id: string) => {
    try {
      await fetch(`/api/apis/${id}/check`, { method: 'POST' });
      fetchApis();
    } catch (error) {
      console.error('Failed to check API:', error);
    }
  };

  const checkAllApis = async () => {
    try {
      await fetch('/api/check-all', { method: 'POST' });
      fetchApis();
    } catch (error) {
      console.error('Failed to check all APIs:', error);
    }
  };

  const addApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApi),
      });
      setNewApi({
        name: '',
        url: '',
        description: '',
        category: '',
        isPublic: false,
        sslCheckEnabled: true,
        intervalSeconds: 300,
        timeoutMs: 10000,
        expectedStatus: '200',
      });
      setShowAddModal(false);
      fetchApis();
    } catch (error) {
      console.error('Failed to add API:', error);
    }
  };

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApiForWebhooks) return;
    try {
      await fetch(`/api/apis/${selectedApiForWebhooks}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });
      setNewWebhook({
        type: 'webhook',
        url: '',
        email: '',
        events: ['statusChange'],
      });
      setShowWebhookModal(false);
      fetchWebhooks(selectedApiForWebhooks);
    } catch (error) {
      console.error('Failed to add webhook:', error);
    }
  };

  const deleteApi = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API?')) return;
    try {
      await fetch(`/api/apis/${id}`, { method: 'DELETE' });
      fetchApis();
    } catch (error) {
      console.error('Failed to delete API:', error);
    }
  };

  const deleteWebhook = async (apiId: string, webhookId: string) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await fetch(`/api/apis/${apiId}/webhooks/${webhookId}`, { method: 'DELETE' });
      fetchWebhooks(apiId);
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'slow':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-emerald-600';
    if (uptime >= 95) return 'text-amber-600';
    return 'text-red-600';
  };

  const openWebhooksForApi = (apiId: string) => {
    setSelectedApiForWebhooks(apiId);
    fetchWebhooks(apiId);
    setActiveTab('webhooks');
  };

  const openSettingsForApi = (api: Api) => {
    setSelectedApi(api);
    setShowSettingsModal(true);
  };

  const updateApiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApi) return;
    try {
      await fetch(`/api/apis/${selectedApi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intervalSeconds: selectedApi.intervalSeconds,
          timeoutMs: selectedApi.timeoutMs,
          sslCheckEnabled: selectedApi.sslCheckEnabled,
          isPublic: selectedApi.isPublic,
        }),
      });
      setShowSettingsModal(false);
      fetchApis();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const openIncidents = async (apiId: string) => {
    setSelectedApiForWebhooks(apiId);
    const res = await fetch(`/api/apis/${apiId}/incidents`);
    const data = await res.json();
    setIncidents(data);
    setActiveTab('incidents');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              OmniAPI
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Enterprise API monitoring with webhooks, incidents & SSL tracking
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                + Add New API
              </button>
              <button
                onClick={checkAllApis}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
              >
                Check All APIs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('apis')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'apis'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            APIs ({apis.length})
          </button>
          <button
            onClick={() => { setActiveTab('incidents'); fetchAllIncidents(); }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'incidents'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Incidents ({incidents.filter(i => i.status === 'open').length} open)
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'webhooks'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Webhooks
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* APIs Tab */}
        {activeTab === 'apis' && (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-gray-400 text-sm mb-1">Total APIs</div>
                <div className="text-3xl font-bold text-white">{apis.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-gray-400 text-sm mb-1">Online</div>
                <div className="text-3xl font-bold text-emerald-400">
                  {apis.filter(a => a.lastCheck?.status === 'online').length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-gray-400 text-sm mb-1">SSL Expiring</div>
                <div className="text-3xl font-bold text-amber-400">
                  {apis.filter(a => a.lastCheck?.sslDaysRemaining && a.lastCheck.sslDaysRemaining < 30).length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-gray-400 text-sm mb-1">Offline</div>
                <div className="text-3xl font-bold text-red-400">
                  {apis.filter(a => a.lastCheck?.status === 'offline').length}
                </div>
              </div>
            </div>

            {/* APIs Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 mt-4">Loading APIs...</p>
              </div>
            ) : apis.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-400 text-lg">No APIs monitored yet. Add your first API to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {apis.map((api) => (
                  <div
                    key={api.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(api.lastCheck?.status)} animate-pulse`}></div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{api.name}</h3>
                          <div className="flex gap-2 mt-1">
                            {api.category && (
                              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                {api.category}
                              </span>
                            )}
                            {api.isPublic && (
                              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                Public
                              </span>
                            )}
                            {api.sslCheckEnabled && (
                              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                                🔒 SSL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteApi(api.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-gray-400 text-sm mb-3 break-all">{api.url}</p>
                    {api.description && (
                      <p className="text-gray-300 text-sm mb-4">{api.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Uptime (24h)</div>
                        <div className={`text-2xl font-bold ${getUptimeColor(api.uptime)}`}>
                          {api.uptime.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Avg Response</div>
                        <div className="text-2xl font-bold text-white">
                          {api.avgResponseTime}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">
                          {api.lastCheck?.sslDaysRemaining ? 'SSL Days' : 'Last Check'}
                        </div>
                        <div className="text-sm text-gray-300">
                          {api.lastCheck?.sslDaysRemaining !== null && api.lastCheck?.sslDaysRemaining !== undefined
                            ? `${api.lastCheck.sslDaysRemaining} days`
                            : api.lastCheck
                            ? new Date(api.lastCheck.checkedAt).toLocaleTimeString()
                            : 'Never'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => checkApi(api.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-sm"
                      >
                        Check Now
                      </button>
                      <Link
                        href={`/api/${api.id}`}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-sm border border-white/20 text-center"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => openWebhooksForApi(api.id)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-sm border border-white/20"
                        title="Webhooks"
                      >
                        🔔
                      </button>
                      <button
                        onClick={() => openSettingsForApi(api)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-sm border border-white/20"
                        title="Settings"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => openIncidents(api.id)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-sm border border-white/20"
                        title="Incidents"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-gray-400 text-lg">No incidents recorded. All systems operational!</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border ${
                    incident.status === 'open' ? 'border-red-500/50' : 'border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            incident.status === 'open'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {incident.status.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-semibold text-white">{incident.api.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Started:</span>{' '}
                          <span className="text-white">{new Date(incident.startedAt).toLocaleString()}</span>
                        </div>
                        {incident.endedAt && (
                          <div>
                            <span className="text-gray-400">Ended:</span>{' '}
                            <span className="text-white">{new Date(incident.endedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {incident.endedAt && (
                          <div>
                            <span className="text-gray-400">Duration:</span>{' '}
                            <span className="text-white">
                              {Math.round((new Date(incident.endedAt).getTime() - new Date(incident.startedAt).getTime()) / 60000)} minutes
                            </span>
                          </div>
                        )}
                      </div>
                      {incident.notes && (
                        <p className="text-gray-300 mt-2 text-sm">{incident.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {!selectedApiForWebhooks ? (
              <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-gray-400 text-lg">Select an API from the APIs tab to manage webhooks</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Webhooks for {apis.find(a => a.id === selectedApiForWebhooks)?.name}
                  </h2>
                  <button
                    onClick={() => setShowWebhookModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    + Add Webhook
                  </button>
                </div>
                {webhooks.length === 0 ? (
                  <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <p className="text-gray-400">No webhooks configured</p>
                  </div>
                ) : (
                  webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-300">
                              {webhook.type.toUpperCase()}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                webhook.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {webhook.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm break-all">
                            {webhook.url || webhook.email}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Events: {webhook.events.join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteWebhook(selectedApiForWebhooks, webhook.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add API Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Add New API</h2>
            <form onSubmit={addApi} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={newApi.name}
                    onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="My API"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Category</label>
                  <input
                    type="text"
                    value={newApi.category}
                    onChange={(e) => setNewApi({ ...newApi, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Weather, Payment"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">URL *</label>
                <input
                  type="url"
                  required
                  value={newApi.url}
                  onChange={(e) => setNewApi({ ...newApi, url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={newApi.description}
                  onChange={(e) => setNewApi({ ...newApi, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Interval (seconds)</label>
                  <input
                    type="number"
                    value={newApi.intervalSeconds}
                    onChange={(e) => setNewApi({ ...newApi, intervalSeconds: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="60"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Timeout (ms)</label>
                  <input
                    type="number"
                    value={newApi.timeoutMs}
                    onChange={(e) => setNewApi({ ...newApi, timeoutMs: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="1000"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Expected Status</label>
                  <input
                    type="text"
                    value={newApi.expectedStatus}
                    onChange={(e) => setNewApi({ ...newApi, expectedStatus: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="200"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newApi.sslCheckEnabled}
                    onChange={(e) => setNewApi({ ...newApi, sslCheckEnabled: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                  />
                  <span className="text-sm">Enable SSL Certificate Monitoring</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newApi.isPublic}
                    onChange={(e) => setNewApi({ ...newApi, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                  />
                  <span className="text-sm">Public Status Page</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Add API
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Add Webhook</h2>
            <form onSubmit={addWebhook} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Type *</label>
                <select
                  value={newWebhook.type}
                  onChange={(e) => setNewWebhook({ ...newWebhook, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="webhook">Generic Webhook</option>
                  <option value="slack">Slack</option>
                  <option value="discord">Discord</option>
                  <option value="email">Email</option>
                </select>
              </div>
              {newWebhook.type === 'email' ? (
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={newWebhook.email}
                    onChange={(e) => setNewWebhook({ ...newWebhook, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="alerts@example.com"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Webhook URL *</label>
                  <input
                    type="url"
                    required
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="https://hooks.slack.com/..."
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Add Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedApi && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">API Settings</h2>
            <form onSubmit={updateApiSettings} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Check Interval (seconds)</label>
                <input
                  type="number"
                  value={selectedApi.intervalSeconds}
                  onChange={(e) => setSelectedApi({ ...selectedApi, intervalSeconds: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min="60"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Timeout (ms)</label>
                <input
                  type="number"
                  value={selectedApi.timeoutMs}
                  onChange={(e) => setSelectedApi({ ...selectedApi, timeoutMs: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min="1000"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedApi.sslCheckEnabled}
                    onChange={(e) => setSelectedApi({ ...selectedApi, sslCheckEnabled: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                  />
                  <span className="text-sm">Monitor SSL Certificate</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedApi.isPublic}
                    onChange={(e) => setSelectedApi({ ...selectedApi, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                  />
                  <span className="text-sm">Public Status Page</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
