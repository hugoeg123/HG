import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';


const MainLayout = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);



  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Navbar 
        onToggleLeftSidebar={toggleLeftSidebar} 
        onToggleRightSidebar={toggleRightSidebar} 
      />
      <div className="main-content">
        <LeftSidebar collapsed={leftSidebarCollapsed} />
        <main className="center-pane p-4">
          <Outlet />
        </main>
        <RightSidebar collapsed={rightSidebarCollapsed} />
      </div>
    </div>
  );
};

export default MainLayout;