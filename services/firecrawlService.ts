// Credit tracking interface
interface CreditUsage {
  total: number;
  agent: number;
  crawl: number;
  search: number;
  scrape: number;
  lastReset: Date;
}

class FirecrawlService {
  private creditUsage: CreditUsage;
  private monthlyLimit: number = Number(import.meta.env.VITE_FIRECRAWL_MONTHLY_CREDITS) || 600;

  constructor() {
    // Load credit usage from localStorage
    const saved = localStorage.getItem('firecrawl-credit-usage');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.creditUsage = {
        ...parsed,
        lastReset: new Date(parsed.lastReset)
      };
    } else {
      this.creditUsage = {
        total: 0,
        agent: 0,
        crawl: 0,
        search: 0,
        scrape: 0,
        lastReset: new Date()
      };
    }

    // Check if we need to reset monthly usage
    this.checkMonthlyReset();
  }

  private checkMonthlyReset(): void {
    const now = new Date();
    const lastReset = this.creditUsage.lastReset;

    // Reset if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      this.creditUsage = {
        total: 0,
        agent: 0,
        crawl: 0,
        search: 0,
        scrape: 0,
        lastReset: now
      };
      this.saveCreditUsage();
    }
  }

  private saveCreditUsage(): void {
    localStorage.setItem('firecrawl-credit-usage', JSON.stringify(this.creditUsage));
  }

  private canMakeRequest(estimatedCost: number): boolean {
    return (this.creditUsage.total + estimatedCost) <= this.monthlyLimit;
  }

  // Alert when approaching credit limit
  private checkCreditAlert(): void {
    const percentageUsed = (this.creditUsage.total / this.monthlyLimit) * 100;
    if (percentageUsed >= 80) {
      console.warn(`Firecrawl credit usage: ${this.creditUsage.total}/${this.monthlyLimit} (${Math.round(percentageUsed)}%)`);
    }
  }

  // Method 1: Autonomous crop analysis (agent) - 15-20 credits
  async autonomousCropAnalysis(query: string): Promise<any> {
    try {
      // Check if we have enough credits (estimated 20 credits)
      if (!this.canMakeRequest(20)) {
        console.warn('Not enough Firecrawl credits for agent analysis');
        return null;
      }

      // Call our API endpoint which handles the Firecrawl call server-side
      const response = await fetch('/api/firecrawl-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          analysisType: 'deep-analysis'
        })
      });

      const result = await response.json();

      if (result.success && result.data.firecrawlInsights) {
        // Update credit usage (estimate 20 credits for agent)
        this.creditUsage.agent += 20;
        this.creditUsage.total += 20;
        this.saveCreditUsage();
        this.checkCreditAlert();

        return result.data.firecrawlInsights;
      }

      return null;
    } catch (error) {
      console.error('Firecrawl agent analysis failed:', error);
      return null; // Return null on failure, don't throw
    }
  }

  // Method 2: Crawl agricultural portal - 30-50 credits
  async crawlAgriculturalPortal(url: string): Promise<any> {
    try {
      // Check if we have enough credits (estimated 50 credits)
      if (!this.canMakeRequest(50)) {
        console.warn('Not enough Firecrawl credits for crawl operation');
        return null;
      }

      // Call our API endpoint which handles the Firecrawl call server-side
      const response = await fetch('/api/firecrawl-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          analysisType: 'portal-sync'
        })
      });

      const result = await response.json();

      if (result.success && result.data.firecrawlInsights) {
        // Update credit usage (estimate 50 credits for crawl)
        this.creditUsage.crawl += 50;
        this.creditUsage.total += 50;
        this.saveCreditUsage();
        this.checkCreditAlert();

        return result.data.firecrawlInsights;
      }

      return null;
    } catch (error) {
      console.error('Firecrawl crawl operation failed:', error);
      return null; // Return null on failure, don't throw
    }
  }

  // Method 3: Search crop health - 5-10 credits
  async searchCropHealth(query: string): Promise<any> {
    try {
      // Check if we have enough credits (estimated 10 credits)
      if (!this.canMakeRequest(10)) {
        console.warn('Not enough Firecrawl credits for search operation');
        return null;
      }

      // Call our API endpoint which handles the Firecrawl call server-side
      const response = await fetch('/api/firecrawl-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          analysisType: 'quick-search'
        })
      });

      const result = await response.json();

      if (result.success && result.data.firecrawlInsights) {
        // Update credit usage (estimate 10 credits for search)
        this.creditUsage.search += 10;
        this.creditUsage.total += 10;
        this.saveCreditUsage();
        this.checkCreditAlert();

        return result.data.firecrawlInsights;
      }

      return null;
    } catch (error) {
      console.error('Firecrawl search operation failed:', error);
      return null; // Return null on failure, don't throw
    }
  }

  // Method 4: Scrape agri data - 3-5 credits
  async scrapeAgriData(url: string): Promise<any> {
    try {
      // Check if we have enough credits (estimated 5 credits)
      if (!this.canMakeRequest(5)) {
        console.warn('Not enough Firecrawl credits for scrape operation');
        return null;
      }

      // Call our API endpoint which handles the Firecrawl call server-side
      const response = await fetch('/api/firecrawl-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          analysisType: 'scrape'
        })
      });

      const result = await response.json();

      if (result.success && result.data.firecrawlInsights) {
        // Update credit usage (estimate 5 credits for scrape)
        this.creditUsage.scrape += 5;
        this.creditUsage.total += 5;
        this.saveCreditUsage();
        this.checkCreditAlert();

        return result.data.firecrawlInsights;
      }

      return null;
    } catch (error) {
      console.error('Firecrawl scrape operation failed:', error);
      return null; // Return null on failure, don't throw
    }
  }

  // Get current credit usage
  getCreditUsage(): CreditUsage {
    this.checkMonthlyReset(); // Ensure we have current data
    return { ...this.creditUsage };
  }

  // Check if we should throttle expensive operations
  shouldThrottleExpensiveOperations(): boolean {
    return this.creditUsage.total > 500; // Throttle if over 500 credits used
  }

  // Get available operations based on credit status
  getAvailableOperations(): {
    agent: boolean;
    crawl: boolean;
    search: boolean;
    scrape: boolean;
  } {
    return {
      agent: this.canMakeRequest(20) && !this.shouldThrottleExpensiveOperations(),
      crawl: this.canMakeRequest(50) && !this.shouldThrottleExpensiveOperations(),
      search: this.canMakeRequest(10),
      scrape: this.canMakeRequest(5)
    };
  }
}

// Export a singleton instance
export const firecrawlService = new FirecrawlService();

// Export the interface for type safety
export type { CreditUsage };