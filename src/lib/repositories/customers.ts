import { RowDataPacket } from "mysql2";
import { Customer, CustomerStatus } from "../entities/Customer";
import { pool, updateById } from "../mysql";

export async function getAllCustomers(
    name?: string,
    tenantId?: string,
    enabled?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{ customers: Customer[]; totalPages: number; totalItems: number; totalDisabledItems: number; }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
        conditions.push("customers.name LIKE ?");
        params.push(`%${name}%`);
    }
    if (tenantId) {
        conditions.push("customers.tenant_id LIKE ?");
        params.push(`%${tenantId}%`);
    }
    if (enabled === "true") {
        conditions.push("customers.deleted_at IS NULL");
    }
    if (enabled === "false") {
        conditions.push("customers.deleted_at IS NOT NULL");
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : "ORDER BY customers.created_at DESC";
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
            customers.*,
            COALESCE(d.total_devices, 0) AS total_devices,
            COALESCE(cv.total_cves, 0) AS total_cves,
            COALESCE(cc.total_critical_cves, 0) AS total_critical_cves

        FROM customers
        LEFT JOIN (
            SELECT customer_id, COUNT(*) AS total_devices 
            FROM devices
            GROUP BY customer_id
        ) d ON d.customer_id = customers.id

        LEFT JOIN (
            SELECT customer_id, COUNT(DISTINCT vulnerability_id) AS total_cves
            FROM device_vulnerabilities
            WHERE status IN ('OPEN', 'RE_OPENED')
            GROUP BY customer_id
        ) cv ON cv.customer_id = customers.id

        LEFT JOIN (
            SELECT dv.customer_id, COUNT(DISTINCT dv.vulnerability_id) AS total_critical_cves
            FROM device_vulnerabilities dv
            INNER JOIN vulnerabilities v ON v.id = dv.vulnerability_id
            WHERE dv.status IN ('OPEN', 'RE_OPENED') AND v.severity = 'Critical'
            GROUP BY dv.customer_id
        ) cc ON cc.customer_id = customers.id

        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [[{ total, totalDeleted }]] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS totalDeleted
        FROM customers
        ${whereClause}
    `,
        params
    );

    return {
        customers: rows as Customer[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        totalDisabledItems: totalDeleted
    }
}

export async function getCustomerById(id: number): Promise<Customer | null> {
    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [id]);
    return (rows as any[])[0] || null;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
    const {
        name,
        tenant_id,
        external_customer_id,
        supports_csp = false,
    } = data;

    const [result] = await pool.query(
        "INSERT INTO customers (name, tenant_id, external_customer_id, supports_csp) VALUES (?, ?, ?, ?)",
        [name, tenant_id || null, external_customer_id || null, supports_csp]
    );

    const insertId = (result as any).insertId;

    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [insertId]);
    return (rows as any[])[0] as Customer;
}

export async function softDeleteCustomer(id: number): Promise<Customer | null> {
    await pool.query("UPDATE customers SET deleted_at = NOW() WHERE id = ?", [id]);
    return getCustomerById(id);
}

export async function restoreCustomer(id: number): Promise<Customer | null> {
    await pool.query("UPDATE customers SET deleted_at = NULL WHERE id = ?", [id]);
    return getCustomerById(id);
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const updatedRows = await updateById<Customer>("customers", id, data);

    if (!updatedRows) {
        return null;
    }
    return getCustomerById(id);
}

export async function getCustomerStats(customerId: number): Promise<CustomerStatus> {
    const sql = `
    SELECT
  /* CVEs */
 (
  SELECT COUNT(DISTINCT v.id)
  FROM devices d
  JOIN device_vulnerabilities dv
    ON dv.device_id = d.id
   AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
  JOIN vulnerabilities v
    ON v.id = dv.vulnerability_id
  WHERE d.customer_id = ?
) AS totalCves,

  (
  SELECT COUNT(DISTINCT v.id)
  FROM devices d
  JOIN device_vulnerabilities dv ON dv.device_id = d.id
  JOIN vulnerabilities v ON v.id = dv.vulnerability_id
  WHERE d.customer_id = ? AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
) AS totalCvesWithAtLeastOneDeviceExposed,

  (
  SELECT COUNT(DISTINCT v.id)
  FROM devices d
  JOIN device_vulnerabilities dv
    ON dv.device_id = d.id
   AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
  JOIN vulnerabilities v
    ON v.id = dv.vulnerability_id
   AND v.public_exploit = TRUE
  WHERE d.customer_id = ?
) AS totalCvesWithPublicExploit,
(
  SELECT COUNT(DISTINCT v.id)
  FROM devices d
  JOIN device_vulnerabilities dv
    ON dv.device_id = d.id
   AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
  JOIN vulnerabilities v
    ON v.id = dv.vulnerability_id
   AND v.severity = 'Critical'
  WHERE d.customer_id = ?
) AS totalCriticalCves,

  /* Devices */
  (
    SELECT COUNT(*)
    FROM devices d
    WHERE d.customer_id = ?
  ) AS totalDevices,

  (
    SELECT COUNT(DISTINCT d.id)
    FROM devices d
    JOIN device_vulnerabilities dv ON dv.device_id = d.id
    WHERE d.customer_id = ?
      AND dv.status = 'OPEN'
  ) AS totalVulnerableDevices,

  (
    SELECT COUNT(*)
    FROM devices d
    WHERE d.customer_id = ?
      AND (d.last_seen_at IS NULL
           OR d.last_seen_at < NOW() - INTERVAL 14 DAY)
  ) AS totalStaleDevices,

  /* Remediation tickets */
  (
    SELECT COUNT(*)
    FROM remediation_tickets rt
    WHERE rt.customer_id = ?
      AND rt.status = 'OPEN'
  ) AS openRemediationTickets,

  /* Audit logs */
  (
    SELECT COUNT(*)
    FROM audit_logs al
    WHERE al.customer_id = ?
      AND al.created_at >= NOW() - INTERVAL 7 DAY
  ) AS auditLogsLast7Days,

  (
    SELECT COUNT(*)
    FROM audit_logs al
    WHERE al.customer_id = ?
      AND al.created_at >= NOW() - INTERVAL 1 DAY
  ) AS auditLogsLast24Hours,

  /* Vulnerable software */
(
  SELECT COUNT(DISTINCT vas.software_id)
  FROM devices d
  JOIN device_vulnerabilities dv
    ON dv.device_id = d.id
   AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
  JOIN vulnerability_affected_software vas
    ON vas.vulnerability_id = dv.vulnerability_id
  WHERE d.customer_id = ?
) AS totalVulnerableSoftware,

  /* New vulnerabilities */
  (
    SELECT COUNT(*)
    FROM vulnerabilities v
    WHERE v.created_at >= NOW() - INTERVAL 7 DAY
  ) AS vulnerabilitiesCreatedLast7Days,

  (
    SELECT COUNT(*)
    FROM vulnerabilities v
    WHERE v.created_at >= NOW() - INTERVAL 1 DAY
  ) AS vulnerabilitiesCreatedLast24Hours,

  /* Long-running (>30 days) */
  (
    SELECT COUNT(DISTINCT v.id)
    FROM devices d
    JOIN device_vulnerabilities dv ON dv.device_id = d.id
    JOIN vulnerabilities v ON v.id = dv.vulnerability_id
    WHERE d.customer_id = ?
      AND dv.status = 'OPEN'
      AND dv.detected_at < NOW() - INTERVAL 30 DAY
  ) AS longRunningVulnerabilities
    `;
    const [rows] = await pool.query(sql,
        [
            customerId, customerId, customerId, customerId, customerId, customerId,
            customerId, customerId, customerId, customerId, customerId, customerId
        ]
    );

    return rows[0] as CustomerStatus;
}

export async function getCustomersAffectedBySoftware(
    softwareId: number,
    filters?: {
        name?: string;
        tenantId?: string;
        supportsCsp?: string;
        externalCustomerId?: string;
    },
    page = 1,
    pageSize = 20,
    sortBy: string = "name",
    sortDir: "asc" | "desc" = "asc"
): Promise<{
    customers: (Customer & {
        vulnerabilities_count: number;
        highest_cve_severity: string | null;
        highest_cve_cvss_v3: number | null;
        highest_cve_epss: number | null;
        vulnerable_versions: string | null;
        has_public_exploit: boolean;
        has_verified_exploit: boolean;
    })[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = ["vas.software_id = ?", "c.deleted_at IS NULL"];
    const params: any[] = [softwareId];

    if (filters?.name) {
        conditions.push("c.name LIKE ?");
        params.push(`%${filters.name}%`);
    }

    if (filters?.tenantId) {
        conditions.push("c.tenant_id LIKE ?");
        params.push(`%${filters.tenantId}%`);
    }

    if (filters?.externalCustomerId) {
        conditions.push("c.external_customer_id LIKE ?");
        params.push(`%${filters.externalCustomerId}%`);
    }

    if (filters?.supportsCsp === "true" || filters?.supportsCsp === "false") {
        conditions.push("c.supports_csp = ?");
        params.push(filters.supportsCsp === "true" ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const sortColumn = sortBy === "tenant_id" ? "c.tenant_id" : "c.name";
    const orderClause = `ORDER BY ${sortColumn} ${sortDir}`;
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
            c.id,
            c.name,
            c.tenant_id,
            c.external_customer_id,
            c.supports_csp,
            c.created_at,
            c.updated_at,
            c.deleted_at,

            COUNT(DISTINCT v.id) AS vulnerabilities_count,

            SUBSTRING_INDEX(
                GROUP_CONCAT(
                    v.severity
                    ORDER BY
                        CASE UPPER(v.severity)
                            WHEN 'Critical' THEN 4
                            WHEN 'High' THEN 3
                            WHEN 'Medium' THEN 2
                            WHEN 'Low' THEN 1
                            ELSE 0
                        END DESC
                    SEPARATOR ','
                ),
                ',', 1
            ) AS highest_cve_severity,

            MAX(v.cvss_v3) AS highest_cve_cvss_v3,
            MAX(v.epss) AS highest_cve_epss,

            GROUP_CONCAT(DISTINCT vas.vulnerable_versions SEPARATOR '; ') AS vulnerable_versions,

            MAX(v.public_exploit) AS has_public_exploit,
            MAX(v.exploit_verified) AS has_verified_exploit

        FROM customers c

        INNER JOIN devices d
            ON d.customer_id = c.id

        INNER JOIN device_vulnerabilities dv
            ON dv.device_id = d.id
            AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')

        INNER JOIN vulnerabilities v
            ON v.id = dv.vulnerability_id

        INNER JOIN vulnerability_affected_software vas
            ON vas.vulnerability_id = v.id

        ${whereClause}

        GROUP BY c.id
        ${orderClause}
        LIMIT ? OFFSET ?
        `,
        [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS total FROM (
            SELECT c.id
            FROM customers c
            INNER JOIN devices d ON d.customer_id = c.id
            INNER JOIN device_vulnerabilities dv
                ON dv.device_id = d.id
                AND (dv.status = 'OPEN' OR dv.status = 'RE_OPENED')
            INNER JOIN vulnerability_affected_software vas
                ON vas.vulnerability_id = dv.vulnerability_id
            ${whereClause}
            GROUP BY c.id
        ) x
        `,
        params
    );

    return {
        customers: rows as any,
        totalItems: Number(total),
        totalPages: Math.ceil(total / pageSize)
    }
}