// services/api/JobService.ts
import { apiGet, apiPost } from './core/apiClient';
import { BaseService } from '../db/base';

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export class JobService extends BaseService {
  /**
   * Create a new job
   * @param endpoint The API endpoint to create the job
   * @param payload The job payload
   */
  async createJob(endpoint: string, payload: any): Promise<string> {
    try {
      console.log(`[JobService] Creating job at ${endpoint}`, payload);
      
      const response = await apiPost<{ job_id: string }>(endpoint, payload);
      
      console.log(`[JobService] Job created with ID: ${response.job_id}`);
      return response.job_id;
    } catch (error) {
      console.error('[JobService] Error creating job:', error);
      return this.handleError(error);
    }
  }

  /**
   * Get the current status of a job
   * @param endpoint The API endpoint to check job status
   * @param jobId The job ID
   */
  async getJobStatus(endpoint: string, jobId: string): Promise<JobStatus> {
    try {
      console.log(`[JobService] Checking status for job: ${jobId}`);
      
      const jobStatus = await apiGet<JobStatus>(`${endpoint}/${jobId}`);
      
      console.log(`[JobService] Job status: ${jobStatus.status}, Progress: ${jobStatus.progress}%`);
      return jobStatus;
    } catch (error) {
      console.error(`[JobService] Error checking job status:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Poll for job completion
   * @param endpoint The API endpoint to check job status
   * @param jobId The job ID
   * @param options Polling options
   */
  async pollJobStatus(
    endpoint: string,
    jobId: string,
    options: {
      interval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<any> {
    const interval = options.interval || 1000; // Default: poll every 1 second
    const timeout = options.timeout || 60000; // Default: timeout after 60 seconds
    
    console.log(`[JobService] Starting polling for job: ${jobId}`);
    console.log(`[JobService] Polling interval: ${interval}ms, timeout: ${timeout}ms`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let pollInterval: NodeJS.Timeout;
      
      // Function to clear interval and clean up
      const cleanUp = () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
      
      // Poll at regular intervals
      pollInterval = setInterval(async () => {
        try {
          // Check if we've exceeded the timeout
          if (Date.now() - startTime > timeout) {
            cleanUp();
            reject(new Error(`Polling timed out after ${timeout}ms`));
            return;
          }
          
          // Get current job status
          const jobStatus = await this.getJobStatus(endpoint, jobId);
          
          // Report progress if callback provided
          if (options.onProgress && typeof jobStatus.progress === 'number') {
            options.onProgress(jobStatus.progress);
          }
          
          // Check if job is complete
          if (jobStatus.status === 'completed') {
            cleanUp();
            console.log(`[JobService] Job completed successfully:`, jobStatus.result);
            resolve(jobStatus.result);
            return;
          }
          
          // Check if job failed
          if (jobStatus.status === 'failed') {
            cleanUp();
            console.error(`[JobService] Job failed:`, jobStatus.error);
            reject(new Error(jobStatus.error || 'Job failed'));
            return;
          }
          
          // Otherwise, continue polling
        } catch (error) {
          cleanUp();
          console.error(`[JobService] Error during polling:`, error);
          reject(error);
        }
      }, interval);
    });
  }
}

export const jobService = new JobService();