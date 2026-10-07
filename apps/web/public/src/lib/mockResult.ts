import type { Contribution, PredictionResponse } from "./types";

type Row = [feature: string, value: number | null, contribution: number, share: number];
const E = (rows: Row[]): Contribution[] =>
  rows.map(([feature, value, contribution, share_pct]) => ({
    feature, value, contribution, share_pct,
    direction: contribution >= 0 ? "increases risk" : "decreases risk",
  }));

/** Sample API response, used by /results?demo and for developing the page without the backend. */
export const MOCK_RESULT: PredictionResponse = {
  predictions: {
    CAD: { probability: 0.9266, predicted_positive: true, risk_level: "high", model: "random_forest",
      explanation: E([["Typical Chest Pain",1,0.1584,31.6],["Atypical",null,0.057,11.4],["Age",62,0.0527,10.5],["EF-TTE",45,0.0339,6.8],["DM",1,0.0216,4.3],["HTN",1,0.0198,3.9],["Region RWMA",null,-0.0194,3.9],["BP",150,0.0184,3.7],["HDL",null,0.0126,2.5],["PR",80,0.0087,1.7]]) },
    LAD: { probability: 0.8268, predicted_positive: true, risk_level: "high", model: "random_forest",
      explanation: E([["Typical Chest Pain",1,0.1111,24.3],["EF-TTE",45,0.0601,13.2],["Atypical",null,0.0417,9.1],["Region RWMA",null,-0.0326,7.1],["Age",62,0.0316,6.9],["PR",80,0.0163,3.6],["PLT",null,0.0147,3.2],["Lymph",null,0.0146,3.2],["Length",null,0.0123,2.7],["HDL",null,0.0117,2.6]]) },
    LCX: { probability: 0.5922, predicted_positive: true, risk_level: "moderate", model: "xgboost",
      explanation: E([["Typical Chest Pain",1,0.4438,13.4],["CR",null,-0.3564,10.7],["Age",62,0.2782,8.4],["Length",null,-0.2456,7.4],["HDL",null,0.2436,7.3],["Na",null,0.1934,5.8],["HB",null,-0.1714,5.2],["LDL",null,0.155,4.7],["BUN",null,-0.1366,4.1],["Lymph",null,-0.13,3.9]]) },
    RCA: { probability: 0.8528, predicted_positive: true, risk_level: "high", model: "logreg_l1",
      explanation: E([["DM",1,0.9759,25.9],["Sex",1,0.4897,13],["Typical Chest Pain",1,0.3525,9.4],["Dyspnea",null,0.3187,8.5],["Function Class",null,-0.2141,5.7],["VHD",null,-0.1863,4.9],["Age",62,0.177,4.7],["HTN",1,0.1609,4.3],["ESR",null,-0.1208,3.2],["Region RWMA",null,0.1045,2.8]]) },
  },
  imputed_fields: "Weight,Length,BMI,Current Smoker,EX-Smoker,FH,Obesity,CRF,CVA,Airway disease,Thyroid Disease,CHF,DLP,Edema,Weak Peripheral Pulse,Lung rales,Systolic Murmur,Diastolic Murmur,Dyspnea,Function Class,Atypical,Nonanginal,Exertional CP,LowTH Ang,Q Wave,St Elevation,St Depression,Tinversion,LVH,Poor R Progression,BBB,FBS,CR,TG,LDL,HDL,BUN,ESR,HB,K,Na,WBC,Lymph,Neut,PLT,Region RWMA,VHD".split(","),
  ignored_fields: [],
  disclaimer: "For decision support and educational purposes only. Not a substitute for formal diagnostic imaging or clinical judgement.",
};
