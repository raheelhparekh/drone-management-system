import { useState, useEffect } from 'react';
import { useDroneStore } from '../stores/droneStore';
import { useMissionStore } from '../stores/missionStore';
import axiosInstance from '../api/axios';

const SimulationDebugger = () => {
  const { drones, fetchDrones } = useDroneStore();
  const { missions, fetchMissions } = useMissionStore();
  const [simulationStatus, setSimulationStatus] = useState({ isRunning: false });
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDrones();
    fetchMissions();
    checkSimulationStatus();
  }, [fetchDrones, fetchMissions]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        // Store previous coordinates to detect changes
        const prevCoordinates = {};
        drones.forEach(drone => {
          prevCoordinates[drone._id] = {
            lat: drone.location?.latitude,
            lng: drone.location?.longitude
          };
        });

        fetchDrones();
        fetchMissions();
        checkSimulationStatus();
        
        // Check for coordinate changes after a brief delay
        setTimeout(() => {
          drones.forEach(drone => {
            const prev = prevCoordinates[drone._id];
            const current = {
              lat: drone.location?.latitude,
              lng: drone.location?.longitude
            };
            
            if (prev && (Math.abs(prev.lat - current.lat) > 0.000001 || Math.abs(prev.lng - current.lng) > 0.000001)) {
              addUpdate(`🚁 ${drone.serialNumber} moved to ${current.lat?.toFixed(6)}, ${current.lng?.toFixed(6)}`);
            }
          });
        }, 100);
        
        addUpdate('📊 Data refreshed');
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDrones, fetchMissions, drones]);

  const checkSimulationStatus = async () => {
    try {
      const response = await axiosInstance.get('/simulation/status');
      setSimulationStatus(response.data || { isRunning: false });
    } catch {
      console.log('Simulation service not available');
      setSimulationStatus({ isRunning: false });
    }
  };

  const startSimulation = async () => {
    try {
      await axiosInstance.post('/simulation/start');
      setSimulationStatus({ isRunning: true });
      addUpdate('🚀 Simulation started - Drones will begin moving!');
    } catch (error) {
      addUpdate('❌ Failed to start simulation');
      console.error('Error starting simulation:', error);
    }
  };

  const stopSimulation = async () => {
    try {
      await axiosInstance.post('/simulation/stop');
      setSimulationStatus({ isRunning: false });
      addUpdate('🛑 Simulation stopped');
    } catch (error) {
      addUpdate('❌ Failed to stop simulation');
      console.error('Error stopping simulation:', error);
    }
  };

  const createTestMission = async () => {
    try {
      const response = await axiosInstance.post('/simulation/create-test-mission');
      addUpdate(`✅ ${response.data.message}`);
      addUpdate('🗺️ Test mission with 7 NYC landmarks created!');
      fetchMissions(); // Refresh missions
    } catch (error) {
      addUpdate('❌ Failed to create test mission');
      console.error('Error creating test mission:', error);
    }
  };

  const startTestMission = async () => {
    try {
      const response = await axiosInstance.post('/simulation/start-test-mission');
      addUpdate(`🚀 ${response.data.message}`);
      addUpdate('🚁 Drone will now move between NYC landmarks!');
      fetchMissions(); // Refresh missions
      fetchDrones(); // Refresh drones
    } catch (error) {
      addUpdate('❌ Failed to start test mission');
      console.error('Error starting test mission:', error);
    }
  };

  const addUpdate = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setRealTimeUpdates(prev => [
      { message, timestamp, id: Date.now() },
      ...prev.slice(0, 49) // Keep only last 50 updates
    ]);
  };

  const activeMissions = missions.filter(m => m.status === 'in-progress');
  const dronesInMission = drones.filter(d => d.status === 'in-mission');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🎮 Real-time Simulation</h2>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="text-sm">Auto Refresh</span>
          </label>
          <div className="divider divider-horizontal"></div>
          
          {/* Test Mission Controls */}
          <button
            onClick={createTestMission}
            className="btn btn-secondary btn-sm"
            title="Create a test mission with NYC landmarks"
          >
            🗺️ Create Test Mission
          </button>
          <button
            onClick={startTestMission}
            className="btn btn-accent btn-sm"
            title="Start the test mission"
          >
            🚀 Start Test Mission
          </button>
          
          <div className="divider divider-horizontal"></div>
          
          {/* Simulation Controls */}
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

      {/* Simulation Status */}
      <div className="alert alert-info">
        <div className="flex items-center gap-2">
          <span className={`loading loading-ring loading-sm ${simulationStatus?.isRunning ? '' : 'opacity-0'}`}></span>
          <span>
            Simulation Status: <strong>{simulationStatus?.isRunning ? 'RUNNING' : 'STOPPED'}</strong>
          </span>
          {simulationStatus?.isRunning && (
            <span className="badge badge-success">Real-time Updates Active</span>
          )}
          {simulationStatus?.pausedDrones > 0 && (
            <span className="badge badge-warning">
              {simulationStatus.pausedDrones} paused (manual updates)
            </span>
          )}
        </div>
        {simulationStatus?.isRunning && (
          <div className="text-sm mt-2 text-blue-600">
            💡 <strong>Tip:</strong> You can manually update drone battery levels in the forms. 
            Simulation will pause for that drone for 10 seconds to respect your changes.
          </div>
        )}
        
        {/* Quick Start Instructions */}
        {!simulationStatus?.isRunning && (
          <div className="text-sm mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <strong>🚀 Quick Start to See Coordinate Movement:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Click <strong>"🗺️ Create Test Mission"</strong> to create a mission with NYC landmarks</li>
              <li>Click <strong>"🚀 Start Test Mission"</strong> to activate the mission</li>
              <li>Click <strong>"▶️ Start Simulation"</strong> to begin real-time movement</li>
              <li>Watch coordinates change in the <strong>"Live Coordinate Tracker"</strong> below!</li>
            </ol>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Coordinate Tracker */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">📍 Live Coordinate Tracker</h3>
            
            {drones.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No drones to track</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drones.map((drone) => (
                  <div key={drone._id} className="border border-base-300 rounded p-2">
                    <div className="font-semibold text-sm mb-1">{drone.serialNumber}</div>
                    <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                      <div className="bg-green-50 p-1 rounded">
                        <span className="text-green-700">LAT:</span> 
                        <span className="ml-2 font-bold text-green-800">
                          {drone.location?.latitude?.toFixed(8) || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-blue-50 p-1 rounded">
                        <span className="text-blue-700">LNG:</span> 
                        <span className="ml-2 font-bold text-blue-800">
                          {drone.location?.longitude?.toFixed(8) || 'N/A'}
                        </span>
                      </div>
                      {simulationStatus?.isRunning && (
                        <div className="text-center">
                          <span className="text-xs text-orange-500 animate-pulse">
                            🔄 Updating every 2 seconds
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Drone Status */}
        <div className="lg:col-span-2 card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">🚁 Live Drone Status</h3>
            
            {drones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No drones available</p>
                <p className="text-sm">Add drones to see real-time updates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drones.map((drone) => {
                  const assignedMission = missions.find(m => m.drone?._id === drone._id && m.status === 'in-progress');
                  
                  return (
                    <div key={drone._id} className="border border-base-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{drone.serialNumber}</h4>
                          <p className="text-sm text-gray-600">{drone.model}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`badge ${
                            drone.status === 'available' ? 'badge-success' :
                            drone.status === 'in-mission' ? 'badge-info' :
                            drone.status === 'charging' ? 'badge-warning' :
                            'badge-error'
                          }`}>
                            {drone.status}
                          </span>
                          {simulationStatus?.isRunning && drone.status === 'in-mission' && (
                            <span className="loading loading-dots loading-xs"></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Battery:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <progress 
                              className={`progress progress-sm w-full ${
                                drone.batteryLevel > 50 ? 'progress-success' :
                                drone.batteryLevel > 20 ? 'progress-warning' : 'progress-error'
                              }`} 
                              value={drone.batteryLevel} 
                              max="100"
                            ></progress>
                            <span>{drone.batteryLevel}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Location:</span>
                          <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-100 p-1 rounded">
                            <div className="text-green-600">Lat: {drone.location?.latitude?.toFixed(6) || 'N/A'}</div>
                            <div className="text-blue-600">Lng: {drone.location?.longitude?.toFixed(6) || 'N/A'}</div>
                            {simulationStatus?.isRunning && (
                              <div className="text-red-500 text-xs mt-1 animate-pulse">
                                📍 Live Updates
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {assignedMission && (
                        <div className="mt-3 p-2 bg-base-200 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Mission: {assignedMission.name}</span>
                            <span className="text-sm">{assignedMission.progress || 0}% complete</span>
                          </div>
                          <progress 
                            className="progress progress-primary progress-sm w-full mt-1" 
                            value={assignedMission.progress || 0} 
                            max="100"
                          ></progress>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Activity Log */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">📡 Activity Log</h3>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setRealTimeUpdates([])}
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {realTimeUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No activity yet</p>
                  <p className="text-sm">Start simulation to see updates</p>
                </div>
              ) : (
                realTimeUpdates.map((update) => (
                  <div key={update.id} className="text-xs bg-base-200 p-2 rounded">
                    <span className="text-gray-500">[{update.timestamp}]</span> {update.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Progress Overview */}
      {activeMissions.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">🎯 Active Mission Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMissions.map((mission) => {
                const assignedDrone = drones.find(d => d._id === mission.drone?._id);
                
                return (
                  <div key={mission._id} className="border border-base-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{mission.name}</h4>
                      <span className="badge badge-info">{mission.status}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Drone: {assignedDrone?.serialNumber || 'Unassigned'} | 
                      Waypoints: {mission.flightPath?.length || 0}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Progress:</span>
                      <progress 
                        className="progress progress-primary flex-1" 
                        value={mission.progress || 0} 
                        max="100"
                      ></progress>
                      <span className="text-sm font-medium">{mission.progress || 0}%</span>
                    </div>
                    
                    {simulationStatus?.isRunning && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <span className="loading loading-dots loading-xs"></span>
                        Real-time simulation active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Simulation Status</div>
          <div className={`stat-value text-sm ${simulationStatus?.isRunning ? 'text-success' : 'text-warning'}`}>
            {simulationStatus?.isRunning ? 'ACTIVE' : 'INACTIVE'}
          </div>
          <div className="stat-desc">Real-time updates</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Drones in Mission</div>
          <div className="stat-value text-primary">{dronesInMission.length}</div>
          <div className="stat-desc">Currently flying</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Active Missions</div>
          <div className="stat-value text-secondary">{activeMissions.length}</div>
          <div className="stat-desc">In progress</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Activity Updates</div>
          <div className="stat-value text-accent">{realTimeUpdates.length}</div>
          <div className="stat-desc">Total logged</div>
        </div>
      </div>
    </div>
  );
};

export default SimulationDebugger;
