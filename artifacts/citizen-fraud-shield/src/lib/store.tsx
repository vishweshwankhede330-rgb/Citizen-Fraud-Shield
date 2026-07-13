import React, { createContext, useContext, useState, useEffect } from "react";

export type RiskLevel = "High Risk" | "Low Risk" | "Uncertain";

// City is a free string — any typed or selected city name is valid.
export type City = string;

export const CITY_COORDS: Record<string, [number, number]> = {
  // Original cities
  Mumbai:             [19.0760,  72.8777],
  Delhi:              [28.7041,  77.1025],
  Bengaluru:          [12.9716,  77.5946],
  Nagpur:             [21.1458,  79.0882],
  Pune:               [18.5204,  73.8567],
  Hyderabad:          [17.3850,  78.4867],
  Chennai:            [13.0827,  80.2707],
  Kolkata:            [22.5726,  88.3639],
  Ahmedabad:          [23.0225,  72.5714],
  Jaipur:             [26.9124,  75.7873],
  // State capitals & major cities
  Agartala:           [23.8315,  91.2868],
  Agra:               [27.1767,  78.0081],
  Aizawl:             [23.7271,  92.7176],
  Allahabad:          [25.4358,  81.8463],
  Amritsar:           [31.6340,  74.8723],
  Aurangabad:         [19.8762,  75.3433],
  Bhopal:             [23.2599,  77.4126],
  Bhubaneswar:        [20.2961,  85.8245],
  Chandigarh:         [30.7333,  76.7794],
  Coimbatore:         [11.0168,  76.9558],
  Dehradun:           [30.3165,  78.0322],
  Dhanbad:            [23.7957,  86.4304],
  Faridabad:          [28.4089,  77.3178],
  Gandhinagar:        [23.2156,  72.6369],
  Ghaziabad:          [28.6692,  77.4538],
  Guwahati:           [26.1445,  91.7362],
  Gwalior:            [26.2183,  78.1828],
  Howrah:             [22.5958,  88.2636],
  Hubballi:           [15.3647,  75.1240],
  Imphal:             [24.8170,  93.9368],
  Indore:             [22.7196,  75.8577],
  Itanagar:           [27.0844,  93.6053],
  Jabalpur:           [23.1815,  79.9864],
  Jodhpur:            [26.2389,  73.0243],
  Kanpur:             [26.4499,  80.3319],
  Kochi:              [ 9.9312,  76.2673],
  Kohima:             [25.6701,  94.1077],
  Kota:               [25.2138,  75.8648],
  Lucknow:            [26.8467,  80.9462],
  Ludhiana:           [30.9010,  75.8573],
  Madurai:            [ 9.9252,  78.1198],
  Meerut:             [28.9845,  77.7064],
  Mysuru:             [12.2958,  76.6394],
  Nashik:             [19.9975,  73.7898],
  "Navi Mumbai":      [19.0330,  73.0297],
  Panaji:             [15.4909,  73.8278],
  Patna:              [25.5941,  85.1376],
  "Port Blair":       [11.6234,  92.7265],
  Prayagraj:          [25.4358,  81.8463],
  Puducherry:         [11.9416,  79.8083],
  Raipur:             [21.2514,  81.6296],
  Rajkot:             [22.3039,  70.8022],
  Ranchi:             [23.3441,  85.3096],
  Shillong:           [25.5788,  91.8933],
  Shimla:             [31.1048,  77.1734],
  Solapur:            [17.6599,  75.9064],
  Srinagar:           [34.0837,  74.7973],
  Surat:              [21.1702,  72.8311],
  Thane:              [19.2183,  72.9781],
  Thiruvananthapuram: [ 8.5241,  76.9366],
  Vadodara:           [22.3072,  73.1812],
  Varanasi:           [25.3176,  82.9739],
  Vijayawada:         [16.5062,  80.6480],
  Visakhapatnam:      [17.6868,  83.2185],
};

// Alphabetically-sorted list of all cities with known coordinates.
export const CITY_LIST: string[] = Object.keys(CITY_COORDS).sort((a, b) =>
  a.localeCompare(b),
);

