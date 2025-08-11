import { useState, useEffect } from 'react';

export function useSidebarOffset() {
  const [sidebarLeft, setSidebarLeft] = useState(0);

  useEffect(() => {
    const updateLeft = () => {
      const sidebar = document.getElementById('partner-sidebar');
      if (sidebar) {
        // Check if sidebar is collapsed (width is 20 = 5rem = 80px)
        const isCollapsed = sidebar.offsetWidth <= 80;
        setSidebarLeft(isCollapsed ? 0 : sidebar.offsetWidth);
      } else {
        setSidebarLeft(0);
      }
    };

    // Initial calculation
    updateLeft();

    // Listen for resize events
    window.addEventListener('resize', updateLeft);

    // Listen for sidebar collapse/expand (using MutationObserver)
    const observer = new MutationObserver(updateLeft);
    const sidebar = document.getElementById('partner-sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateLeft);
      observer.disconnect();
    };
  }, []);

  return sidebarLeft;
} 