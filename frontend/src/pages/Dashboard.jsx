import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  Package,
  AlertCircle
} from 'lucide-react'

const statusConfig = {
  new: { label: 'New', color: 'status-new', icon: AlertCircle },
  prepping: { label: 'Prepping', color: 'status-prepping', icon: Clock },
  printing: { label: 'Printing', color: 'status-printing', icon: Package },
  finished: { label: 'Finished', color: 'status-finished', icon: CheckCircle },
  ready: { label: 'Ready', color: 'status-ready', icon: CheckCircle },
  delivered: { label: 'Delivered', color: 'status-delivered', icon: CheckCircle },
  archived: { label: 'Archived', color: 'status-archived', icon: CheckCircle },
}

export const Dashboard = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const response = await api.get('/orders/', { params })
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <span className={`status-badge ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusCounts = () => {
    const counts = {}
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'vendor' 
              ? 'Manage your orders' 
              : user?.role === 'jonan' 
              ? 'Track order progress'
              : 'View order status'
            }
          </p>
        </div>
        {user?.role === 'vendor' && (
          <Link to="/orders/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Link>
        )}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0
          const Icon = config.icon
          return (
            <div key={status} className="card text-center">
              <Icon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{config.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Orders
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Orders</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {user?.role === 'vendor' 
                  ? 'Create your first order to get started'
                  : 'No orders match your current filters'
                }
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {order.item_name}
                      </h4>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Quantity:</span> {order.quantity}
                      {order.color_material && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="font-medium">Material:</span> {order.color_material}
                        </>
                      )}
                    </div>
                    {order.notes && (
                      <div className="mt-1 text-sm text-gray-600">
                        {order.notes}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Created {formatDate(order.created_at)} by {order.vendor_name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
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
