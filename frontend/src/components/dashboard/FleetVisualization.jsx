import { useState, useEffect, useCallback } from 'react';
import { useDroneStore } from '../../stores/droneStore';
import { useMissionStore } from '../../stores/missionStore';
import axiosInstance from '../../api/axios';

const FleetVisualization = () => {
  const { drones, fetchDrones } = useDroneStore();
  const { missions, fetchMissions } = useMissionStore();
  const [simulationStatus, setSimulationStatus] = useState(null);
  const [liveActivity, setLiveActivity] = useState({
    movementUpdates: 0,
    batteryChanges: 0,
    lastActivity: null
  });
  const [activityFeed, setActivityFeed] = useState([]);

  const addToActivityFeed = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityFeed(prev => [
      { message, timestamp, id: Date.now() },
      ...prev.slice(0, 9) // Keep only last 10 items
    ]);
    setLiveActivity(prev => ({
      ...prev,
      lastActivity: new Date()
    }));
  }, []);

  const updateActivityFeed = useCallback(() => {
    // Simulate activity updates
    const activities = [
      '🚁 Drone movement detected',
      '🔋 Battery level updated',
      '📍 Position synchronized',
      '📡 Telemetry received'
    ];
    
    if (Math.random() > 0.7) { // 30% chance of activity
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      addToActivityFeed(randomActivity);
      
      if (randomActivity.includes('movement')) {
        setLiveActivity(prev => ({
          ...prev,
          movementUpdates: prev.movementUpdates + 1
        }));
      }
      
      if (randomActivity.includes('Battery')) {
        setLiveActivity(prev => ({
          ...prev,
          batteryChanges: prev.batteryChanges + 1
        }));
      }
    }
  }, [addToActivityFeed]);

  useEffect(() => {
    fetchDrones();
    fetchMissions();
    checkSimulationStatus();
    
    // Polling for updates every 3 seconds
    const interval = setInterval(() => {
      fetchDrones();
      updateActivityFeed();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchDrones, fetchMissions, updateActivityFeed]);

  const checkSimulationStatus = async () => {
    try {
      const response = await axiosInstance.get('/simulation/status');
      setSimulationStatus(response.data);
    } catch (error) {
      console.log('Error checking simulation status:', error);
    }
  };

  const startSimulation = async () => {
    try {
      await axiosInstance.post('/simulation/start');
      setSimulationStatus({ isRunning: true });
      addToActivityFeed('🚀 Simulation started');
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  const stopSimulation = async () => {
    try {
      await axiosInstance.post('/simulation/stop');
      setSimulationStatus({ isRunning: false });
      addToActivityFeed('🛑 Simulation stopped');
    } catch (error) {
      console.error('Error stopping simulation:', error);
    }
  };

  const activeDrones = drones.filter(drone => drone.status !== 'maintenance');
  const activeMissions = missions.filter(mission => mission.status === 'in-progress');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🗺️ Fleet Visualization</h2>
        <div className="flex gap-2">
          <button
            onClick={startSimulation}
            className={`btn btn-success ${simulationStatus?.isRunning ? 'btn-disabled' : ''}`}
            disabled={simulationStatus?.isRunning}
          >
            ▶️ Start Simulation
          </button>
          <button
            onClick={stopSimulation}
            className={`btn btn-error ${!simulationStatus?.isRunning ? 'btn-disabled' : ''}`}
            disabled={!simulationStatus?.isRunning}
          >
            ⏹️ Stop Simulation
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Fleet Status</div>
          <div className="stat-value text-primary">{activeDrones.length}</div>
          <div className="stat-desc">Active Drones</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Active Missions</div>
          <div className="stat-value text-secondary">{activeMissions.length}</div>
          <div className="stat-desc">In Progress</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Simulation</div>
          <div className={`stat-value ${simulationStatus?.isRunning ? 'text-success' : 'text-warning'}`}>
            {simulationStatus?.isRunning ? 'Running' : 'Stopped'}
          </div>
          <div className="stat-desc">Real-time Updates</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Battery Avg</div>
          <div className="stat-value text-accent">
            {drones.length > 0 ? Math.round(drones.reduce((sum, d) => sum + d.batteryLevel, 0) / drones.length) : 0}%
          </div>
          <div className="stat-desc">Fleet Average</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Map Placeholder */}
        <div className="lg:col-span-2 card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">📍 Live Fleet Map</h3>
            <div className="h-96 w-full bg-base-200 rounded-lg flex items-center justify-center">
              {drones.length > 0 ? (
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-semibold">Fleet Positions</h4>
                  <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                    {drones.map((drone) => (
                      <div key={drone._id} className="bg-white p-3 rounded shadow">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🚁</span>
                          <div>
                            <h5 className="font-semibold text-sm">{drone.serialNumber}</h5>
                            <p className="text-xs text-gray-600">
                              Lat: {drone.location?.latitude?.toFixed(4) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Lng: {drone.location?.longitude?.toFixed(4) || 'N/A'}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`badge badge-xs ${
                                drone.status === 'available' ? 'badge-success' :
                                drone.status === 'in-mission' ? 'badge-info' :
                                'badge-warning'
                              }`}></span>
                              <span className="text-xs">{drone.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-600">No Drones Available</h4>
                  <p className="text-gray-500">Add drones to see them on the map</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Activity Panel */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">📡 Live Activity</h3>
            
            {/* Activity Counters */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <div className="flex justify-between">
                <span>Movement Updates:</span>
                <span className="badge badge-primary">{liveActivity.movementUpdates}</span>
              </div>
              <div className="flex justify-between">
                <span>Battery Changes:</span>
                <span className="badge badge-secondary">{liveActivity.batteryChanges}</span>
              </div>
            </div>

            {/* Live Feed */}
            <div className="divider">🔴 Live Feed</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {activityFeed.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <p>Waiting for drone activity...</p>
                  <p className="text-sm">Start simulation to see live updates</p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <div key={activity.id} className="text-xs bg-base-200 p-2 rounded">
                    <span className="text-gray-500">[{activity.timestamp}]</span> {activity.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Details Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">🚁 Fleet Details</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Drone</th>
                  <th>Status</th>
                  <th>Battery</th>
                  <th>Location</th>
                  <th>Mission</th>
                </tr>
              </thead>
              <tbody>
                {drones.map((drone) => {
                  const assignedMission = missions.find(m => 
                    m.drone?._id === drone._id && m.status === 'in-progress'
                  );
                  
                  return (
                    <tr key={drone._id}>
                      <td>
                        <div>
                          <div className="font-bold">{drone.serialNumber}</div>
                          <div className="text-sm opacity-50">{drone.model}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          drone.status === 'available' ? 'badge-success' :
                          drone.status === 'in-mission' ? 'badge-info' :
                          drone.status === 'charging' ? 'badge-warning' :
                          'badge-error'
                        }`}>
                          {drone.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress 
                            className={`progress w-20 ${
                              drone.batteryLevel > 50 ? 'progress-success' :
                              drone.batteryLevel > 20 ? 'progress-warning' : 'progress-error'
                            }`} 
                            value={drone.batteryLevel} 
                            max="100"
                          ></progress>
                          <span className="text-sm">{drone.batteryLevel}%</span>
                        </div>
                      </td>
                      <td className="text-xs">
                        {drone.location?.latitude?.toFixed(4) || 'N/A'}, {drone.location?.longitude?.toFixed(4) || 'N/A'}
                      </td>
                      <td>
                        {assignedMission ? (
                          <span className="badge badge-outline">{assignedMission.name}</span>
                        ) : (
                          <span className="text-gray-400">No mission</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetVisualization;
