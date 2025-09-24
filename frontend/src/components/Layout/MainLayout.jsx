import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';


const MainLayout = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);



  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };

  const toggleRightSidebarExpansion = () => {
    setRightSidebarExpanded(!rightSidebarExpanded);
  };

  return (
    <div className="app-container">
      {/* Navbar - Always visible at top */}
      <Navbar 
        onToggleLeftSidebar={toggleLeftSidebar} 
        onToggleRightSidebar={toggleRightSidebar} 
        rightSidebarCollapsed={rightSidebarCollapsed}
      />
      
      {/* Main content area with sidebars */}
      <div className="main-content"
        data-fill-from=".left-pane .patient-list li .bg-theme-card"
        data-fill-target=".center-pane .stat-card, .center-pane .recent-patients"
        data-fill-count="4"
        data-fill-disable-in-light="true"
      >
        {/* Left Sidebar */}
        <aside className={`transition-all duration-300 flex-shrink-0 ${leftSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64 md:w-80'}`}>
          <LeftSidebar collapsed={leftSidebarCollapsed} />
        </aside>
        
        {/* Main Content */}
        {/* Note: center-pane class allows light-mode specific background override */}
        <main
          className="flex-1 p-2 sm:p-4 overflow-y-auto bg-theme-background min-w-0 center-pane"
        >
          <Outlet />
        </main>
        
        {/* Right Sidebar */}
        <aside className={`transition-all duration-300 flex-shrink-0 ${rightSidebarCollapsed ? 'w-0 overflow-hidden' : rightSidebarExpanded ? 'w-96 lg:w-1/2' : 'w-72 md:w-80 lg:w-96'}`}>
          <RightSidebar 
            collapsed={rightSidebarCollapsed} 
            expanded={rightSidebarExpanded}
            onToggleExpansion={toggleRightSidebarExpansion}
          />
        </aside>
      </div>
    </div>
  );
};

export default MainLayout;