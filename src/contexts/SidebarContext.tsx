import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  sidebarLeft: number;
  isCollapsed: boolean;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  sidebarLeft: 0,
  isCollapsed: false,
  isMobile: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarLeft, setSidebarLeft] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSidebarState = () => {
      const sidebar = document.getElementById('partner-sidebar');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        const collapsed = width <= 80; // 5rem = 80px
        setSidebarLeft(collapsed ? 0 : width);
        setIsCollapsed(collapsed);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      updateSidebarState();
    };

    // Initial setup
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Listen for sidebar class changes (collapse/expand)
    const observer = new MutationObserver(updateSidebarState);
    const sidebar = document.getElementById('partner-sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebarLeft, isCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 