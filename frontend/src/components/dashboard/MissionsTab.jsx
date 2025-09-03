import { useEffect, useState } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { useDroneStore } from '../../stores/droneStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, Play, StopCircle } from 'lucide-react';
import Modal from '../Modal';
import MissionForm from './MissionForm';

const MissionsTab = () => {
  const { missions, isLoading, error, fetchMissions, deleteMission, updateMission, createMission } = useMissionStore();
  const { drones, fetchDrones } = useDroneStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState(null);
  const [editingMission, setEditingMission] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchMissions();
    fetchDrones();
  }, [fetchMissions, fetchDrones]);

  const handleDeleteClick = (id) => {
    setMissionToDelete(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMission(missionToDelete);
      toast.success('Mission deleted successfully');
      setConfirmModalOpen(false);
      setMissionToDelete(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmModalOpen(false);
      setMissionToDelete(null);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateMission(id, { status: newStatus });
      toast.success(`Mission status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditClick = (mission) => {
    setEditingMission(mission);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (missionData) => {
    try {
      await updateMission(editingMission._id, missionData);
      toast.success('Mission updated successfully');
      setIsEditModalOpen(false);
      setEditingMission(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update mission');
    }
  };

  const handleCreateSubmit = async (missionData) => {
    try {
      await createMission(missionData);
      toast.success('Mission created successfully');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create mission');
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
      <h2 className="text-xl font-bold mb-4">Mission Planning</h2>
      <button className="btn btn-primary mb-4" onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4" /> Plan New Mission
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Mission">
        <MissionForm
          onSubmit={handleCreateSubmit}
          onClose={() => setIsModalOpen(false)}
          drones={drones}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Mission">
        <MissionForm
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditModalOpen(false)}
          initialData={editingMission}
          drones={drones}
        />
      </Modal>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Mission Name</th>
              <th>Description</th>
              <th>Drone</th>
              <th>Status</th>
              <th>Flight Path</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission._id}>
                <td>{mission.name}</td>
                <td>
                  <span className="badge badge-outline">{mission.description || 'No description'}</span>
                </td>
                <td>{mission.drone ? `${mission.drone.serialNumber} (${mission.drone.model})` : 'Unassigned'}</td>
                <td>
                  <span className={`badge ${mission.status === 'in-progress' ? 'badge-info' : mission.status === 'completed' ? 'badge-success' : mission.status === 'aborted' ? 'badge-error' : mission.status === 'paused' ? 'badge-warning' : 'badge-ghost'}`}>
                    {mission.status}
                  </span>
                  <select 
                    className="select select-xs ml-2" 
                    value={mission.status} 
                    onChange={(e) => handleStatusUpdate(mission._id, e.target.value)}
                    disabled={mission.status === 'completed' || mission.status === 'aborted'}
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="aborted">Aborted</option>
                  </select>
                </td>
                <td>
                  <div className="text-sm">
                    {mission.flightPath?.length || 0} waypoints
                    {mission.config?.flightAltitude && (
                      <div className="text-xs text-gray-500">Alt: {mission.config.flightAltitude}m</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleStatusUpdate(mission._id, 'in-progress')}
                      disabled={mission.status === 'in-progress' || mission.status === 'completed' || mission.status === 'aborted'}
                      title="Start Mission"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleStatusUpdate(mission._id, 'completed')}
                      disabled={mission.status === 'completed' || mission.status === 'aborted'}
                      title="Complete Mission"
                    >
                      <StopCircle className="h-4 w-4" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleEditClick(mission)}
                      disabled={mission.status === 'in-progress'}
                      title="Edit Mission"
                    >
                      <Edit className="h-4 w-4 text-info" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleDeleteClick(mission._id)}
                      disabled={mission.status === 'in-progress'}
                      title="Delete Mission"
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
      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete this mission?</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
          <button className="btn btn-error" onClick={handleConfirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default MissionsTab;
