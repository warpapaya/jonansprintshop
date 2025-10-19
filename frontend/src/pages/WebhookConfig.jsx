import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Trash2, TestTube, Settings } from 'lucide-react'

export const WebhookConfig = () => {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    events: []
  })
  const [testing, setTesting] = useState(false)

  const eventOptions = [
    'order.created',
    'order.status.changed',
    'order.ready',
    'pickup.confirmed'
  ]

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await api.get('/webhooks/config')
      setWebhooks(response.data)
    } catch (error) {
      console.error('Failed to fetch webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/webhooks/config', formData)
      await fetchWebhooks()
      setShowForm(false)
      setFormData({ url: '', events: [] })
    } catch (error) {
      console.error('Failed to create webhook:', error)
    }
  }

  const handleDelete = async (webhookId) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await api.delete(`/webhooks/config/${webhookId}`)
        await fetchWebhooks()
      } catch (error) {
        console.error('Failed to delete webhook:', error)
      }
    }
  }

  const handleTest = async (url) => {
    setTesting(true)
    try {
      const response = await api.post('/webhooks/test', { url })
      alert('Test webhook sent successfully!')
    } catch (error) {
      alert('Test webhook failed: ' + (error.response?.data?.detail || 'Unknown error'))
    } finally {
      setTesting(false)
    }
  }

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Configuration</h1>
          <p className="text-gray-600">Configure webhooks for order events and notifications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </button>
      </div>

      {/* Webhook Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Webhook</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Webhook URL</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  placeholder="https://example.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              
              <div>
                <label className="form-label">Events to Subscribe To</label>
                <div className="space-y-2">
                  {eventOptions.map((event) => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ url: '', events: [] })
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configured Webhooks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {webhooks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
              <p className="text-gray-600">Add a webhook to receive order event notifications.</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{webhook.url}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Status: {webhook.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTest(webhook.url)}
                      disabled={testing}
                      className="btn btn-sm btn-secondary"
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
