import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

/**
 * CronManager — Handled scheduled SQL script execution on a separate MSSQL database.
 * 
 * NOTE: mssql is loaded with require() to maintain compatibility with the existing
 * MssqlAdapter's implementation style.
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const mssql = require('mssql');

interface CronJobConfig {
    name: string;
    schedule: string;
    script: string;
    enabled: boolean;
}

interface CronSettings {
    database: any;
    jobs: CronJobConfig[];
}

export class CronManager {
    private settingsPath: string;
    private scriptsDir: string;
    private settings: CronSettings | null = null;
    private pool: any = null;

    constructor() {
        this.settingsPath = '';
        this.scriptsDir = '';

        // Try multiple potential locations for the settings file
        const candidates = [
            path.join(process.cwd(), 'cronjob-settings.json'),
            path.join(process.cwd(), 'varuna-bff', 'cronjob-settings.json'),
            path.join(__dirname, '..', 'cronjob-settings.json'),
            path.join(__dirname, '..', '..', 'cronjob-settings.json'),
            path.join(__dirname, '..', '..', '..', 'cronjob-settings.json')
        ];

        console.log('[CronManager] Searching for settings file...');
        let found = false;
        for (const candidate of candidates) {
            console.log(`[CronManager] Checking: ${candidate}`);
            if (fs.existsSync(candidate)) {
                this.settingsPath = candidate;
                this.scriptsDir = path.join(path.dirname(candidate), 'cronjob-scripts');
                console.log(`[CronManager] Found settings at: ${candidate}`);
                found = true;
                break;
            }
        }

        if (!found) {
            // Default fallbacks if nothing found
            this.settingsPath = candidates[0];
            this.scriptsDir = path.join(process.cwd(), 'cronjob-scripts');
        }
    }

    public async initialize(): Promise<void> {
        console.log('[CronManager] Initializing...');
        
        if (!fs.existsSync(this.settingsPath)) {
            console.warn(`[CronManager] Settings file not found at ${this.settingsPath}. Skipping cron initialization.`);
            return;
        }

        console.log(`[CronManager] Loading settings from: ${this.settingsPath}`);
        console.log(`[CronManager] Using scripts from: ${this.scriptsDir}`);

        try {
            const rawSettings = fs.readFileSync(this.settingsPath, 'utf-8');
            this.settings = JSON.parse(rawSettings);
        } catch (error) {
            console.error('[CronManager] Error reading settings file:', error);
            return;
        }

        if (!this.settings || !this.settings.jobs || this.settings.jobs.length === 0) {
            console.log('[CronManager] No jobs configured.');
            return;
        }

        try {
            console.log(`[CronManager] Connecting to target database: ${this.settings.database.server}/${this.settings.database.database}`);
            
            // Set default timeouts if not provided in settings
            const dbConfig = {
                ...this.settings.database,
                requestTimeout: this.settings.database.requestTimeout || 300000, // 5 minutes default
                connectionTimeout: this.settings.database.connectionTimeout || 30000, // 30 seconds default
                options: {
                    ...this.settings.database.options,
                    encrypt: this.settings.database.options?.encrypt !== false,
                    trustServerCertificate: this.settings.database.options?.trustServerCertificate !== false
                }
            };

            this.pool = await new mssql.ConnectionPool(dbConfig).connect();
            console.log('[CronManager] Connected to target database with timeout:', dbConfig.requestTimeout);
        } catch (error) {
            console.error('[CronManager] Failed to connect to target database:', error);
            return;
        }

        this.scheduleJobs();
    }

    private scheduleJobs(): void {
        if (!this.settings) return;

        for (const job of this.settings.jobs) {
            if (!job.enabled) {
                console.log(`[CronManager] Job "${job.name}" is disabled. Skipping.`);
                continue;
            }

            console.log(`[CronManager] Scheduling job "${job.name}" with schedule "${job.schedule}"`);
            
            cron.schedule(job.schedule, async () => {
                await this.executeJob(job);
            });
        }
    }

    private async executeJob(job: CronJobConfig): Promise<void> {
        console.log(`[CronManager] [${new Date().toISOString()}] Starting job: ${job.name}`);
        
        const scriptPath = path.join(this.scriptsDir, job.script);
        if (!fs.existsSync(scriptPath)) {
            console.error(`[CronManager] Script file not found: ${scriptPath}`);
            return;
        }

        try {
            const sql = fs.readFileSync(scriptPath, 'utf-8');
            const batches = sql.split(/^\s*GO\s*$/im).filter((b: string) => b.trim());
            
            for (const batch of batches) {
                await this.pool.request().query(batch);
            }
            
            console.log(`[CronManager] Job completed successfully: ${job.name}`);
        } catch (error) {
            console.error(`[CronManager] Error executing job "${job.name}":`, error);
        }
    }
}
