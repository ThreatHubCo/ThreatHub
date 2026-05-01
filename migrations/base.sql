SET time_zone = "+00:00";

CREATE TABLE config (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `key` VARCHAR(255) UNIQUE NOT NULL,
    `value` TEXT,
    `type` VARCHAR(20) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE agents (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME,
    `email` VARCHAR(255) UNIQUE,
    `password` VARCHAR(255),
    `display_name` VARCHAR(255),
    `entra_object_id` VARCHAR(36) UNIQUE,
    `role` VARCHAR(30) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE customers (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME,
    `name` VARCHAR(255) UNIQUE NOT NULL,
    `tenant_id` VARCHAR(36) UNIQUE,
    `external_customer_id` VARCHAR(255) UNIQUE,
    `supports_csp` BOOLEAN DEFAULT FALSE NOT NULL
) ENGINE = InnoDB;

CREATE TABLE software (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `vendor` VARCHAR(255),
    `formatted_name` VARCHAR(255),
    `formatted_vendor` VARCHAR(255),
    `summary` TEXT,
    `notes` TEXT,
    `auto_ticket_escalation_enabled` BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE KEY `ux_package_vendor_name` (`vendor`, `name`)
) ENGINE = InnoDB;

CREATE TABLE customer_software_settings (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `software_id` INT NOT NULL,
    `auto_ticket_escalation_enabled` BOOLEAN NOT NULL,
    UNIQUE KEY `ux_customer_software` (`customer_id`, `software_id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vulnerabilities (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cve_id` VARCHAR(30) UNIQUE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `severity` VARCHAR(30) NOT NULL,
    `cvss_v3` DECIMAL(3, 1),
    `cvss_vector` VARCHAR(255),
    `public_exploit` BOOLEAN DEFAULT FALSE,
    `exploit_verified` BOOLEAN DEFAULT FALSE,
    `exploit_in_kit` BOOLEAN DEFAULT FALSE,
    `cve_supportability` VARCHAR(100),
    `published_at` DATETIME NOT NULL,
    `updated_at` DATETIME,
    `first_detected_at` DATETIME,
    `patch_first_available_at` DATETIME,
    `epss` DECIMAL(8, 6)
) ENGINE = InnoDB;

CREATE TABLE vulnerability_exploit_types (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vulnerability_id` INT NOT NULL,
    `exploit_type` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vulnerability_references (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vulnerability_id` INT NOT NULL,
    `source` VARCHAR(100),
    `url` VARCHAR(255) NOT NULL,
    `notes` VARCHAR(255),
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vulnerability_affected_software (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vulnerability_id` INT NOT NULL,
    `software_id` INT NOT NULL,
    `vulnerable_versions` TEXT NOT NULL,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `ux_vuln_software_version` (`vulnerability_id`, `software_id`)
) ENGINE = InnoDB;

CREATE INDEX ix_vas_vulnerability ON `vulnerability_affected_software`(`vulnerability_id`);
CREATE INDEX ix_vas_software ON `vulnerability_affected_software`(`software_id`);

CREATE TABLE customer_vulnerability_software (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `vulnerability_id` INT NOT NULL,
    `software_id` INT NOT NULL,
    UNIQUE KEY `ux_customer_vuln_software` (`customer_id`, `vulnerability_id`, `software_id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_customer_vas_vulnerability ON `customer_vulnerability_software`(`vulnerability_id`);
CREATE INDEX ix_customer_vas_software ON `customer_vulnerability_software`(`software_id`);

CREATE TABLE vulnerability_tags (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vulnerability_id` INT NOT NULL,
    `tag` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE vulnerability_events (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vulnerability_id` INT NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `old_value` VARCHAR(255),
    `new_value` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_ve_vuln_created ON `vulnerability_events`(`vulnerability_id`, `created_at`);

-- TODO: Do we even need this?
CREATE TABLE customer_vulnerabilities (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `customer_id` INT NOT NULL,
    `vulnerability_id` INT NOT NULL,
    `last_partial_sync_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `last_full_sync_at` DATETIME,
    UNIQUE KEY `ux_customer_vuln` (`customer_id`, `vulnerability_id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_cv_vuln_customer ON `customer_vulnerabilities`(`vulnerability_id`, `customer_id`);
CREATE INDEX ix_cv_customer ON `customer_vulnerabilities`(`customer_id`);

-- TODO: Add day field as created_at can be off by seconds which might mess up the unique key
-- CREATE TABLE customer_vulnerability_counts (
--     `id` INT AUTO_INCREMENT PRIMARY KEY,
--     `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--     `customer_id` INT NOT NULL,
--     `vulnerability_id` INT NOT NULL,
--     `affected_devices` INT NOT NULL,
--     UNIQUE KEY `ux_vuln_customer_day` (`customer_id`, `vulnerability_id`, `created_at`),
--     FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
--     FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE
-- ) ENGINE = InnoDB;

CREATE TABLE devices (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_seen_at` DATETIME,
    `customer_id` INT NOT NULL,
    `machine_id` VARCHAR(100) UNIQUE NOT NULL,
    `dns_name` VARCHAR(100),
    `os_platform` VARCHAR(100),
    `os_version` VARCHAR(100),
    `os_build` VARCHAR(100),
    `is_aad_joined` BOOLEAN,
    `aad_device_id` VARCHAR(100),
    `last_sync_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_devices_machine_id ON `devices`(`machine_id`);
CREATE INDEX ix_devices_customer ON `devices`(`customer_id`);

CREATE TABLE device_notes (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME,
    `deleted_by` INT,
    `device_id` INT NOT NULL,
    `agent_id` INT NOT NULL,
    `note` TEXT NOT NULL,
    FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`deleted_by`) REFERENCES `agents`(`id`) ON DELETE CASCADE
);

CREATE TABLE device_vulnerabilities (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `device_id` INT NOT NULL,
    `vulnerability_id` INT NOT NULL,
    `software_id` INT NOT NULL,
    `detected_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `customer_id` INT NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    UNIQUE KEY `ux_device_vuln` (`device_id`, `vulnerability_id`, `software_id`),
    FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_dv_vuln_device ON `device_vulnerabilities`(`vulnerability_id`, `device_id`);
CREATE INDEX ix_dv_device ON `device_vulnerabilities`(`device_id`);

CREATE TABLE device_vulnerabilities_history (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `device_id` INT NOT NULL,
    `vulnerability_id` INT NOT NULL,
    `software_id` INT NOT NULL,
    `detected_at` DATETIME NOT NULL,
    `resolved_at` DATETIME NOT NULL,
    `auto_resolved` BOOLEAN NOT NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_dvh_device_detected ON `device_vulnerabilities_history` (`device_id`, `detected_at`);
CREATE INDEX ix_dvh_vulnerability ON `device_vulnerabilities_history`(`vulnerability_id`);
CREATE INDEX ix_dvh_device_dates ON `device_vulnerabilities_history` (`detected_at`, `resolved_at`, `device_id`);

CREATE TABLE remediation_tickets (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `customer_id` INT NOT NULL,
    `software_id` INT,
    `external_ticket_id` VARCHAR(50) NOT NULL,
    `status` VARCHAR(25) DEFAULT "OPEN" NOT NULL,
    `notes` TEXT,
    `opened_by_agent_id` INT,
    `last_ticket_update_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `last_sync_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`opened_by_agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`software_id`) REFERENCES `software`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX ix_rt_status ON `remediation_tickets`(`status`);

CREATE TABLE audit_logs (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `agent_id` INT,
    `customer_id` INT,
    `action` VARCHAR(50),
    `row_id` INT,
    `details_version` INT DEFAULT 1 NOT NULL,
    `details` JSON,
    FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE security_recommendations (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `defender_recommendation_id` VARCHAR(100) UNIQUE NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `recommendation_name` VARCHAR(255) NOT NULL,
    `vendor` VARCHAR(255),
    `remediation_type` VARCHAR(50),
    `related_component` VARCHAR(255)
) ENGINE = InnoDB;

CREATE TABLE customer_security_recommendation_metrics (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `customer_id` INT NOT NULL,
    `recommendation_id` INT NOT NULL,
    `exposed_machines_count` INT NOT NULL,
    `total_machines_count` INT NOT NULL,
    `exposed_critical_devices` INT NOT NULL,
    `config_score_impact` DECIMAL(5, 2),
    `exposure_impact` DECIMAL(5, 2),
    `public_exploit` BOOLEAN DEFAULT FALSE,
    `active_alert` BOOLEAN DEFAULT FALSE,
    `has_unpatchable_cve` BOOLEAN DEFAULT FALSE,
    `weaknesses` INT,
    `status` VARCHAR(50) NOT NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recommendation_id`) REFERENCES `security_recommendations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `ux_customer_reco_day` (`customer_id`, `recommendation_id`, `created_at`)
) ENGINE = InnoDB;

CREATE TABLE customer_security_recommendation_events (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `customer_id` INT NOT NULL,
    `recommendation_id` INT NOT NULL,
    `field_name` VARCHAR(50) NOT NULL,
    `old_value` VARCHAR(255),
    `new_value` VARCHAR(255),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recommendation_id`) REFERENCES `security_recommendations`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- CREATE TABLE scan_jobs_history (
--     `id` INT AUTO_INCREMENT PRIMARY KEY,
--     `started_at` DATETIME NOT NULL,
--     `finished_at` DATETIME NOT NULL,
--     `agent_id` INT,
--     `type` VARCHAR(25) NOT NULL,
--     `target_type` VARCHAR(30) NOT NULL,
--     `target_id` INT,
--     `status` VARCHAR(20) NOT NULL,
--     FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL
-- ) ENGINE = InnoDB;

-- TODO: Partition?
CREATE TABLE backend_logs (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `level` ENUM("INFO", "WARN", "ERROR", "DEBUG", "TRACE") NOT NULL,
    `source` VARCHAR(40) NOT NULL,
    `text` TEXT NOT NULL,
    `customer_id` INT,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX `ix_backend_logs_created_at` ON `backend_logs`(`created_at`);
CREATE INDEX `ix_backend_logs_level` ON `backend_logs`(`level`);
CREATE INDEX `ix_backend_logs_source` ON `backend_logs`(`source`);
CREATE INDEX `ix_backend_logs_customer` ON `backend_logs`(`customer_id`);

CREATE TABLE reports (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    `created_by_agent_id` INT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `sql_query` TEXT NOT NULL,
    `is_public` BOOLEAN NOT NULL,
    FOREIGN KEY (`created_by_agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL
) ENGINE = InnoDB;