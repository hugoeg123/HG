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
      <div className="main-content flex min-h-screen">
        {/* Left Sidebar */}
        <aside className={`transition-all duration-300 ${leftSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64 md:w-80'}`}>
          <LeftSidebar collapsed={leftSidebarCollapsed} />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-4 bg-[#111827] rounded-lg shadow-lg mx-2 my-2 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Right Sidebar */}
        <aside className={`transition-all duration-300 ${rightSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64 md:w-80'}`}>
          <RightSidebar collapsed={rightSidebarCollapsed} />
        </aside>
      </div>
    </div>
  );
};

export default MainLayout;