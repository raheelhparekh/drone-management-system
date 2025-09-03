import { useEffect, useState } from 'react';
import { useDroneStore } from '../../stores/droneStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import Modal from '../Modal';
import DroneForm from './DroneForm';

const DronesTab = () => {
  const { drones, isLoading, error, fetchDrones, deleteDrone, createDrone, updateDrone } = useDroneStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [droneToDelete, setDroneToDelete] = useState(null);
  const [editingDrone, setEditingDrone] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchDrones();
  }, [fetchDrones]);

  const handleDeleteClick = (id) => {
    setDroneToDelete(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDrone(droneToDelete);
      toast.success('Drone deleted successfully');
      setConfirmModalOpen(false);
      setDroneToDelete(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmModalOpen(false);
      setDroneToDelete(null);
    }
  };

  const handleCreateSubmit = async (droneData) => {
    try {
      await createDrone(droneData);
      toast.success('Drone created successfully');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create drone');
    }
  };

  const handleEditClick = (drone) => {
    setEditingDrone(drone);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (droneData) => {
    try {
      await updateDrone(editingDrone._id, droneData);
      toast.success('Drone updated successfully');
      setIsEditModalOpen(false);
      setEditingDrone(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update drone');
    }
  };

  const handleDroneStatusUpdate = async (id, newStatus) => {
    try {
      await updateDrone(id, { status: newStatus });
      toast.success(`Drone status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update drone status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Fleet</h2>
      <button className="btn btn-primary mb-4" onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4" /> Add New Drone
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Drone">
        <DroneForm
          onSubmit={handleCreateSubmit}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Drone">
        <DroneForm
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditModalOpen(false)}
          initialData={editingDrone}
        />
      </Modal>

      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete this drone?</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
          <button className="btn btn-error" onClick={handleConfirmDelete}>Delete</button>
        </div>
      </Modal>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Model</th>
              <th>ID</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((drone) => (
              <tr key={drone._id}>
                <td>{drone.serialNumber}</td>
                <td>{drone.model}</td>
                <td>{drone.serialNumber}</td>
                <td>
                  <span className={`badge ${drone.status === 'available' ? 'badge-success' : drone.status === 'in-mission' ? 'badge-info' : drone.status === 'maintenance' ? 'badge-warning' : drone.status === 'charging' ? 'badge-primary' : 'badge-error'}`}>
                    {drone.status}
                  </span>
                  <select 
                    className="select select-xs ml-2" 
                    value={drone.status} 
                    onChange={(e) => handleDroneStatusUpdate(drone._id, e.target.value)}
                    disabled={drone.status === 'in-mission'}
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="charging">Charging</option>
                    <option value="offline">Offline</option>
                  </select>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <progress 
                      className={`progress progress-sm w-20 ${
                        drone.batteryLevel > 50 ? 'progress-success' :
                        drone.batteryLevel > 20 ? 'progress-warning' : 'progress-error'
                      }`} 
                      value={drone.batteryLevel} 
                      max="100"
                    ></progress>
                    <span className="text-sm">{drone.batteryLevel}%</span>
                  </div>
                </td>
                <td>
                  <div className="text-xs font-mono">
                    <div className="bg-green-50 px-2 py-1 rounded mb-1">
                      <span className="text-green-700 font-semibold">LAT:</span> 
                      <span className="ml-1 text-green-800">{drone.location?.latitude?.toFixed(6) || 'N/A'}</span>
                    </div>
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-blue-700 font-semibold">LNG:</span> 
                      <span className="ml-1 text-blue-800">{drone.location?.longitude?.toFixed(6) || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={() => handleEditClick(drone)}
                      title="Edit Drone"
                    >
                      <Edit className="h-4 w-4 text-info" />
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={() => handleDeleteClick(drone._id)}
                      title="Delete Drone"
                    >
                      <Trash2 className="h-4 w-4 text-error" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DronesTab;
