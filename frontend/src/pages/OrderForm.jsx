import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Upload, X } from 'lucide-react'

export const OrderForm = () => {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    color_material: '',
    notes: '',
    preferred_date: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!formData.item_name.trim()) {
      setError('Item name is required')
      setLoading(false)
      return
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Quantity must be greater than 0')
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Always add required fields (item_name, quantity) even if empty
        if (key === 'item_name' || key === 'quantity' || value) {
          // Convert quantity to string (FormData expects strings)
          if (key === 'quantity') {
            formDataToSend.append(key, String(parseInt(value) || 0))
          } else if (key === 'preferred_date' && value) {
            // Convert date to datetime format
            formDataToSend.append(key, `${value}T00:00:00`)
          } else {
            formDataToSend.append(key, value || '')
          }
        }
      })
      
      // Add files
      files.forEach(file => {
        formDataToSend.append('files', file)
      })

      const response = await api.post('/orders/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      navigate(`/orders/${response.data.id}`, { 
        state: { message: 'Order created successfully!' }
      })
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-600">Submit a new order for 3D-printed clay cutters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="item_name" className="form-label">
                Item Name *
              </label>
              <input
                type="text"
                id="item_name"
                name="item_name"
                required
                className="form-input"
                value={formData.item_name}
                onChange={handleInputChange}
                placeholder="e.g., Star-shaped cookie cutter"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="form-label">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="color_material" className="form-label">
                Color/Material
              </label>
              <input
                type="text"
                id="color_material"
                name="color_material"
                className="form-input"
                value={formData.color_material}
                onChange={handleInputChange}
                placeholder="e.g., Red PLA, Wood PLA"
              />
            </div>

            <div>
              <label htmlFor="preferred_date" className="form-label">
                Preferred Completion Date
              </label>
              <input
                type="date"
                id="preferred_date"
                name="preferred_date"
                className="form-input"
                value={formData.preferred_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="form-input"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">File Attachments</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload .stl, .3mf, .zip, .png, or .jpg files (max 50MB each)
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="files" className="form-label">
                Choose Files
              </label>
              <input
                type="file"
                id="files"
                multiple
                accept=".stl,.3mf,.zip,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="form-input"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
