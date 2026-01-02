
import { SchemaType } from "@google/generative-ai";

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
  type: SchemaType.OBJECT,
  properties: {
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        eventId: { type: SchemaType.STRING },
        disasterType: { type: SchemaType.STRING },
        severity: { type: SchemaType.NUMBER },
        detectionTime: { type: SchemaType.STRING },
        location: {
          type: SchemaType.OBJECT,
          properties: {
            region: { type: SchemaType.STRING },
            country: { type: SchemaType.STRING },
            coordinates: { type: SchemaType.OBJECT, properties: { lat: { type: SchemaType.NUMBER }, lon: { type: SchemaType.NUMBER } } },
            affectedAreaSqKm: { type: SchemaType.NUMBER }
          }
        },
        satelliteImagery: {
          type: SchemaType.OBJECT,
          properties: {
            provider: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
            resolution: { type: SchemaType.STRING }
          }
        }
      }
    },
    riskAssessment: {
      type: SchemaType.OBJECT,
      properties: {
        immediateRisk: {
          type: SchemaType.OBJECT,
          properties: {
            severity: { type: SchemaType.NUMBER },
            description: { type: SchemaType.STRING },
            timeToImpact: { type: SchemaType.STRING },
            populationAtRisk: { type: SchemaType.NUMBER }
          }
        },
        trajectoryPrediction: {
          type: SchemaType.OBJECT,
          properties: {
            predictedPath: { type: SchemaType.STRING },
            windInfluence: { type: SchemaType.STRING },
            spreadRate: { type: SchemaType.STRING },
            confidence: { type: SchemaType.NUMBER }
          }
        },
        environmentalFactors: {
          type: SchemaType.OBJECT,
          properties: {
            temperature: { type: SchemaType.NUMBER },
            humidity: { type: SchemaType.NUMBER },
            windSpeed: { type: SchemaType.NUMBER },
            windDirection: { type: SchemaType.STRING },
            precipitation: { type: SchemaType.NUMBER }
          }
        }
      }
    },
    interventionStrategy: {
      type: SchemaType.OBJECT,
      properties: {
        immediateActions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              priority: { type: SchemaType.NUMBER },
              action: { type: SchemaType.STRING },
              goal: { type: SchemaType.STRING },
              impact: { type: SchemaType.STRING },
              timing: { type: SchemaType.STRING },
              responsibleAgency: { type: SchemaType.STRING },
              resources: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              costLevel: { type: SchemaType.STRING, enum: ["Low", "Medium", "High"] },
              expectedOutcome: { type: SchemaType.STRING }
            }
          }
        },
        evacuationPlan: {
          type: SchemaType.OBJECT,
          properties: {
            zones: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  zoneId: { type: SchemaType.STRING },
                  name: { type: SchemaType.STRING },
                  population: { type: SchemaType.NUMBER },
                  evacuationRoute: { type: SchemaType.STRING },
                  timeToEvacuate: { type: SchemaType.STRING }
                }
              }
            },
            shelterLocations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
          }
        },
        resourceAllocation: {
          type: SchemaType.OBJECT,
          properties: {
            firefighting: { type: SchemaType.STRING },
            medical: { type: SchemaType.STRING },
            emergency: { type: SchemaType.STRING }
          }
        }
      }
    },
    monitoringPlan: {
      type: SchemaType.OBJECT,
      properties: {
        timelinePhases: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              phase: { type: SchemaType.STRING },
              actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              checkpoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
          }
        },
        liveMonitoringPoints: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              location: { type: SchemaType.STRING },
              metric: { type: SchemaType.STRING },
              alertThreshold: { type: SchemaType.STRING }
            }
          }
        }
      }
    },
    communicationStrategy: {
      type: SchemaType.OBJECT,
      properties: {
        publicAlerts: {
          type: SchemaType.OBJECT,
          properties: {
            channels: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            messageFrequency: { type: SchemaType.STRING },
            keyMessages: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
          }
        },
        officialUpdates: {
          type: SchemaType.OBJECT,
          properties: {
            authority: { type: SchemaType.STRING },
            updateFrequency: { type: SchemaType.STRING }
          }
        }
      }
    },
    historicalContext: {
      type: SchemaType.OBJECT,
      properties: {
        previousSimilarEvents: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              event: { type: SchemaType.STRING },
              year: { type: SchemaType.STRING },
              impact: { type: SchemaType.STRING }
            }
          }
        },
        regionalRiskProfile: { type: SchemaType.STRING }
      }
    },
    meta: {
      type: SchemaType.OBJECT,
      properties: {
        overallConfidenceScore: { type: SchemaType.NUMBER },
        disclaimer: { type: SchemaType.STRING }
      }
    }
  }
};
