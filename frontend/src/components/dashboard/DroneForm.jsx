import { useState } from 'react';

const DroneForm = ({ onSubmit, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    model: initialData?.model || '',
    serialNumber: initialData?.serialNumber || '',
    batteryLevel: initialData?.batteryLevel || 100,
    status: initialData?.status || 'available',
    location: {
      latitude: initialData?.location?.latitude || 40.7128,
      longitude: initialData?.location?.longitude || -74.0060
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Serial Number</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={formData.serialNumber}
          onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label className="label">Model</label>
        <select
          className="select select-bordered w-full"
          value={formData.model}
          onChange={(e) => setFormData({...formData, model: e.target.value})}
          required
        >
          <option value="">Select Model</option>
          <option value="DJI Phantom 4 Pro">DJI Phantom 4 Pro</option>
          <option value="DJI Mavic Air 2">DJI Mavic Air 2</option>
          <option value="DJI Mini 3 Pro">DJI Mini 3 Pro</option>
          <option value="Autel EVO II">Autel EVO II</option>
        </select>
      </div>

      <div>
        <label className="label">Battery Level (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          className="input input-bordered w-full"
          value={formData.batteryLevel}
          onChange={(e) => setFormData({...formData, batteryLevel: parseInt(e.target.value)})}
          required
        />
      </div>

      <div>
        <label className="label">Status</label>
        <select
          className="select select-bordered w-full"
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          required
        >
          <option value="available">Available</option>
          <option value="in-mission">In Mission</option>
          <option value="offline">Offline</option>
          <option value="charging">Charging</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Latitude</label>
          <input
            type="number"
            step="any"
            className="input input-bordered w-full"
            value={formData.location.latitude}
            onChange={(e) => setFormData({
              ...formData, 
              location: {...formData.location, latitude: parseFloat(e.target.value)}
            })}
            required
          />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input
            type="number"
            step="any"
            className="input input-bordered w-full"
            value={formData.location.longitude}
            onChange={(e) => setFormData({
              ...formData,
              location: {...formData.location, longitude: parseFloat(e.target.value)}
            })}
            required
          />
        </div>
      </div>

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Update' : 'Create'} Drone
        </button>
      </div>
    </form>
  );
};

export default DroneForm;
