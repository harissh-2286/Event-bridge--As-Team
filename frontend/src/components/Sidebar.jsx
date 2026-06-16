import React from 'react';

const Sidebar = ({ activeTab, onTabChange, role }) => {
  
  const getSidebarItems = () => {
    switch (role) {
      case 'ORGANIZER':
        return [
          { id: 'add-event', label: 'Add Event', icon: 'fa-plus' },
          { id: 'my-events', label: 'My Events', icon: 'fa-calendar-days' },
          { id: 'participants', label: 'Registrations', icon: 'fa-users' },
          { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
          { id: 'reports', label: 'Reports & Stats', icon: 'fa-chart-pie' },
        ];
      case 'PARTICIPANT':
        return [
          { id: 'available-events', label: 'Available Events', icon: 'fa-compass' },
          { id: 'my-registrations', label: 'My Registrations', icon: 'fa-ticket' },
          { id: 'my-od', label: 'My OD Letters', icon: 'fa-file-invoice' },
          { id: 'profile', label: 'My Profile', icon: 'fa-user-gear' },
        ];
      case 'FACULTY':
        return [
          { id: 'all-events', label: 'All Events', icon: 'fa-calendar-list' },
          { id: 'participants-monitor', label: 'Monitor Registrations', icon: 'fa-users-viewfinder' },
          { id: 'od-approvals', label: 'OD Approvals', icon: 'fa-file-signature' },
          { id: 'announcements', label: 'Send Announcements', icon: 'fa-bullhorn' },
        ];
      case 'ADMIN':
        return [
          { id: 'manage-users', label: 'Manage Users', icon: 'fa-users-gear' },
          { id: 'manage-events', label: 'Manage Events', icon: 'fa-calendar-check' },
          { id: 'manage-announcements', label: 'Manage Announcements', icon: 'fa-bullhorn' },
          { id: 'analytics', label: 'Platform Analytics', icon: 'fa-chart-line' },
        ];
      default:
        return [];
    }
  };

  const items = getSidebarItems();

  return (
    <div className="sidebar d-flex flex-column p-0 py-3">
      <div className="px-4 py-2 mb-3">
        <span className="text-uppercase text-muted fw-bold small" style={{ letterSpacing: '1px' }}>Menu</span>
      </div>
      <ul className="nav nav-pills flex-column mb-auto">
        {items.map(item => (
          <li key={item.id} className="nav-item">
            <a
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <i className={`fa-solid ${item.icon} me-3`} style={{ width: '20px' }}></i>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
