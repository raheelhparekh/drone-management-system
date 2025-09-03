import { 
  Map, 
  Monitor, 
  Plane as DroneIcon, 
  List, 
  Bug 
} from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'fleet-map',
      label: 'Fleet Visualization',
      icon: Map
    },
    {
      id: 'mission-monitoring',
      label: 'Mission Monitoring',
      icon: Monitor
    },
    {
      id: 'drones',
      label: 'Fleet Management',
      icon: DroneIcon
    },
    {
      id: 'missions',
      label: 'Mission Planning',
      icon: List
    },
    {
      id: 'debug',
      label: 'Debug Simulation',
      icon: Bug
    }
  ];

  return (
    <div className="tabs tabs-boxed mb-6">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <a
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <IconComponent className="h-5 w-5 mr-2" /> {tab.label}
          </a>
        );
      })}
    </div>
  );
};

export default TabNavigation;
