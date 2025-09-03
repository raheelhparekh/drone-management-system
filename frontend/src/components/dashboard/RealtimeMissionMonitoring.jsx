import { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { useDroneStore } from '../../stores/droneStore';

const RealtimeMissionMonitoring = () => {
  const { missions, fetchMissions } = useMissionStore();
  const { drones } = useDroneStore();
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionStats, setMissionStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    failed: 0
  });

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    // Calculate mission statistics
    const stats = missions.reduce((acc, mission) => {
      acc.total++;
      if (mission.status === 'in-progress') acc.inProgress++;
      else if (mission.status === 'completed') acc.completed++;
      else if (mission.status === 'failed') acc.failed++;
      return acc;
    }, { total: 0, inProgress: 0, completed: 0, failed: 0 });
    
    setMissionStats(stats);
  }, [missions]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'in-progress': return 'badge-info';
      case 'completed': return 'badge-success';
      case 'failed': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const getProgressPercentage = (mission) => {
    return mission.progress || 0; // Use backend progress field directly
  };

  const activeMissions = missions.filter(mission => mission.status === 'in-progress');
  const recentMissions = missions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🎯 Real-time Mission Monitoring</h2>
        <div className="flex gap-2">
          <div className="badge badge-primary">{missionStats.inProgress} Active</div>
          <div className="badge badge-success">{missionStats.completed} Completed</div>
        </div>
      </div>

      {/* Mission Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Total Missions</div>
          <div className="stat-value text-primary">{missionStats.total}</div>
          <div className="stat-desc">All time</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-info">{missionStats.inProgress}</div>
          <div className="stat-desc">Currently active</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Completed</div>
          <div className="stat-value text-success">{missionStats.completed}</div>
          <div className="stat-desc">Successfully finished</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Failed</div>
          <div className="stat-value text-error">{missionStats.failed}</div>
          <div className="stat-desc">Need attention</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">🚀 Active Missions</h3>
            {activeMissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No active missions</p>
                <p className="text-sm">Create a mission to start monitoring</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMissions.map((mission) => {
                  const assignedDrone = drones.find(d => d._id === mission.assignedDrone?._id);
                  const progress = getProgressPercentage(mission);
                  
                  return (
                    <div 
                      key={mission._id} 
                      className="border border-base-300 rounded-lg p-4 cursor-pointer hover:bg-base-50"
                      onClick={() => setSelectedMission(selectedMission?._id === mission._id ? null : mission)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{mission.name}</h4>
                        <span className={`badge ${getStatusBadgeClass(mission.status)}`}>
                          {mission.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        Drone: {assignedDrone?.serialNumber || 'Unassigned'}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">Progress:</span>
                        <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
                        <span className="text-sm">{progress}%</span>
                      </div>
                      
                      {selectedMission?._id === mission._id && (
                        <div className="mt-3 p-3 bg-base-200 rounded">
                          <h5 className="font-semibold text-sm mb-2">Mission Details:</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Priority: <span className="badge badge-sm">{mission.priority}</span></div>
                            <div>Type: {mission.type}</div>
                            <div>Created: {new Date(mission.createdAt).toLocaleDateString()}</div>
                            <div>Waypoints: {mission.flightPath?.length || 0}</div>
                          </div>
                          {assignedDrone && (
                            <div className="mt-2">
                              <h6 className="font-semibold text-sm">Drone Status:</h6>
                              <div className="text-xs">
                                Battery: {assignedDrone.batteryLevel}% | Status: {assignedDrone.status}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Mission Activity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">📋 Recent Mission Activity</h3>
            {recentMissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No missions yet</p>
                <p className="text-sm">Create your first mission to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMissions.map((mission) => {
                  const assignedDrone = drones.find(d => d._id === mission.assignedDrone?._id);
                  
                  return (
                    <div key={mission._id} className="flex items-center justify-between p-3 border border-base-300 rounded">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{mission.name}</h4>
                        <p className="text-xs text-gray-600">
                          {assignedDrone?.serialNumber || 'Unassigned'} • {new Date(mission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`badge badge-xs ${getStatusBadgeClass(mission.status)}`}>
                          {mission.status}
                        </span>
                        <span className="text-xs text-gray-500">{mission.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mission Performance Chart Placeholder */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">📊 Mission Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat">
              <div className="stat-title">Success Rate</div>
              <div className="stat-value text-success">
                {missionStats.total > 0 ? Math.round((missionStats.completed / missionStats.total) * 100) : 0}%
              </div>
              <div className="stat-desc">Based on completed missions</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Average Duration</div>
              <div className="stat-value text-primary">2.5h</div>
              <div className="stat-desc">Estimated completion time</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Fleet Utilization</div>
              <div className="stat-value text-accent">
                {drones.length > 0 ? Math.round((activeMissions.length / drones.length) * 100) : 0}%
              </div>
              <div className="stat-desc">Drones currently in missions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMissionMonitoring;
