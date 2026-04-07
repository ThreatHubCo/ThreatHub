import { pool } from "@/lib/mysql";
import { RowDataPacket } from "mysql2";
import { RecommendationEvent } from "../entities/SecurityRecommendation";

// TODO: Move to API route
const SORT_FIELDS: Record<string, string> = {
    exposureImpact: "m.exposure_impact",
    configScoreImpact: "m.config_score_impact",
    exposedMachinesCount: "m.exposed_machines_count",
    totalMachinesCount: "m.total_machines_count",
    exposedCriticalDevices: "m.exposed_critical_devices",
    publicExploit: "m.public_exploit",
    activeAlert: "m.active_alert",
    status: "m.status",
    recommendationName: "r.recommendation_name",
    productName: "r.product_name",
    createdAt: "m.created_at"
};

export async function getEnrichedRecommendations(
    customerId: number,
    recommendationName?: string,
    sortBy = "exposureImpact",
    sortDir: "asc" | "desc" = "desc",
    page = 1,
    pageSize = 20
): Promise<{
    recommendations: any[];
    totalItems: number;
    totalPages: number;
}> {
    const conditions: string[] = [];
    const params: any[] = [];

    conditions.push("m.customer_id = ?");
    params.push(customerId);

    if (recommendationName) {
        conditions.push("r.recommendation_name LIKE ?");
        params.push(`%${recommendationName}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = SORT_FIELDS[sortBy] ?? SORT_FIELDS.exposureImpact;
    const direction = sortDir === "asc" ? "ASC" : "DESC";

    const offset = (page - 1) * pageSize;

    const sql = `
        SELECT
            r.id                                   AS recommendationId,
            r.defender_recommendation_id           AS defenderRecommendationId,
            r.product_name                         AS productName,
            r.recommendation_name                  AS recommendationName,
            r.vendor                               AS vendor,
            r.remediation_type                     AS remediationType,
            r.related_component                    AS relatedComponent,

            m.exposed_machines_count               AS exposedMachinesCount,
            m.total_machines_count                 AS totalMachinesCount,
            m.exposed_critical_devices             AS exposedCriticalDevices,
            m.config_score_impact                  AS configScoreImpact,
            m.exposure_impact                      AS exposureImpact,
            m.public_exploit                       AS publicExploit,
            m.active_alert                         AS activeAlert,
            m.has_unpatchable_cve                  AS hasUnpatchableCve,
            m.status                               AS status,
            m.created_at                           AS createdAt,

            COALESCE(e.eventsLast24h, 0)            AS eventsLast24h
        FROM security_recommendations r

        JOIN customer_security_recommendation_metrics m
          ON m.recommendation_id = r.id

        JOIN (
            SELECT recommendation_id, MAX(created_at) AS latest
            FROM customer_security_recommendation_metrics
            WHERE customer_id = ?
              AND status = 'Active'
            GROUP BY recommendation_id
        ) lm
          ON lm.recommendation_id = m.recommendation_id
         AND lm.latest = m.created_at

        LEFT JOIN (
            SELECT
                recommendation_id,
                COUNT(*) AS eventsLast24h
            FROM customer_security_recommendation_events
            WHERE customer_id = ?
              AND created_at >= NOW() - INTERVAL 1 DAY
            GROUP BY recommendation_id
        ) e
          ON e.recommendation_id = r.id

        ${whereClause}
        ORDER BY ${sortColumn} ${direction}
        LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [
        customerId,
        customerId,
        ...params,
        pageSize,
        offset
    ]);

    const countSql = `
        SELECT COUNT(DISTINCT r.id) AS total
        FROM security_recommendations r
        JOIN customer_security_recommendation_metrics m ON m.recommendation_id = r.id
        ${whereClause}
    `;

    const [[{ total }]] = await pool.query<any[]>(countSql, params);

    return {
        recommendations: rows as any[],
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
    };
}

export async function getRecommendationTotals(customerId: number): Promise<{
    totalWithCriticalDevices: number;
    totalWithPublicExploit: number;
    totalWithActiveAlert: number;
}> {
    const sql = `
        SELECT
            COUNT(CASE WHEN m.exposed_critical_devices > 0 THEN 1 END) AS totalWithCriticalDevices,
            COUNT(CASE WHEN m.public_exploit = 1 THEN 1 END) AS totalWithPublicExploit,
            COUNT(CASE WHEN m.active_alert = 1 THEN 1 END) AS totalWithActiveAlert
        FROM customer_security_recommendation_metrics m
        JOIN (
            SELECT recommendation_id, MAX(created_at) AS latest
            FROM customer_security_recommendation_metrics
            WHERE customer_id = ?
            GROUP BY recommendation_id
        ) lm
          ON lm.recommendation_id = m.recommendation_id
         AND lm.latest = m.created_at
        WHERE m.customer_id = ?
    `;

    const [[totals]] = await pool.query<any[]>(sql, [customerId, customerId]);

    return {
        totalWithCriticalDevices: totals.totalWithCriticalDevices || 0,
        totalWithPublicExploit: totals.totalWithPublicExploit || 0,
        totalWithActiveAlert: totals.totalWithActiveAlert || 0
    }
}

export async function getRecentEvents(options?: {
    days?: number;
    customerId?: number;
    recommendationId?: number;
}): Promise<RecommendationEvent[]> {
    let sql = `
        SELECT e.*
        FROM customer_security_recommendation_events e
        WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options?.days && options.days > 0) {
        sql += " AND e.created_at >= NOW() - INTERVAL ? DAY";
        params.push(options.days);
    }

    if (options?.customerId !== undefined) {
        sql += " AND e.customer_id = ?";
        params.push(options.customerId);
    }

    if (options?.recommendationId !== undefined) {
        sql += " AND e.recommendation_id = ?";
        params.push(options.recommendationId);
    }

    sql += " ORDER BY e.created_at DESC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as RecommendationEvent[];
}

// TODO: Move to API route
const AGG_SORT_FIELDS: Record<string, string> = {
    recommendation_name: "r.recommendation_name",
    product_name: "r.product_name",
    total_clients_affected: "total_clients_affected",
    total_critical_devices: "total_critical_devices",
    has_public_exploit: "has_public_exploit",
    has_active_alert: "has_active_alert",
    events_last_24h: "events_last_24h",
}

const AGG_FILTER_FIELDS: Record<string, string> = {
    recommendation_name: "r.recommendation_name",
    product_name: "r.product_name",
    vendor: "r.vendor",
    remediation_type: "r.remediation_type",
    related_component: "r.related_component",
}

export async function getAggregatedRecommendations(options?: {
    onlyWithExposure?: boolean;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
    filters?: Record<string, string | undefined>;
}): Promise<{
    recommendations: any[];
    totalItems: number;
    totalPages: number;
}> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const pageSize = options?.pageSize && options.pageSize > 0 ? options.pageSize : 20;
    const offset = (page - 1) * pageSize;

    const sortDir = options?.sortDir === "asc" ? "ASC" : "DESC";
    const sortColumn = options?.sortBy && AGG_SORT_FIELDS[options.sortBy] ? AGG_SORT_FIELDS[options.sortBy] : "total_clients_affected";

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
            if (!value) continue;
            const column = AGG_FILTER_FIELDS[key];
            if (!column) continue;

            whereClauses.push(`${column} LIKE ?`);
            params.push(`%${value}%`);
        }
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  
    const countSql = `
        SELECT COUNT(*) AS total
        FROM (
            SELECT r.id
            FROM security_recommendations r
            LEFT JOIN customer_security_recommendation_metrics m ON m.recommendation_id = r.id
            LEFT JOIN customer_security_recommendation_events e ON e.recommendation_id = r.id
            AND e.created_at >= NOW() - INTERVAL 1 DAY
            ${whereSql}
            GROUP BY r.id
            ${options?.onlyWithExposure ? `HAVING SUM(m.exposed_machines_count) > 0` : ""}
        ) AS grouped
    `;

    const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
    const totalItems = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    const pagedSql = `
        SELECT
            r.id,
            r.defender_recommendation_id,
            r.product_name,
            r.recommendation_name,
            r.vendor,
            r.remediation_type,
            r.related_component,

            COUNT(DISTINCT CASE WHEN m.exposed_machines_count > 0 THEN m.customer_id END) AS total_clients_affected,
            COALESCE(SUM(m.exposed_critical_devices), 0) AS total_critical_devices,
            MAX(COALESCE(m.public_exploit, 0)) AS has_public_exploit,
            MAX(COALESCE(m.active_alert, 0)) AS has_active_alert,
            COUNT(DISTINCT e.id) AS events_last_24h

        FROM security_recommendations r
        LEFT JOIN customer_security_recommendation_metrics m ON m.recommendation_id = r.id
        LEFT JOIN customer_security_recommendation_events e ON e.recommendation_id = r.id
        AND e.created_at >= NOW() - INTERVAL 1 DAY
        ${whereSql}
        GROUP BY r.id
        ${options?.onlyWithExposure ? `HAVING SUM(m.exposed_machines_count) > 0` : ""}
        ORDER BY ${sortColumn} ${sortDir}
        LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(pagedSql, [...params, pageSize, offset]);

    return {
        recommendations: rows,
        totalItems,
        totalPages
    }
}

export async function getAllDistinctRemediationTypes(): Promise<string[]> {
    const sql = `
        SELECT DISTINCT remediation_type
        FROM security_recommendations
        ORDER BY remediation_type ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql);
    return rows.map(row => row.remediation_type);
}