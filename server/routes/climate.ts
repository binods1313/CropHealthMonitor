
import express from 'express';

const router = express.Router();

// --- EPA & Calculation Factors (2025 Estimates) ---
// Units: tonnes CO2e
const FACTORS = {
    electricity: 0.000385, // t CO2 per kWh (US Grid Avg)
    car: 0.000304,         // t CO2 per mile (Avg Passenger Vehicle)
    flightPerHour: 0.09,   // t CO2 per flight hour (radiative forcing included)
    diet: {
        vegan: 1.5,
        vegetarian: 2.2,
        omnivore: 2.5
    },
    waste: 1.2             // t CO2/year baseline per person
};

// Regional Context (US Average ~16t per capita)
const REGIONAL_AVERAGE = 16.0;

interface MitigationOption {
    id: string;
    name: string;
    category: 'energy' | 'transportation' | 'diet' | 'flying' | 'waste';
    reductionTonnes: number;
    estimatedCostUSD: number;
    costPerTonne: number;
    description: string;
}

// --- Helper: Generate Mitigations ---
const generateMitigations = (breakdown: any, inputs: any): MitigationOption[] => {
    const suggestions: MitigationOption[] = [];

    // 1. Energy: Solar Panels
    if (breakdown.energy > 2.0) {
        const reduction = breakdown.energy * 0.85; // Assume 85% offset
        const cost = 15000; // After incentives
        suggestions.push({
            id: 'solar',
            name: 'Install Rooftop Solar',
            category: 'energy',
            reductionTonnes: Number(reduction.toFixed(2)),
            estimatedCostUSD: cost,
            costPerTonne: Number((cost / (reduction * 20)).toFixed(2)), // amortized 20yrs
            description: 'Generate your own clean energy to offset grid usage.'
        });
    }

    // 2. Transport: EV
    if (breakdown.transportation > 2.5) {
        const reduction = breakdown.transportation * 0.60; // Grid dependent
        const cost = 35000; 
        suggestions.push({
            id: 'ev',
            name: 'Switch to Electric Vehicle',
            category: 'transportation',
            reductionTonnes: Number(reduction.toFixed(2)),
            estimatedCostUSD: cost,
            costPerTonne: Number((cost / (reduction * 10)).toFixed(2)), // amortized 10yrs
            description: 'Replace gas miles with electric miles.'
        });
    }

    // 3. Diet: Plant-Based
    if (inputs.dietType === 'omnivore') {
        const reduction = FACTORS.diet.omnivore - FACTORS.diet.vegetarian;
        suggestions.push({
            id: 'diet_veg',
            name: 'Adopt Vegetarian Diet',
            category: 'diet',
            reductionTonnes: Number(reduction.toFixed(2)),
            estimatedCostUSD: 0,
            costPerTonne: 0,
            description: 'Reduce emissions from livestock and land use.'
        });
    }

    // 4. Flying: Offset
    if (breakdown.flying > 1.0) {
        const reduction = breakdown.flying;
        const cost = breakdown.flying * 15; // ~$15/tonne offset
        suggestions.push({
            id: 'flight_offset',
            name: 'High-Quality Carbon Offsets',
            category: 'flying',
            reductionTonnes: Number(reduction.toFixed(2)),
            estimatedCostUSD: Number(cost.toFixed(0)),
            costPerTonne: 15,
            description: 'Invest in verified projects to balance flight emissions.'
        });
    }

    return suggestions.sort((a, b) => b.reductionTonnes - a.reductionTonnes);
};

// --- POST /footprint ---
router.post('/footprint', (req, res) => {
    try {
        const {
            monthlyEnergyKwh = 0,
            monthlyCarMiles = 0,
            annualFlightHours = 0,
            dietType = 'omnivore',
            wasteLevel = 'average' // placeholder for future scaling
        } = req.body;

        // 1. Calculate Components
        const energyCarbon = Number(monthlyEnergyKwh) * 12 * FACTORS.electricity;
        const transportCarbon = Number(monthlyCarMiles) * 12 * FACTORS.car;
        const flightCarbon = Number(annualFlightHours) * FACTORS.flightPerHour;
        
        // Safe diet lookup
        const dType = (dietType in FACTORS.diet) ? dietType : 'omnivore';
        const dietCarbon = FACTORS.diet[dType as keyof typeof FACTORS.diet];
        
        const wasteCarbon = FACTORS.waste; // Fixed for now

        const total = energyCarbon + transportCarbon + flightCarbon + dietCarbon + wasteCarbon;

        const breakdown = {
            energy: Number(energyCarbon.toFixed(2)),
            transportation: Number(transportCarbon.toFixed(2)),
            flying: Number(flightCarbon.toFixed(2)),
            diet: Number(dietCarbon.toFixed(2)),
            waste: Number(wasteCarbon.toFixed(2))
        };

        // 2. Regional Comparison
        const diff = total - REGIONAL_AVERAGE;
        const percentile_difference = Number(((diff / REGIONAL_AVERAGE) * 100).toFixed(1));
        let your_status: 'above' | 'below' | 'equal' = 'equal';
        if (percentile_difference > 5) your_status = 'above';
        if (percentile_difference < -5) your_status = 'below';

        // 3. Mitigations
        const mitigations = generateMitigations(breakdown, { dietType });

        // 4. Response
        res.json({
            footprint: {
                total: Number(total.toFixed(2)),
                breakdown
            },
            regional: {
                regional_average: REGIONAL_AVERAGE,
                percentile_difference,
                your_status
            },
            mitigations,
            meta: {
                factors_source: "EPA 2025 Projections & Scientific Literature",
                version: "1.0.0"
            }
        });

    } catch (error: any) {
        console.error("Climate API Error:", error);
        res.status(500).json({ error: "Failed to calculate footprint", details: error.message });
    }
});

export default router;
