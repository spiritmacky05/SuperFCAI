import { useState, useEffect } from 'react';

// Mock AdMob SDK types for demonstration
type AdEvent = 'loaded' | 'dismissed' | 'failed';
type AdCallback = () => void;

class AdService {
  private static instance: AdService;
  private isInitialized = false;
  private isAdLoaded = false;
  private isLoading = false;
  private showCallback: AdCallback | null = null;
  
  // Configuration
  private readonly PROBABILITY = 0.25; // 1 in 4 chance
  private readonly MOCK_LOAD_TIME = 1500; // 1.5s simulated network delay

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  /**
   * Initialize the "AdMob SDK"
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    console.log('[AdService] Initializing SDK...');
    this.isInitialized = true;
    
    // Start loading the first ad in the background
    this.loadInterstitial();
  }

  /**
   * Loads an interstitial ad in the background
   */
  public loadInterstitial(): void {
    if (this.isLoading || this.isAdLoaded) return;

    this.isLoading = true;
    console.log('[AdService] Loading ad in background...');

    // Simulate network request
    setTimeout(() => {
      this.isAdLoaded = true;
      this.isLoading = false;
      console.log('[AdService] Ad loaded and ready.');
    }, this.MOCK_LOAD_TIME);
  }

  /**
   * Registers a callback to actually render the ad in the UI
   * (Since we are in a web environment, we need a React component to render the overlay)
   */
  public setOnShowListener(callback: AdCallback): void {
    this.showCallback = callback;
  }

  /**
   * Attempts to show an ad based on probability logic
   * @returns boolean - true if ad logic was triggered (even if ad wasn't ready), false otherwise
   */
  public showRandomAd(): boolean {
    if (!this.isInitialized) {
      console.warn('[AdService] SDK not initialized');
      return false;
    }

    // 1. Probability Logic (1 in 4 chance)
    const shouldShow = Math.random() < this.PROBABILITY;
    
    if (!shouldShow) {
      console.log('[AdService] Random trigger: Skipped (Probability check failed)');
      return false;
    }

    console.log('[AdService] Random trigger: HIT!');

    // 2. Check if ad is ready ("Graceful handling")
    if (this.isAdLoaded && this.showCallback) {
      console.log('[AdService] Showing Interstitial Ad...');
      this.showCallback();
      
      // 3. Memory Management / Cleanup
      // In a real SDK, showing the ad usually consumes it.
      this.disposeCurrentAd();
      return true;
    } else {
      console.log('[AdService] Ad triggered but not ready. Skipping gracefully.');
      // Optionally try to load again if we missed it
      this.loadInterstitial();
      return false;
    }
  }

  /**
   * "Disposes" of the used ad and preloads the next one
   */
  private disposeCurrentAd(): void {
    this.isAdLoaded = false;
    // Preload the next one automatically
    this.loadInterstitial();
  }
}

export const adService = AdService.getInstance();
