import { BaseReport } from "./BaseReport";

export class CustomerOverviewReport extends BaseReport {
    
    generate() {
        this.generateHeader("Customer Overview Report", 1, 10);
        this.generateStats();
    }

    generateStats() {
        const startX = 40;
        const startY = 120;
        const boxWidth = 240;
        const boxHeight = 80;
        const gap = 20;

        this.generateStatBox(startX, startY, boxWidth, boxHeight, "Total Customers", "5", "#1d4ed8");
        this.generateStatBox(startX + boxWidth + gap, startY, boxWidth, boxHeight, "Disabled Customers", "4", "#92400e");
        this.generateStatBox(startX + boxWidth + gap, startY, boxWidth, boxHeight, "Disabled Customers", "4", "#92400e");
    }
}