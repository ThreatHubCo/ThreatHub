import { Agent } from "@/lib/entities/Agent";
import { Customer } from "@/lib/entities/Customer";
import { findSoftwareInfo } from "@/lib/utils/softwareMap";

export function vulnTicketTemplate(subject: string, description: string, software: any, customer: Customer, agent: Agent) {
  const softwareInfo = findSoftwareInfo(software);

  return (`
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>

  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ffffff;
    }

    .container {
      max-width: 700px;
      margin: 30px auto;
      padding: 30px;
      border: 1px solid #ececec;
      border-radius: 8px;
    }

    h2 {
      margin-top: 0;
      margin-bottom: 10px;
    }

    .description {
      font-size: 15px;
      line-height: 1.6;
      color: #111827;
      margin-bottom: 40px;
    }

    /* --- Bottom info block --- */

    .meta {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      font-size: 12px;
      color: #6b7280;
    }

    .meta h4 {
      margin: 0 0 10px 0;
      font-size: 13px;
      color: #374151;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
    }

    .meta-item strong {
      color: #374151;
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 10px;
      color: #ffffff;
    }

    .critical { background-color: #7f1d1d; }
    .high { background-color: #dc2626; }
    .medium { background-color: #f59e0b; }
    .low { background-color: #10b981; }

    .footer {
      margin-top: 15px;
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }
  </style>
</head>

<body>
  <div class='container'>
    <h2>${subject}</h2>

    <div class='description'>
      ${description}
    </div>

    <div class='meta'>
      <h4>Additional Information</h4>

      <div class='meta-grid'>
        <div class='meta-item'>
          <strong>Software:</strong> ${softwareInfo.name} (${softwareInfo.vendor})
        </div>

        <div class='meta-item'>
          <strong>Public Exploit:</strong>
          ${software.public_exploit ? "<span class='badge high'>Yes</span>" : "<span class='badge low'>No</span>"}
        </div>

        <div class='meta-item'>
          <strong>Highest Severity:</strong>
          <span class='badge ${software.highest_cve_severity?.toLowerCase()}'>
            ${software.highest_cve_severity ?? "N/A"}
          </span>
        </div>

        <div class='meta-item'>
          <strong>Total EPSS:</strong> ${software.highest_cve_epss}
        </div>

        <div class='meta-item'>
          <strong>Total CVEs:</strong> ${software.total_cves}
        </div>

        <div class='meta-item'>
          <strong>Affected Devices:</strong> ${software.total_affected_devices}
        </div>

        <div class='meta-item'>
          <strong>Customer:</strong> ${customer.name}
        </div>

        <div class='meta-item'>
          <strong>Tenant ID:</strong> ${customer.tenant_id}
        </div>
      </div>

      <div class='footer'>
        Ticket raised manually by ${agent.display_name}
      </div>
    </div>
  </div>
</body>
</html>
`)}