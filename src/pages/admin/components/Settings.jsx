import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Settings = () => {
  const [settings, setSettings] = useState({
    store_name: 'Sneakerhub',
    store_email: '',
    contact_number: '',
    address: '',

  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/admin/settings', settings);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update settings'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-4">Store Settings</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Store Information */}
              <div className="col-md-6 mb-4">
                <h6 className="mb-3">Store Information</h6>
                <div className="mb-3">
                  <label className="form-label">Store Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="store_name"
                    value={settings.store_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Store Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="store_email"
                    value={settings.store_email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="contact_number"
                    value={settings.contact_number}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={settings.address}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              
            </div>

            <div className="text-end mt-4">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 