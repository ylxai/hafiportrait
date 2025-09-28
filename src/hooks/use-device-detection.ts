'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  prefersReducedMotion: boolean;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  connectionType?: string;
  isLowEndDevice: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    prefersReducedMotion: false,
    viewportWidth: 1024,
    viewportHeight: 768,
    devicePixelRatio: 1,
    isLowEndDevice: false,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      // Viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const devicePixelRatio = window.devicePixelRatio || 1;

      // Device type detection
      const isMobile = viewportWidth < 768;
      const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
      const isDesktop = viewportWidth >= 1024;

      // Touch detection
      const isTouchDevice = 'ontouchstart' in window ||
                           navigator.maxTouchPoints > 0 ||
                           'msMaxTouchPoints' in window;

      // Platform detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      // Browser detection
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);

      // Accessibility preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Connection info (if available)
      let connectionType: string | undefined;
      let isLowEndDevice = false;

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection?.effectiveType;

        // Detect low-end devices based on connection and hardware
        isLowEndDevice = connectionType === 'slow-2g' ||
                        connectionType === '2g' ||
                        connection?.saveData === true ||
                        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      }

      // Fallback for devices without connection API
      if (!connectionType) {
        isLowEndDevice = (devicePixelRatio < 1.5 && viewportWidth < 375) ||
                        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        prefersReducedMotion,
        viewportWidth,
        viewportHeight,
        devicePixelRatio,
        connectionType,
        isLowEndDevice,
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Update on resize and orientation change
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateDeviceInfo);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateDeviceInfo);
      }
    };
  }, []);

  return deviceInfo;
}

// Helper hooks for specific use cases
export function useIsMobile(): boolean {
  return useDeviceDetection().isMobile;
}

export function useIsTouchDevice(): boolean {
  return useDeviceDetection().isTouchDevice;
}

export function useShouldUseNativeViewer(): boolean {
  const device = useDeviceDetection();
  return device.isIOS || device.isAndroid;
}

export function useLightboxType(): 'stories' | 'paging' | 'traditional' {
  const device = useDeviceDetection();

  if (device.isMobile && device.isTouchDevice && !device.prefersReducedMotion) {
    return 'stories'; // Mobile dengan gestures
  } else if (device.isMobile) {
    return 'paging'; // Mobile tanpa gestures
  } else {
    return 'traditional'; // Desktop
  }
}