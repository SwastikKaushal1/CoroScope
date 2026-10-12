import type { PredictionResponse } from "./types";

/**
 * A real /predict response for the high-risk dataset patient (GET /presets), saved so the
 * results page can be previewed with /results?demo, or used offline when the API is down.
 * Regenerate after retraining: python scripts/make_mock.py
 */
export const MOCK_RESULT: PredictionResponse = {
 "predictions": {
  "CAD": {
   "probability": 0.9905,
   "threshold": 0.8096,
   "predicted_positive": true,
   "risk_level": "high",
   "model": "random_forest",
   "explanation": [
    {
     "feature": "Typical Chest Pain",
     "value": 1.0,
     "contribution": 0.0827,
     "share_pct": 16.9,
     "direction": "increases risk"
    },
    {
     "feature": "Region RWMA",
     "value": 3.0,
     "contribution": 0.0706,
     "share_pct": 14.5,
     "direction": "increases risk"
    },
    {
     "feature": "Atypical",
     "value": 0.0,
     "contribution": 0.0351,
     "share_pct": 7.2,
     "direction": "increases risk"
    },
    {
     "feature": "Age",
     "value": 63.0,
     "contribution": 0.0336,
     "share_pct": 6.9,
     "direction": "increases risk"
    },
    {
     "feature": "EF-TTE",
     "value": 20.0,
     "contribution": 0.0278,
     "share_pct": 5.7,
     "direction": "increases risk"
    },
    {
     "feature": "TG",
     "value": 195.0,
     "contribution": 0.0255,
     "share_pct": 5.2,
     "direction": "increases risk"
    },
    {
     "feature": "FBS",
     "value": 142.0,
     "contribution": 0.0251,
     "share_pct": 5.1,
     "direction": "increases risk"
    },
    {
     "feature": "Tinversion",
     "value": 1.0,
     "contribution": 0.0206,
     "share_pct": 4.2,
     "direction": "increases risk"
    },
    {
     "feature": "DM",
     "value": 1.0,
     "contribution": 0.0202,
     "share_pct": 4.1,
     "direction": "increases risk"
    },
    {
     "feature": "ESR",
     "value": 30.0,
     "contribution": 0.0187,
     "share_pct": 3.8,
     "direction": "increases risk"
    },
    {
     "feature": "HTN",
     "value": 1.0,
     "contribution": 0.0168,
     "share_pct": 3.4,
     "direction": "increases risk"
    },
    {
     "feature": "BP",
     "value": 140.0,
     "contribution": 0.0142,
     "share_pct": 2.9,
     "direction": "increases risk"
    },
    {
     "feature": "PLT",
     "value": 131.0,
     "contribution": 0.0108,
     "share_pct": 2.2,
     "direction": "increases risk"
    },
    {
     "feature": "HB",
     "value": 11.0,
     "contribution": 0.0093,
     "share_pct": 1.9,
     "direction": "increases risk"
    },
    {
     "feature": "K",
     "value": 4.5,
     "contribution": 0.0084,
     "share_pct": 1.7,
     "direction": "increases risk"
    },
    {
     "feature": "BMI",
     "value": 28.73469387755102,
     "contribution": 0.0074,
     "share_pct": 1.5,
     "direction": "increases risk"
    },
    {
     "feature": "Nonanginal",
     "value": 0.0,
     "contribution": 0.0069,
     "share_pct": 1.4,
     "direction": "increases risk"
    },
    {
     "feature": "PR",
     "value": 80.0,
     "contribution": 0.0066,
     "share_pct": 1.4,
     "direction": "increases risk"
    },
    {
     "feature": "LDL",
     "value": 77.0,
     "contribution": 0.006,
     "share_pct": 1.2,
     "direction": "increases risk"
    },
    {
     "feature": "BUN",
     "value": 20.0,
     "contribution": 0.0047,
     "share_pct": 1.0,
     "direction": "increases risk"
    },
    {
     "feature": "Lymph",
     "value": 29.0,
     "contribution": 0.0045,
     "share_pct": 0.9,
     "direction": "increases risk"
    },
    {
     "feature": "HDL",
     "value": 25.0,
     "contribution": 0.0041,
     "share_pct": 0.8,
     "direction": "increases risk"
    },
    {
     "feature": "Poor R Progression",
     "value": 1.0,
     "contribution": 0.0038,
     "share_pct": 0.8,
     "direction": "increases risk"
    },
    {
     "feature": "Neut",
     "value": 61.0,
     "contribution": 0.0036,
     "share_pct": 0.7,
     "direction": "increases risk"
    },
    {
     "feature": "Dyspnea",
     "value": 0.0,
     "contribution": 0.0035,
     "share_pct": 0.7,
     "direction": "increases risk"
    },
    {
     "feature": "BBB",
     "value": "N",
     "contribution": 0.0024,
     "share_pct": 0.5,
     "direction": "increases risk"
    },
    {
     "feature": "Current Smoker",
     "value": 1.0,
     "contribution": 0.0022,
     "share_pct": 0.5,
     "direction": "increases risk"
    },
    {
     "feature": "Length",
     "value": 175.0,
     "contribution": 0.0019,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "Na",
     "value": 140.0,
     "contribution": 0.0019,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "VHD",
     "value": "N",
     "contribution": 0.0017,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "Sex",
     "value": 1.0,
     "contribution": 0.0015,
     "share_pct": 0.3,
     "direction": "increases risk"
    },
    {
     "feature": "St Depression",
     "value": 0.0,
     "contribution": -0.0011,
     "share_pct": 0.2,
     "direction": "decreases risk"
    },
    {
     "feature": "Weight",
     "value": 88.0,
     "contribution": 0.0009,
     "share_pct": 0.2,
     "direction": "increases risk"
    },
    {
     "feature": "DLP",
     "value": 0.0,
     "contribution": 0.0007,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "Diastolic Murmur",
     "value": 0.0,
     "contribution": 0.0007,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "Systolic Murmur",
     "value": 0.0,
     "contribution": 0.0006,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "Q Wave",
     "value": 0.0,
     "contribution": -0.0004,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "FH",
     "value": 0.0,
     "contribution": -0.0003,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "Thyroid Disease",
     "value": 0.0,
     "contribution": 0.0003,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "St Elevation",
     "value": 0.0,
     "contribution": -0.0002,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CVA",
     "value": 0.0,
     "contribution": 0.0002,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "LVH",
     "value": 0.0,
     "contribution": 0.0002,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Edema",
     "value": 0.0,
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "CR",
     "value": 1.2,
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Lung rales",
     "value": 0.0,
     "contribution": -0.0001,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CRF",
     "value": 0.0,
     "contribution": -0.0001,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "EX-Smoker",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Airway disease",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "WBC",
     "value": 4700.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Weak Peripheral Pulse",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Obesity",
     "value": 1.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LowTH Ang",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CHF",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Function Class",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "increases risk"
    }
   ]
  },
  "LAD": {
   "probability": 0.9613,
   "threshold": 0.5891,
   "predicted_positive": true,
   "risk_level": "high",
   "model": "random_forest",
   "explanation": [
    {
     "feature": "Region RWMA",
     "value": 3.0,
     "contribution": 0.0763,
     "share_pct": 18.6,
     "direction": "increases risk"
    },
    {
     "feature": "Typical Chest Pain",
     "value": 1.0,
     "contribution": 0.0583,
     "share_pct": 14.2,
     "direction": "increases risk"
    },
    {
     "feature": "EF-TTE",
     "value": 20.0,
     "contribution": 0.0483,
     "share_pct": 11.8,
     "direction": "increases risk"
    },
    {
     "feature": "Atypical",
     "value": 0.0,
     "contribution": 0.0272,
     "share_pct": 6.6,
     "direction": "increases risk"
    },
    {
     "feature": "ESR",
     "value": 30.0,
     "contribution": 0.026,
     "share_pct": 6.3,
     "direction": "increases risk"
    },
    {
     "feature": "WBC",
     "value": 4700.0,
     "contribution": -0.0211,
     "share_pct": 5.1,
     "direction": "decreases risk"
    },
    {
     "feature": "Age",
     "value": 63.0,
     "contribution": 0.0211,
     "share_pct": 5.1,
     "direction": "increases risk"
    },
    {
     "feature": "Tinversion",
     "value": 1.0,
     "contribution": 0.0166,
     "share_pct": 4.0,
     "direction": "increases risk"
    },
    {
     "feature": "PR",
     "value": 80.0,
     "contribution": 0.0131,
     "share_pct": 3.2,
     "direction": "increases risk"
    },
    {
     "feature": "Lymph",
     "value": 29.0,
     "contribution": 0.0096,
     "share_pct": 2.3,
     "direction": "increases risk"
    },
    {
     "feature": "FBS",
     "value": 142.0,
     "contribution": 0.0094,
     "share_pct": 2.3,
     "direction": "increases risk"
    },
    {
     "feature": "BP",
     "value": 140.0,
     "contribution": 0.0088,
     "share_pct": 2.1,
     "direction": "increases risk"
    },
    {
     "feature": "TG",
     "value": 195.0,
     "contribution": 0.0087,
     "share_pct": 2.1,
     "direction": "increases risk"
    },
    {
     "feature": "Neut",
     "value": 61.0,
     "contribution": 0.0082,
     "share_pct": 2.0,
     "direction": "increases risk"
    },
    {
     "feature": "HTN",
     "value": 1.0,
     "contribution": 0.007,
     "share_pct": 1.7,
     "direction": "increases risk"
    },
    {
     "feature": "HB",
     "value": 11.0,
     "contribution": 0.0057,
     "share_pct": 1.4,
     "direction": "increases risk"
    },
    {
     "feature": "LDL",
     "value": 77.0,
     "contribution": -0.005,
     "share_pct": 1.2,
     "direction": "decreases risk"
    },
    {
     "feature": "Weight",
     "value": 88.0,
     "contribution": -0.0041,
     "share_pct": 1.0,
     "direction": "decreases risk"
    },
    {
     "feature": "VHD",
     "value": "N",
     "contribution": -0.004,
     "share_pct": 1.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Sex",
     "value": 1.0,
     "contribution": 0.0038,
     "share_pct": 0.9,
     "direction": "increases risk"
    },
    {
     "feature": "K",
     "value": 4.5,
     "contribution": 0.0031,
     "share_pct": 0.8,
     "direction": "increases risk"
    },
    {
     "feature": "DM",
     "value": 1.0,
     "contribution": 0.0028,
     "share_pct": 0.7,
     "direction": "increases risk"
    },
    {
     "feature": "Na",
     "value": 140.0,
     "contribution": 0.0025,
     "share_pct": 0.6,
     "direction": "increases risk"
    },
    {
     "feature": "Nonanginal",
     "value": 0.0,
     "contribution": 0.0025,
     "share_pct": 0.6,
     "direction": "increases risk"
    },
    {
     "feature": "Dyspnea",
     "value": 0.0,
     "contribution": 0.0025,
     "share_pct": 0.6,
     "direction": "increases risk"
    },
    {
     "feature": "Current Smoker",
     "value": 1.0,
     "contribution": 0.002,
     "share_pct": 0.5,
     "direction": "increases risk"
    },
    {
     "feature": "DLP",
     "value": 0.0,
     "contribution": 0.002,
     "share_pct": 0.5,
     "direction": "increases risk"
    },
    {
     "feature": "HDL",
     "value": 25.0,
     "contribution": 0.0018,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "St Depression",
     "value": 0.0,
     "contribution": -0.0017,
     "share_pct": 0.4,
     "direction": "decreases risk"
    },
    {
     "feature": "BUN",
     "value": 20.0,
     "contribution": -0.0017,
     "share_pct": 0.4,
     "direction": "decreases risk"
    },
    {
     "feature": "BMI",
     "value": 28.73469387755102,
     "contribution": -0.0014,
     "share_pct": 0.3,
     "direction": "decreases risk"
    },
    {
     "feature": "CR",
     "value": 1.2,
     "contribution": -0.0009,
     "share_pct": 0.2,
     "direction": "decreases risk"
    },
    {
     "feature": "PLT",
     "value": 131.0,
     "contribution": -0.0008,
     "share_pct": 0.2,
     "direction": "decreases risk"
    },
    {
     "feature": "Length",
     "value": 175.0,
     "contribution": 0.0008,
     "share_pct": 0.2,
     "direction": "increases risk"
    },
    {
     "feature": "Function Class",
     "value": 0.0,
     "contribution": -0.0007,
     "share_pct": 0.2,
     "direction": "decreases risk"
    },
    {
     "feature": "Q Wave",
     "value": 0.0,
     "contribution": -0.0004,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "Obesity",
     "value": 1.0,
     "contribution": -0.0004,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "St Elevation",
     "value": 0.0,
     "contribution": -0.0003,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "BBB",
     "value": "N",
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Edema",
     "value": 0.0,
     "contribution": -0.0001,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Lung rales",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Systolic Murmur",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LVH",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "FH",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "EX-Smoker",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CRF",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CVA",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Airway disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Thyroid Disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CHF",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Weak Peripheral Pulse",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Diastolic Murmur",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LowTH Ang",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Poor R Progression",
     "value": 1.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    }
   ]
  },
  "LCX": {
   "probability": 0.796,
   "threshold": 0.4676,
   "predicted_positive": true,
   "risk_level": "high",
   "model": "random_forest",
   "explanation": [
    {
     "feature": "Age",
     "value": 63.0,
     "contribution": 0.0705,
     "share_pct": 19.4,
     "direction": "increases risk"
    },
    {
     "feature": "PLT",
     "value": 131.0,
     "contribution": 0.0494,
     "share_pct": 13.6,
     "direction": "increases risk"
    },
    {
     "feature": "Typical Chest Pain",
     "value": 1.0,
     "contribution": 0.0402,
     "share_pct": 11.1,
     "direction": "increases risk"
    },
    {
     "feature": "TG",
     "value": 195.0,
     "contribution": 0.0282,
     "share_pct": 7.8,
     "direction": "increases risk"
    },
    {
     "feature": "CR",
     "value": 1.2,
     "contribution": 0.0187,
     "share_pct": 5.1,
     "direction": "increases risk"
    },
    {
     "feature": "ESR",
     "value": 30.0,
     "contribution": 0.0184,
     "share_pct": 5.1,
     "direction": "increases risk"
    },
    {
     "feature": "Length",
     "value": 175.0,
     "contribution": 0.0169,
     "share_pct": 4.7,
     "direction": "increases risk"
    },
    {
     "feature": "HDL",
     "value": 25.0,
     "contribution": -0.0161,
     "share_pct": 4.4,
     "direction": "decreases risk"
    },
    {
     "feature": "LDL",
     "value": 77.0,
     "contribution": -0.015,
     "share_pct": 4.1,
     "direction": "decreases risk"
    },
    {
     "feature": "BP",
     "value": 140.0,
     "contribution": 0.0139,
     "share_pct": 3.8,
     "direction": "increases risk"
    },
    {
     "feature": "EF-TTE",
     "value": 20.0,
     "contribution": 0.0084,
     "share_pct": 2.3,
     "direction": "increases risk"
    },
    {
     "feature": "FBS",
     "value": 142.0,
     "contribution": 0.0079,
     "share_pct": 2.2,
     "direction": "increases risk"
    },
    {
     "feature": "HTN",
     "value": 1.0,
     "contribution": 0.0063,
     "share_pct": 1.7,
     "direction": "increases risk"
    },
    {
     "feature": "HB",
     "value": 11.0,
     "contribution": 0.0061,
     "share_pct": 1.7,
     "direction": "increases risk"
    },
    {
     "feature": "WBC",
     "value": 4700.0,
     "contribution": 0.0058,
     "share_pct": 1.6,
     "direction": "increases risk"
    },
    {
     "feature": "Sex",
     "value": 1.0,
     "contribution": 0.004,
     "share_pct": 1.1,
     "direction": "increases risk"
    },
    {
     "feature": "DM",
     "value": 1.0,
     "contribution": 0.0038,
     "share_pct": 1.0,
     "direction": "increases risk"
    },
    {
     "feature": "Na",
     "value": 140.0,
     "contribution": -0.0035,
     "share_pct": 1.0,
     "direction": "decreases risk"
    },
    {
     "feature": "BMI",
     "value": 28.73469387755102,
     "contribution": -0.0035,
     "share_pct": 1.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Atypical",
     "value": 0.0,
     "contribution": 0.0034,
     "share_pct": 0.9,
     "direction": "increases risk"
    },
    {
     "feature": "Region RWMA",
     "value": 3.0,
     "contribution": 0.0034,
     "share_pct": 0.9,
     "direction": "increases risk"
    },
    {
     "feature": "Weight",
     "value": 88.0,
     "contribution": 0.0032,
     "share_pct": 0.9,
     "direction": "increases risk"
    },
    {
     "feature": "K",
     "value": 4.5,
     "contribution": 0.0029,
     "share_pct": 0.8,
     "direction": "increases risk"
    },
    {
     "feature": "Current Smoker",
     "value": 1.0,
     "contribution": 0.0028,
     "share_pct": 0.8,
     "direction": "increases risk"
    },
    {
     "feature": "VHD",
     "value": "N",
     "contribution": 0.0027,
     "share_pct": 0.7,
     "direction": "increases risk"
    },
    {
     "feature": "Lymph",
     "value": 29.0,
     "contribution": 0.0014,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "DLP",
     "value": 0.0,
     "contribution": 0.0013,
     "share_pct": 0.4,
     "direction": "increases risk"
    },
    {
     "feature": "Tinversion",
     "value": 1.0,
     "contribution": 0.0011,
     "share_pct": 0.3,
     "direction": "increases risk"
    },
    {
     "feature": "Function Class",
     "value": 0.0,
     "contribution": -0.0011,
     "share_pct": 0.3,
     "direction": "decreases risk"
    },
    {
     "feature": "Dyspnea",
     "value": 0.0,
     "contribution": 0.001,
     "share_pct": 0.3,
     "direction": "increases risk"
    },
    {
     "feature": "PR",
     "value": 80.0,
     "contribution": 0.0009,
     "share_pct": 0.2,
     "direction": "increases risk"
    },
    {
     "feature": "Neut",
     "value": 61.0,
     "contribution": 0.0005,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "FH",
     "value": 0.0,
     "contribution": -0.0004,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "St Depression",
     "value": 0.0,
     "contribution": 0.0004,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "Systolic Murmur",
     "value": 0.0,
     "contribution": 0.0002,
     "share_pct": 0.1,
     "direction": "increases risk"
    },
    {
     "feature": "Obesity",
     "value": 1.0,
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Nonanginal",
     "value": 0.0,
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "BBB",
     "value": "N",
     "contribution": 0.0001,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "BUN",
     "value": 20.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "increases risk"
    },
    {
     "feature": "Q Wave",
     "value": 0.0,
     "contribution": -0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "EX-Smoker",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CRF",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CVA",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Airway disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Thyroid Disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CHF",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Edema",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Weak Peripheral Pulse",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Lung rales",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Diastolic Murmur",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LowTH Ang",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "St Elevation",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LVH",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Poor R Progression",
     "value": 1.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    }
   ]
  },
  "RCA": {
   "probability": 0.9061,
   "threshold": 0.4251,
   "predicted_positive": true,
   "risk_level": "high",
   "model": "logreg_l1",
   "explanation": [
    {
     "feature": "Poor R Progression",
     "value": 1.0,
     "contribution": 0.6237,
     "share_pct": 27.7,
     "direction": "increases risk"
    },
    {
     "feature": "DM",
     "value": 1.0,
     "contribution": 0.589,
     "share_pct": 26.1,
     "direction": "increases risk"
    },
    {
     "feature": "Typical Chest Pain",
     "value": 1.0,
     "contribution": 0.3661,
     "share_pct": 16.3,
     "direction": "increases risk"
    },
    {
     "feature": "Sex",
     "value": 1.0,
     "contribution": 0.208,
     "share_pct": 9.2,
     "direction": "increases risk"
    },
    {
     "feature": "Age",
     "value": 63.0,
     "contribution": 0.1109,
     "share_pct": 4.9,
     "direction": "increases risk"
    },
    {
     "feature": "Dyspnea",
     "value": 0.0,
     "contribution": 0.0918,
     "share_pct": 4.1,
     "direction": "increases risk"
    },
    {
     "feature": "ESR",
     "value": 30.0,
     "contribution": 0.0915,
     "share_pct": 4.1,
     "direction": "increases risk"
    },
    {
     "feature": "TG",
     "value": 195.0,
     "contribution": 0.083,
     "share_pct": 3.7,
     "direction": "increases risk"
    },
    {
     "feature": "Function Class",
     "value": 0.0,
     "contribution": -0.0617,
     "share_pct": 2.7,
     "direction": "decreases risk"
    },
    {
     "feature": "HTN",
     "value": 1.0,
     "contribution": 0.015,
     "share_pct": 0.7,
     "direction": "increases risk"
    },
    {
     "feature": "CHF",
     "value": 0.0,
     "contribution": -0.0056,
     "share_pct": 0.2,
     "direction": "decreases risk"
    },
    {
     "feature": "Diastolic Murmur",
     "value": 0.0,
     "contribution": 0.0036,
     "share_pct": 0.2,
     "direction": "increases risk"
    },
    {
     "feature": "Neut",
     "value": 61.0,
     "contribution": -0.0026,
     "share_pct": 0.1,
     "direction": "decreases risk"
    },
    {
     "feature": "Weight",
     "value": 88.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Length",
     "value": 175.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "BMI",
     "value": 28.73469387755102,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Current Smoker",
     "value": 1.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "EX-Smoker",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "FH",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Obesity",
     "value": 1.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CRF",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CVA",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Airway disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Thyroid Disease",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "DLP",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "BP",
     "value": 140.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "PR",
     "value": 80.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Edema",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Weak Peripheral Pulse",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Lung rales",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Systolic Murmur",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Atypical",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Nonanginal",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LowTH Ang",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Q Wave",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "St Elevation",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "St Depression",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Tinversion",
     "value": 1.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LVH",
     "value": 0.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "FBS",
     "value": 142.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "CR",
     "value": 1.2,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "LDL",
     "value": 77.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "HDL",
     "value": 25.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "BUN",
     "value": 20.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "HB",
     "value": 11.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "K",
     "value": 4.5,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Na",
     "value": 140.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "WBC",
     "value": 4700.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Lymph",
     "value": 29.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "PLT",
     "value": 131.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "EF-TTE",
     "value": 20.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "Region RWMA",
     "value": 3.0,
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "BBB",
     "value": "N",
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    },
    {
     "feature": "VHD",
     "value": "N",
     "contribution": 0.0,
     "share_pct": 0.0,
     "direction": "decreases risk"
    }
   ]
  }
 },
 "inputs": {
  "Age": 63.0,
  "Weight": 88.0,
  "Length": 175.0,
  "Sex": 1.0,
  "BMI": 28.73469387755102,
  "DM": 1.0,
  "HTN": 1.0,
  "Current Smoker": 1.0,
  "EX-Smoker": 0.0,
  "FH": 0.0,
  "Obesity": 1.0,
  "CRF": 0.0,
  "CVA": 0.0,
  "Airway disease": 0.0,
  "Thyroid Disease": 0.0,
  "CHF": 0.0,
  "DLP": 0.0,
  "BP": 140.0,
  "PR": 80.0,
  "Edema": 0.0,
  "Weak Peripheral Pulse": 0.0,
  "Lung rales": 0.0,
  "Systolic Murmur": 0.0,
  "Diastolic Murmur": 0.0,
  "Typical Chest Pain": 1.0,
  "Dyspnea": 0.0,
  "Function Class": 0.0,
  "Atypical": 0.0,
  "Nonanginal": 0.0,
  "Exertional CP": 0.0,
  "LowTH Ang": 0.0,
  "Q Wave": 0.0,
  "St Elevation": 0.0,
  "St Depression": 0.0,
  "Tinversion": 1.0,
  "LVH": 0.0,
  "Poor R Progression": 1.0,
  "BBB": "N",
  "FBS": 142.0,
  "CR": 1.2,
  "TG": 195.0,
  "LDL": 77.0,
  "HDL": 25.0,
  "BUN": 20.0,
  "ESR": 30.0,
  "HB": 11.0,
  "K": 4.5,
  "Na": 140.0,
  "WBC": 4700.0,
  "Lymph": 29.0,
  "Neut": 61.0,
  "PLT": 131.0,
  "EF-TTE": 20.0,
  "Region RWMA": 3.0,
  "VHD": "N"
 },
 "imputed_fields": [],
 "ignored_fields": [],
 "disclaimer": "For decision support and educational purposes only. Not a substitute for formal diagnostic imaging or clinical judgement.",
 "patient": {
  "name": "Demo patient (dataset record)",
  "age": "63",
  "sex": "Male"
 }
};
