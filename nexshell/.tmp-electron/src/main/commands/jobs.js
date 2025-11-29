"use strict";
/**
 * Background job management commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKillJobs = exports.handleJobs = exports.jobManager = void 0;
class JobManager {
    constructor() {
        this.jobs = new Map();
        this.counter = 0;
        this.MAX_COMPLETED_JOBS = 20;
    }
    create(command) {
        const controller = new AbortController();
        const job = {
            id: ++this.counter,
            command,
            status: 'running',
            startedAt: Date.now(),
            controller
        };
        this.jobs.set(job.id, job);
        this.pruneCompleted();
        return job;
    }
    get(id) {
        return this.jobs.get(id);
    }
    getAll() {
        return Array.from(this.jobs.values());
    }
    kill(id) {
        const job = this.jobs.get(id);
        if (!job) {
            return false;
        }
        if (job.status === 'running') {
            job.status = 'killed';
            job.endedAt = Date.now();
            job.exitCode = 143;
            job.stderr = 'Job killed by user.';
            job.controller.abort();
        }
        this.jobs.delete(id);
        return true;
    }
    update(job) {
        this.jobs.set(job.id, job);
        this.pruneCompleted();
    }
    pruneCompleted() {
        const completed = Array.from(this.jobs.values()).filter((job) => job.status !== 'running');
        if (completed.length <= this.MAX_COMPLETED_JOBS) {
            return;
        }
        const sorted = completed
            .filter((job) => typeof job.endedAt === 'number')
            .sort((a, b) => a.endedAt - b.endedAt);
        const excess = completed.length - this.MAX_COMPLETED_JOBS;
        sorted.slice(0, excess).forEach((job) => this.jobs.delete(job.id));
    }
}
exports.jobManager = new JobManager();
const handleJobs = async () => {
    const jobs = exports.jobManager.getAll();
    if (jobs.length === 0) {
        return { stdout: 'No background jobs tracked.', stderr: '', exitCode: 0 };
    }
    const rows = jobs
        .sort((a, b) => a.id - b.id)
        .map((job) => {
        const durationMs = (job.endedAt ?? Date.now()) - job.startedAt;
        const duration = `${(durationMs / 1000).toFixed(1)}s`;
        const exitInfo = job.exitCode !== undefined ? ` exit:${job.exitCode}` : '';
        return `#${job.id} [${job.status}] ${job.command}${exitInfo} (${duration})`;
    });
    return { stdout: rows.join('\n'), stderr: '', exitCode: 0 };
};
exports.handleJobs = handleJobs;
const handleKillJobs = async (args) => {
    const jobIdStr = args[0];
    if (!jobIdStr) {
        return { stdout: '', stderr: 'killjobs: job id required', exitCode: 1 };
    }
    const jobId = Number(jobIdStr);
    if (!Number.isInteger(jobId) || jobId <= 0) {
        return { stdout: '', stderr: 'killjobs: invalid job id', exitCode: 1 };
    }
    const killed = exports.jobManager.kill(jobId);
    if (!killed) {
        return { stdout: '', stderr: `killjobs: job #${jobId} not found`, exitCode: 1 };
    }
    return { stdout: `Terminated job #${jobId}`, stderr: '', exitCode: 0 };
};
exports.handleKillJobs = handleKillJobs;
