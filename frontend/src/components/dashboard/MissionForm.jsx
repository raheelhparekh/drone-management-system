import { useState } from 'react';

const MissionForm = ({ onSubmit, onClose, drones = [], initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'planned',
    drone: initialData?.drone?._id || '',
    flightPath: initialData?.flightPath || [
      { latitude: 40.7128, longitude: -74.0060, altitude: 50 }
    ],
    config: {
      flightAltitude: initialData?.config?.flightAltitude || 50,
      overlapPercentage: initialData?.config?.overlapPercentage || 70
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addWaypoint = () => {
    setFormData({
      ...formData,
      flightPath: [...formData.flightPath, { latitude: 0, longitude: 0, altitude: formData.config.flightAltitude }]
    });
  };

  const updateWaypoint = (index, field, value) => {
    const newFlightPath = [...formData.flightPath];
    newFlightPath[index][field] = parseFloat(value);
    setFormData({...formData, flightPath: newFlightPath});
  };

  const removeWaypoint = (index) => {
    if (formData.flightPath.length > 1) {
      const newFlightPath = formData.flightPath.filter((_, i) => i !== index);
      setFormData({...formData, flightPath: newFlightPath});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Mission Name</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="3"
          placeholder="Mission details..."
        />
      </div>

      <div>
        <label className="label">Status</label>
        <select
          className="select select-bordered w-full"
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="aborted">Aborted</option>
        </select>
      </div>

      <div>
        <label className="label">Assigned Drone</label>
        <select
          className="select select-bordered w-full"
          value={formData.drone}
          onChange={(e) => setFormData({...formData, drone: e.target.value})}
          required
        >
          <option value="">Select Drone</option>
          {drones.filter(drone => drone.status === 'available').map(drone => (
            <option key={drone._id} value={drone._id}>
              {drone.serialNumber} ({drone.model}) - {drone.batteryLevel}%
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Flight Altitude (m)</label>
          <input
            type="number"
            min="10"
            max="120"
            className="input input-bordered w-full"
            value={formData.config.flightAltitude}
            onChange={(e) => setFormData({
              ...formData,
              config: {...formData.config, flightAltitude: parseInt(e.target.value)}
            })}
          />
        </div>
        <div>
          <label className="label">Overlap Percentage (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input input-bordered w-full"
            value={formData.config.overlapPercentage}
            onChange={(e) => setFormData({
              ...formData,
              config: {...formData.config, overlapPercentage: parseInt(e.target.value)}
            })}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="label">Flight Path Waypoints</label>
          <button type="button" className="btn btn-sm btn-primary" onClick={addWaypoint}>
            + Add Waypoint
          </button>
        </div>
        {formData.flightPath.map((waypoint, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className="input input-bordered input-sm"
              value={waypoint.latitude}
              onChange={(e) => updateWaypoint(index, 'latitude', e.target.value)}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="input input-bordered input-sm"
              value={waypoint.longitude}
              onChange={(e) => updateWaypoint(index, 'longitude', e.target.value)}
            />
            <input
              type="number"
              min="10"
              max="120"
              placeholder="Altitude"
              className="input input-bordered input-sm"
              value={waypoint.altitude}
              onChange={(e) => updateWaypoint(index, 'altitude', e.target.value)}
            />
            {formData.flightPath.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-error"
                onClick={() => removeWaypoint(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Update' : 'Create'} Mission
        </button>
      </div>
    </form>
  );
};

export default MissionForm;
