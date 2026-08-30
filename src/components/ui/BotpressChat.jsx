import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BotpressChat = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/account/admin');

  useEffect(() => {
    // Ensure scripts are loaded exactly once globally
    if (!document.getElementById('botpress-inject')) {
      const injectScript = document.createElement('script');
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v3.7/inject.js';
      injectScript.id = 'botpress-inject';
      document.body.appendChild(injectScript);

      const configScript = document.createElement('script');
      configScript.src = 'https://files.bpcontent.cloud/2026/08/30/06/20260830062132-WM4LPJM5.js';
      configScript.id = 'botpress-config';
      configScript.defer = true;
      document.body.appendChild(configScript);
    }
  }, []);

  useEffect(() => {
    // Manage visibility and layout overrides based on route
    const styleId = 'bp-custom-overrides';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    if (isAdminRoute) {
      styleEl.innerHTML = `
        /* Hide Botpress on admin routes to prevent overlapping Admin Panel tables */
        #bp-web-widget, .bpFabContainer, .bp-widget-widget {
          display: none !important;
        }
      `;
    } else {
      styleEl.innerHTML = `
        /* Ensure Botpress stays above everything */
        #bp-web-widget, .bpFabContainer, .bp-widget-widget {
          z-index: 9998 !important;
        }

        /* Prevent the opened chat window from being stuck behind elements */
        .bp-window-container, .bpWidgetWindow {
          z-index: 9999 !important;
        }
      `;
    }
  }, [isAdminRoute]);

  return null;
};

export default BotpressChat;
