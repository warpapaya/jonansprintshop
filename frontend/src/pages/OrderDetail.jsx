import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, 
  Download, 
  Calendar,
  User,
  Package,
  CheckCircle,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'

const statusConfig = {
  new: { label: 'New', color: 'text-blue-600 bg-blue-100', icon: Clock },
  prepping: { label: 'Prepping', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  printing: { label: 'Printing', color: 'text-purple-600 bg-purple-100', icon: Package },
  finished: { label: 'Finished', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  ready: { label: 'Ready', color: 'text-emerald-600 bg-emerald-100', icon: CheckCircle },
  delivered: { label: 'Delivered', color: 'text-gray-600 bg-gray-100', icon: CheckCircle },
  archived: { label: 'Archived', color: 'text-gray-500 bg-gray-50', icon: CheckCircle },
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'prepping', label: 'Prepping' },
  { value: 'printing', label: 'Printing' },
  { value: 'finished', label: 'Finished' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'archived', label: 'Archived' },
]

export const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      console.log('Fetching order with ID:', id)
      const response = await api.get(`/orders/${id}`)
      console.log('Order response:', response.data)
      setOrder(response.data)
      setNewStatus(response.data.status)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) return

    setUpdating(true)
    try {
      const updateData = { status: newStatus }
      if (pickupTime) {
        updateData.pickup_time = pickupTime
      }
      
      await api.put(`/orders/${id}`, updateData)
      await fetchOrder()
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    setDeleting(true)
    try {
      await api.delete(`/orders/${id}`)
      navigate('/', { 
        state: { message: 'Order deleted successfully!' }
      })
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert('Failed to delete order. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const downloadFile = async (attachment) => {
    try {
      const response = await api.get(`/uploads/${attachment.storage_path}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', attachment.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
        <button 
          onClick={() => navigate('/')} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.new
  const StatusIcon = statusInfo.icon
  const isJonan = user?.role === 'jonan' || user?.role === 'admin'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.substring(0, 8)}</h1>
            <p className="text-gray-600 mt-1">Created on {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center">
            <StatusIcon className={`w-6 h-6 mr-2 ${statusInfo.color.split(' ')[0]}`} />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Item Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.item_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.quantity}</dd>
                </div>
                {order.color_material && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Color/Material</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.color_material}</dd>
                  </div>
                )}
                {order.preferred_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(order.preferred_date)}</dd>
                  </div>
                )}
                {order.pickup_time && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pickup Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(order.pickup_time)}</dd>
                  </div>
                )}
              </dl>
              {order.notes && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{order.notes}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {order.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Download className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(attachment.size_bytes / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(attachment)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          {isJonan && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Update Status
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {newStatus === 'ready' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time
                    </label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || !newStatus || newStatus === order.status}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </button>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Vendor:</dt>
                  <dd className="text-sm text-gray-900">{order.vendor_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Created:</dt>
                  <dd className="text-sm text-gray-900">{formatDate(order.created_at)}</dd>
                </div>
                {order.updated_at && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Updated:</dt>
                    <dd className="text-sm text-gray-900">{formatDate(order.updated_at)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Order</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this order? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}