export interface CheckResult {
  id: string;
  timestamp: string;
  query: string;
  riskLevel: RiskLevel;
  confidenceScore: number;
  reasons: string[];
  recommendedActions?: string[];
  simpleExplanation?: string;
  city?: City;
  crimeCategory?: string;
  pincode?: string;
  /** Set after the user submits this result to the Police Dashboard. Persists across navigation. */
  submittedComplaintId?: string;
}

interface StoreContextType {
  history: CheckResult[];
  addCheck: (check: Omit<CheckResult, "id" | "timestamp">) => string;
  getCheck: (id: string) => CheckResult | undefined;
  markComplaintSubmitted: (checkId: string, complaintId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DUMMY_DATA: CheckResult[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    query: "Call from Customs Department about a package containing illegal items.",
    riskLevel: "High Risk",
    confidenceScore: 98,
    city: "Mumbai",
    simpleExplanation: "This is almost certainly a scam. Real customs officials never call individuals about seized packages and demand payment over the phone.",
    reasons: [
      "Mentions 'Customs Department' making a direct call, a common impersonation tactic.",
      "Threatens legal action regarding 'illegal items' in a package.",
      "Urgency and intimidation used to bypass critical thinking."
    ]
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    query: "Message from bank saying my account will be suspended if I don't click the link.",
    riskLevel: "High Risk",
    confidenceScore: 95,
    city: "Delhi",
    simpleExplanation: "This is a phishing scam. Your bank will never ask you to click an unverified link to prevent account suspension. Do not click anything.",
    reasons: [
      "Creates artificial urgency ('account will be suspended').",
      "Requests clicking an unverified link to resolve the issue.",
      "Banks typically do not communicate account suspensions via informal links."
    ]
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    query: "Reminder for my dental appointment tomorrow at 10 AM.",
    riskLevel: "Low Risk",
    confidenceScore: 99,
    city: "Pune",
    simpleExplanation: "This looks like a legitimate appointment reminder. There are no signs of fraud in this message.",
    reasons: [
      "Standard transactional communication format.",
      "No requests for personal information or urgent financial action.",
      "Matches typical service provider reminder patterns."
    ]
  },
  {
    id: "h1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    query: "CBI officer called saying my Aadhaar is linked to a money laundering case.",
    riskLevel: "High Risk", confidenceScore: 97, city: "Mumbai",
    simpleExplanation: "This is a scam. The CBI does not call citizens about Aadhaar-linked cases. You can safely hang up.",
    reasons: ["CBI impersonation", "Aadhaar theft attempt", "Money laundering false threat"]
  },
  {
    id: "h2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    query: "TRAI officer said my number will be disconnected for illegal activity. Stay on video call.",
    riskLevel: "High Risk", confidenceScore: 96, city: "Delhi",
    simpleExplanation: "This is a digital arrest scam. TRAI does not make such calls. The 'stay on video call' instruction is a known scam tactic — hang up immediately.",
    reasons: ["TRAI impersonation", "Video call isolation tactic", "Illegal activity false threat"]
  },
  {
    id: "h3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
    query: "Narcotics department arrested someone with your SIM. Transfer money to a safe account now.",
    riskLevel: "High Risk", confidenceScore: 99, city: "Bengaluru",
    reasons: ["Narcotics impersonation", "Safe account payment demand", "SIM association scam"]
  },
  {
    id: "h4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
    query: "ED officer says your PAN is frozen due to financial crime. Pay Rs 50,000 immediately.",
    riskLevel: "High Risk", confidenceScore: 98, city: "Mumbai",
    reasons: ["ED impersonation", "PAN freeze threat", "Immediate payment demand"]
  },
  {
    id: "h5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(),
    query: "Your parcel from FedEx has illegal items. Customs officer will arrest you unless you pay.",
    riskLevel: "High Risk", confidenceScore: 95, city: "Hyderabad",
    reasons: ["Parcel scam variant", "Customs impersonation", "Arrest threat with payment demand"]
  },
  {
    id: "h6",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    query: "Police FIR registered against your mobile number. Call back to avoid arrest warrant.",
    riskLevel: "High Risk", confidenceScore: 94, city: "Chennai",
    reasons: ["Police impersonation", "Fake FIR threat", "Callback to scammer tactic"]
  },
  {
    id: "h7",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 130).toISOString(),
    query: "RBI verification officer. Your account has suspicious transactions. Share OTP to unfreeze.",
    riskLevel: "High Risk", confidenceScore: 97, city: "Kolkata",
    reasons: ["RBI impersonation", "OTP theft attempt", "Suspicious transaction false alert"]
  },
  {
    id: "h8",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
    query: "Supreme Court case number 2847 filed against you. Pay fine online to avoid jail.",
    riskLevel: "High Risk", confidenceScore: 96, city: "Delhi",
    reasons: ["Fake court case number", "Judiciary impersonation", "Payment to avoid jail threat"]
  },
  {
    id: "h9",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
    query: "Your electricity bill is overdue. Connection will be cut in 2 hours unless you pay now.",
    riskLevel: "Uncertain", confidenceScore: 72, city: "Pune",
    reasons: ["Artificial urgency", "Unusual payment request", "Verify with official electricity provider"]
  },
  {
    id: "h10",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 160).toISOString(),
    query: "CBI digital arrest. Do not disconnect this call or leave your home. We are monitoring you.",
    riskLevel: "High Risk", confidenceScore: 99, city: "Ahmedabad",
    reasons: ["Explicit 'digital arrest' phrase", "CBI impersonation", "Isolation and monitoring threat"]
  },
  {
    id: "h11",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 170).toISOString(),
    query: "Income Tax officer. You have undisclosed income. Pay penalty to avoid criminal charges.",
    riskLevel: "High Risk", confidenceScore: 93, city: "Jaipur",
    reasons: ["Income tax impersonation", "Undisclosed income false claim", "Criminal charge threat"]
  },
  {
    id: "h12",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(),
    query: "We found your Aadhaar used in drug trafficking. Stay on WhatsApp video or you'll be arrested.",
    riskLevel: "High Risk", confidenceScore: 98, city: "Nagpur",
    reasons: ["Aadhaar fraud claim", "Drug trafficking false accusation", "Video isolation tactic"]
  },
  {
    id: "h13",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 190).toISOString(),
    query: "Your KYC is expiring. Click this link to update or your account will be blocked.",
    riskLevel: "Uncertain", confidenceScore: 78, city: "Bengaluru",
    reasons: ["KYC urgency tactic", "Suspicious link request", "Account blocking threat"]
  },
  {
    id: "h14",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(),
    query: "Customs officer. Package seized with 2kg drugs in your name. Transfer Rs 1 lakh to clear.",
    riskLevel: "High Risk", confidenceScore: 99, city: "Mumbai",
    reasons: ["Customs impersonation", "Drug seizure false claim", "Large payment demand"]
  },
  {
    id: "h15",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 210).toISOString(),
    query: "Dr Sharma hospital appointment confirmed for tomorrow 11 AM. Please arrive 15 minutes early.",
    riskLevel: "Low Risk", confidenceScore: 99, city: "Chennai",
    reasons: ["Standard appointment reminder", "No payment or personal info requested", "Typical medical communication"]
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<CheckResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cfs_history_v3");
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      setHistory(DUMMY_DATA);
      localStorage.setItem("cfs_history_v3", JSON.stringify(DUMMY_DATA));
    }
  }, []);

  const addCheck = (check: Omit<CheckResult, "id" | "timestamp">) => {
    const newCheck: CheckResult = {
      ...check,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => {
      const updated = [newCheck, ...prev];
      localStorage.setItem("cfs_history_v3", JSON.stringify(updated));
      return updated;
    });

    return newCheck.id;
  };

  const getCheck = (id: string) => {
    return history.find(c => c.id === id);
  };

  const markComplaintSubmitted = (checkId: string, complaintId: string) => {
    setHistory((prev) => {
      const updated = prev.map((c) =>
        c.id === checkId ? { ...c, submittedComplaintId: complaintId } : c,
      );
      localStorage.setItem("cfs_history_v3", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <StoreContext.Provider value={{ history, addCheck, getCheck, markComplaintSubmitted }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
