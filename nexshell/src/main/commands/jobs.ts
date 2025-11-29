/**
 * Background job management commands
 */

import type { CommandHandler } from './types';

export type JobStatus = 'running' | 'completed' | 'failed' | 'killed';

export interface JobRecord {
  id: number;
  command: string;
  status: JobStatus;
  startedAt: number;
  endedAt?: number;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  controller: AbortController;
}

class JobManager {
  private jobs = new Map<number, JobRecord>();
  private counter = 0;
  private readonly MAX_COMPLETED_JOBS = 20;

  create(command: string): JobRecord {
    const controller = new AbortController();
    const job: JobRecord = {
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

  get(id: number): JobRecord | undefined {
    return this.jobs.get(id);
  }

  getAll(): JobRecord[] {
    return Array.from(this.jobs.values());
  }

  kill(id: number): boolean {
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

  update(job: JobRecord): void {
    this.jobs.set(job.id, job);
    this.pruneCompleted();
  }

  private pruneCompleted(): void {
    const completed = Array.from(this.jobs.values()).filter((job) => job.status !== 'running');
    if (completed.length <= this.MAX_COMPLETED_JOBS) {
      return;
    }

    const sorted = completed
      .filter((job): job is JobRecord & { endedAt: number } => typeof job.endedAt === 'number')
      .sort((a, b) => a.endedAt - b.endedAt);

    const excess = completed.length - this.MAX_COMPLETED_JOBS;
    sorted.slice(0, excess).forEach((job) => this.jobs.delete(job.id));
  }
}

export const jobManager = new JobManager();

export const handleJobs: CommandHandler = async () => {
  const jobs = jobManager.getAll();
  
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

export const handleKillJobs: CommandHandler = async (args) => {
  const jobIdStr = args[0];
  if (!jobIdStr) {
    return { stdout: '', stderr: 'killjobs: job id required', exitCode: 1 };
  }

  const jobId = Number(jobIdStr);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return { stdout: '', stderr: 'killjobs: invalid job id', exitCode: 1 };
  }

  const killed = jobManager.kill(jobId);
  if (!killed) {
    return { stdout: '', stderr: `killjobs: job #${jobId} not found`, exitCode: 1 };
  }

  return { stdout: `Terminated job #${jobId}`, stderr: '', exitCode: 0 };
};



