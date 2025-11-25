/**
 * Custom hook สำหรับ Config data
 * ใช้ ConfigService instance
 */

import { useState, useEffect } from 'react';
import { ConfigService, WeddingConfig, WeddingCardConfigFirebase } from '@/services/firebase/ConfigService';
import { logger } from '@/utils/logger';

export const useConfig = (isEnabled: boolean = true) => {
  const [config, setConfig] = useState<WeddingConfig | null>(null);
  const [weddingCardConfig, setWeddingCardConfig] = useState<WeddingCardConfigFirebase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const configService = ConfigService.getInstance();

    // Load initial data
    Promise.all([
      configService.getConfig(),
      configService.getWeddingCardConfig(),
    ])
      .then(([configData, cardConfigData]) => {
        setConfig(configData);
        setWeddingCardConfig(cardConfigData);
        setIsLoading(false);
      })
      .catch((error) => {
        logger.error('Error loading config:', error);
        setIsLoading(false);
      });

    // Subscribe to wedding card config changes
    const unsubscribe = configService.subscribeWeddingCardConfig((data) => {
      setWeddingCardConfig(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isEnabled]);

  return {
    config,
    weddingCardConfig,
    isLoading,
  };
};

