// stores/JobStore.ts
import { create } from 'zustand';
import { jobService } from '../../services/api/JobService';

interface JobInfo {
  status: string;
  progress: number;
  startTime: Date;
  polling: boolean;
  intervalId?: NodeJS.Timeout;
}

interface JobStoreState {
  activeJobs: Map<string, JobInfo>;
  
  // Create a new job and start tracking it
  createJob: (endpoint: string, payload: any) => Promise<string>;
  
  // Start polling for a job
  pollJob: (
    endpoint: string,
    jobId: string,
    options?: {
      interval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
      onComplete?: (result: any) => void;
      onError?: (error: Error) => void;
    }
  ) => void;
  
  // Stop polling for a job
  stopPolling: (jobId: string) => void;
  
  // Check if a job is currently being polled
  isPolling: (jobId: string) => boolean;
  
  // Get job info
  getJobInfo: (jobId: string) => JobInfo | null;
  
  // Clear a job from tracking
  clearJob: (jobId: string) => void;
}

export const useJobStore = create<JobStoreState>((set, get) => ({
  activeJobs: new Map<string, JobInfo>(),
  
  createJob: async (endpoint, payload) => {
    try {
      const jobId = await jobService.createJob(endpoint, payload);
      
      // Add job to tracking
      set((state) => {
        const newActiveJobs = new Map(state.activeJobs);
        newActiveJobs.set(jobId, {
          status: 'pending',
          progress: 0,
          startTime: new Date(),
          polling: false
        });
        return { activeJobs: newActiveJobs };
      });
      
      return jobId;
    } catch (error) {
      console.error('[JobStore] Error creating job:', error);
      throw error;
    }
  },
  
  pollJob: (endpoint, jobId, options = {}) => {
    const { activeJobs } = get();
    
    // Check if job exists
    if (!activeJobs.has(jobId)) {
      console.error(`[JobStore] Cannot poll job ${jobId}: not found in active jobs`);
      return;
    }
    
    // Check if already polling
    if (activeJobs.get(jobId)?.polling) {
      console.log(`[JobStore] Job ${jobId} is already being polled`);
      return;
    }
    
    // Start polling
    set((state) => {
      const newActiveJobs = new Map(state.activeJobs);
      const jobInfo = newActiveJobs.get(jobId);
      
      if (jobInfo) {
        jobInfo.polling = true;
        newActiveJobs.set(jobId, jobInfo);
      }
      
      return { activeJobs: newActiveJobs };
    });
    
    // Set up progress callback
    const onProgress = (progress: number) => {
      set((state) => {
        const newActiveJobs = new Map(state.activeJobs);
        const jobInfo = newActiveJobs.get(jobId);
        
        if (jobInfo) {
          jobInfo.progress = progress;
          jobInfo.status = progress === 100 ? 'completed' : 'processing';
          newActiveJobs.set(jobId, jobInfo);
        }
        
        return { activeJobs: newActiveJobs };
      });
      
      // Forward progress to caller if they provided a callback
      if (options.onProgress) {
        options.onProgress(progress);
      }
    };
    
    // Start the actual polling process
    jobService.pollJobStatus(endpoint, jobId, {
      interval: options.interval,
      timeout: options.timeout,
      onProgress
    })
      .then((result) => {
        console.log(`[JobStore] Job ${jobId} completed successfully`);
        
        // Update job status one last time
        set((state) => {
          const newActiveJobs = new Map(state.activeJobs);
          const jobInfo = newActiveJobs.get(jobId);
          
          if (jobInfo) {
            jobInfo.status = 'completed';
            jobInfo.progress = 100;
            jobInfo.polling = false;
            newActiveJobs.set(jobId, jobInfo);
          }
          
          return { activeJobs: newActiveJobs };
        });
        
        // Call the complete callback if provided
        if (options.onComplete) {
          options.onComplete(result);
        }
        
        // Remove job from tracking after a brief delay
        setTimeout(() => {
          get().clearJob(jobId);
        }, 5000);
      })
      .catch((error) => {
        console.error(`[JobStore] Job ${jobId} failed:`, error);
        
        // Update job status
        set((state) => {
          const newActiveJobs = new Map(state.activeJobs);
          const jobInfo = newActiveJobs.get(jobId);
          
          if (jobInfo) {
            jobInfo.status = 'failed';
            jobInfo.polling = false;
            newActiveJobs.set(jobId, jobInfo);
          }
          
          return { activeJobs: newActiveJobs };
        });
        
        // Call the error callback if provided
        if (options.onError) {
          options.onError(error);
        }
        
        // Remove job from tracking after a brief delay
        setTimeout(() => {
          get().clearJob(jobId);
        }, 5000);
      });
  },
  
  stopPolling: (jobId) => {
    set((state) => {
      const newActiveJobs = new Map(state.activeJobs);
      const jobInfo = newActiveJobs.get(jobId);
      
      if (jobInfo) {
        if (jobInfo.intervalId) {
          clearInterval(jobInfo.intervalId);
        }
        jobInfo.polling = false;
        newActiveJobs.set(jobId, jobInfo);
      }
      
      return { activeJobs: newActiveJobs };
    });
  },
  
  isPolling: (jobId) => {
    const jobInfo = get().activeJobs.get(jobId);
    return jobInfo ? jobInfo.polling : false;
  },
  
  getJobInfo: (jobId) => {
    return get().activeJobs.get(jobId) || null;
  },
  
  clearJob: (jobId) => {
    set((state) => {
      // First stop polling if active
      const jobInfo = state.activeJobs.get(jobId);
      if (jobInfo?.polling && jobInfo.intervalId) {
        clearInterval(jobInfo.intervalId);
      }
      
      // Then remove from active jobs
      const newActiveJobs = new Map(state.activeJobs);
      newActiveJobs.delete(jobId);
      
      return { activeJobs: newActiveJobs };
    });
  }
}));