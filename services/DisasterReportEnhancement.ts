
import { Type } from "@google/genai";

// --- Data Types ---

export interface DisasterMetadata {
  eventId: string;
  disasterType: string;
  severity: number; // 1-10
  detectionTime: string;
  location: {
    region: string;
    country: string;
    coordinates: { lat: number; lon: number };
    affectedAreaSqKm: number;
  };
  satelliteImagery: {
    provider: string;
    date: string;
    resolution: string;
    imageUrl?: string; 
  };
}

export interface RiskAssessment {
  immediateRisk: {
    severity: number;
    description: string;
    timeToImpact: string; 
    populationAtRisk: number;
  };
  trajectoryPrediction: {
    predictedPath: string;
    windInfluence: string;
    spreadRate: string;
    confidence: number; 
  };
  environmentalFactors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    precipitation: number;
  };
}

export interface InterventionAction {
  priority: number; 
  action: string;
  goal: string; // Added to match Farm Report
  impact: string; // Added to match Farm Report
  timing: string;
  responsibleAgency: string;
  resources: string[];
  costLevel: 'Low' | 'Medium' | 'High'; // Added to match Farm Report
  expectedOutcome: string;
}

export interface EvacuationZone {
  zoneId: string;
  name: string;
  population: number;
  evacuationRoute: string;
  timeToEvacuate: string;
}

export interface InterventionStrategy {
  immediateActions: InterventionAction[];
  evacuationPlan: {
    zones: EvacuationZone[];
    shelterLocations: string[];
  };
  resourceAllocation: {
    firefighting: string;
    medical: string;
    emergency: string;
  };
}

export interface MonitoringPhase {
  phase: string;
  actions: string[];
  checkpoints: string[];
}

export interface MonitoringPlan {
  timelinePhases: MonitoringPhase[];
  liveMonitoringPoints: { location: string; metric: string; alertThreshold: string }[];
}

export interface CommunicationStrategy {
  publicAlerts: {
    channels: string[];
    messageFrequency: string;
    keyMessages: string[];
  };
  officialUpdates: {
    authority: string;
    updateFrequency: string;
  };
}

export interface HistoricalContext {
  previousSimilarEvents: {
    event: string;
    year: string;
    impact: string;
  }[];
  regionalRiskProfile: string;
}

export interface DisasterAnalysis {
  metadata: DisasterMetadata;
  riskAssessment: RiskAssessment;
  interventionStrategy: InterventionStrategy;
  monitoringPlan: MonitoringPlan;
  communicationStrategy: CommunicationStrategy;
  historicalContext: HistoricalContext;
  meta: {
    overallConfidenceScore: number;
    disclaimer: string;
    reportVersion?: string;
    generatedAt?: string;
  };
  /**
   * Optional URL for the hosted report to support QR code generation and sharing.
   */
  reportUrl?: string;
}

// --- Gemini Schema Definition ---

export const DISASTER_REPORT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        eventId: { type: Type.STRING },
        disasterType: { type: Type.STRING },
        severity: { type: Type.NUMBER },
        detectionTime: { type: Type.STRING },
        location: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING },
            country: { type: Type.STRING },
            coordinates: { type: Type.OBJECT, properties: { lat: { type: Type.NUMBER }, lon: { type: Type.NUMBER } } },
            affectedAreaSqKm: { type: Type.NUMBER }
          }
        },
        satelliteImagery: {
          type: Type.OBJECT,
          properties: {
            provider: { type: Type.STRING },
            date: { type: Type.STRING },
            resolution: { type: Type.STRING }
          }
        }
      }
    },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        immediateRisk: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.NUMBER },
            description: { type: Type.STRING },
            timeToImpact: { type: Type.STRING },
            populationAtRisk: { type: Type.NUMBER }
          }
        },
        trajectoryPrediction: {
          type: Type.OBJECT,
          properties: {
            predictedPath: { type: Type.STRING },
            windInfluence: { type: Type.STRING },
            spreadRate: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          }
        },
        environmentalFactors: {
          type: Type.OBJECT,
          properties: {
            temperature: { type: Type.NUMBER },
            humidity: { type: Type.NUMBER },
            windSpeed: { type: Type.NUMBER },
            windDirection: { type: Type.STRING },
            precipitation: { type: Type.NUMBER }
          }
        }
      }
    },
    interventionStrategy: {
      type: Type.OBJECT,
      properties: {
        immediateActions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.NUMBER },
              action: { type: Type.STRING },
              goal: { type: Type.STRING },
              impact: { type: Type.STRING },
              timing: { type: Type.STRING },
              responsibleAgency: { type: Type.STRING },
              resources: { type: Type.ARRAY, items: { type: Type.STRING } },
              costLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              expectedOutcome: { type: Type.STRING }
            }
          }
        },
        evacuationPlan: {
          type: Type.OBJECT,
          properties: {
            zones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zoneId: { type: Type.STRING },
                  name: { type: Type.STRING },
                  population: { type: Type.NUMBER },
                  evacuationRoute: { type: Type.STRING },
                  timeToEvacuate: { type: Type.STRING }
                }
              }
            },
            shelterLocations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        resourceAllocation: {
          type: Type.OBJECT,
          properties: {
            firefighting: { type: Type.STRING },
            medical: { type: Type.STRING },
            emergency: { type: Type.STRING }
          }
        }
      }
    },
    monitoringPlan: {
      type: Type.OBJECT,
      properties: {
        timelinePhases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              checkpoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        liveMonitoringPoints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              metric: { type: Type.STRING },
              alertThreshold: { type: Type.STRING }
            }
          }
        }
      }
    },
    communicationStrategy: {
      type: Type.OBJECT,
      properties: {
        publicAlerts: {
          type: Type.OBJECT,
          properties: {
            channels: { type: Type.ARRAY, items: { type: Type.STRING } },
            messageFrequency: { type: Type.STRING },
            keyMessages: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        officialUpdates: {
          type: Type.OBJECT,
          properties: {
            authority: { type: Type.STRING },
            updateFrequency: { type: Type.STRING }
          }
        }
      }
    },
    historicalContext: {
      type: Type.OBJECT,
      properties: {
        previousSimilarEvents: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              event: { type: Type.STRING },
              year: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        },
        regionalRiskProfile: { type: Type.STRING }
      }
    },
    meta: {
      type: Type.OBJECT,
      properties: {
        overallConfidenceScore: { type: Type.NUMBER },
        disclaimer: { type: Type.STRING }
      }
    }
  }
};
