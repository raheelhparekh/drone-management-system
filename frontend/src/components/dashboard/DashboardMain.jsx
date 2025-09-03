import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useMissionStore } from '../../stores/missionStore';
import { useDroneStore } from '../../stores/droneStore';
import RealTimeStatus from '../RealTimeStatus';
import FleetVisualization from './FleetVisualization';
import RealtimeMissionMonitoring from './RealtimeMissionMonitoring';
import SimulationDebugger from '../SimulationDebugger';
import TabNavigation from './TabNavigation';
import DronesTab from './DronesTab';
import MissionsTab from './MissionsTab';

function Dashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('fleet-map');
  const { initializeRealTime: initializeMissionRealTime, cleanupRealTime: cleanupMissionRealTime } = useMissionStore();
  const { initializeRealTime: initializeDroneRealTime } = useDroneStore();

  // Initialize real-time connections
  useEffect(() => {
    if (user) {
      console.log('Initializing real-time connections for user:', user.id);
      try {
        initializeMissionRealTime(user.id);
        initializeDroneRealTime();
      } catch (error) {
        console.log('Real-time initialization error:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      try {
        cleanupMissionRealTime();
      } catch (error) {
        console.log('Real-time cleanup error:', error);
      }
    };
  }, [user, initializeMissionRealTime, initializeDroneRealTime, cleanupMissionRealTime]);

  if (!user) {
    return <div className="text-center text-lg mt-10">Please log in to view the dashboard.</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fleet-map':
        return <FleetVisualization />;
      case 'mission-monitoring':
        return <RealtimeMissionMonitoring />;
      case 'drones':
        return <DronesTab />;
      case 'missions':
        return <MissionsTab />;
      case 'debug':
        return <SimulationDebugger />;
      default:
        return <FleetVisualization />;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Enterprise Drone Management System</h1>
        <p className="text-lg text-gray-600">Welcome, {user.name}! Complete fleet visualization and mission control.</p>
      </div>
      
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-6">
        {renderTabContent()}
      </div>
      
      {/* Real-time status indicator */}
      <RealTimeStatus />
    </div>
  );
}

export default Dashboard;
