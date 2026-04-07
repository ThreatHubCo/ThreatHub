export interface CvssMetrics {
    attackVector: string;
    attackComplexity: string;
    privilegesRequired: string;
    userInteraction: string;
    scope: string;
    confidentiality: string;
    integrity: string;
    availability: string;
    exploitMaturity?: string;
    remediationLevel?: string;
    reportConfidence?: string;
    toString?: () => string;
}

const AV_MAP = { N: "over the network", A: "from an adjacent network", L: "locally on the system", P: "physically" };
const AC_MAP = { L: "low", H: "high" };
const PR_MAP = { N: "no privileges", L: "low privileges", H: "high privileges" };
const UI_MAP = { N: "no user interaction", R: "requires user interaction" };
const S_MAP = { U: "affects only the vulnerable component", C: "affects other components as well" };
const CIAM_MAP = { H: "high", L: "low", N: "none" };
const E_MAP = { X: "unknown", U: "unproven", P: "proof-of-concept exists", F: "functional exploit exists", H: "highly functional exploit exists" };
const RL_MAP = { X: "unknown", O: "official fix available", T: "temporary fix available", W: "workaround available", U: "no fix available" };
const RC_MAP = { X: "unknown", U: "unconfirmed", R: "reasonably confirmed", C: "confirmed" };

export function parseCvssVector(vector: string): CvssMetrics {
    const parts = vector?.split("/")?.slice(1); // remove CVSS:3.1 prefix
    const metrics: Partial<CvssMetrics> = {};

    for (const part of parts) {
        const [key, value] = part.split(":");
        switch (key) {
            case "AV": metrics.attackVector = AV_MAP[value]; break;
            case "AC": metrics.attackComplexity = AC_MAP[value]; break;
            case "PR": metrics.privilegesRequired = PR_MAP[value]; break;
            case "UI": metrics.userInteraction = UI_MAP[value]; break;
            case "S": metrics.scope = S_MAP[value]; break;
            case "C": metrics.confidentiality = CIAM_MAP[value]; break;
            case "I": metrics.integrity = CIAM_MAP[value]; break;
            case "A": metrics.availability = CIAM_MAP[value]; break;
            case "E": metrics.exploitMaturity = E_MAP[value]; break;
            case "RL": metrics.remediationLevel = RL_MAP[value]; break;
            case "RC": metrics.reportConfidence = RC_MAP[value]; break;
        }
    }

    (metrics as CvssMetrics).toString = function () {
        return `This vulnerability can be exploited ${this.attackVector}, requires ${this.privilegesRequired}, with ${this.userInteraction}, and ${this.scope}. It can cause ${this.confidentiality} impact to confidentiality, ${this.integrity} impact to integrity, and ${this.availability} impact to availability.` +
            (this.exploitMaturity ? ` Exploit status: ${this.exploitMaturity}.` : "") +
            (this.remediationLevel ? ` Remediation: ${this.remediationLevel}.` : "") +
            (this.reportConfidence ? ` Report confidence: ${this.reportConfidence}.` : "");
    };

    return metrics as CvssMetrics;
}
