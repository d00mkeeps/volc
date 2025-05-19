// import { GraphBundleApiService, graphBundleApiService } from './graphBundleService';

// /**
//  * API Service Factory to provide access to all API services
//  * This gives you a single entry point for all API services
//  */
// export class ApiServiceFactory {
//   private static instance: ApiServiceFactory;
  
//   private _graphBundleService: GraphBundleApiService;
//   // Add other services as needed
  
//   private constructor() {
//     this._graphBundleService = graphBundleApiService;
//     // Initialize other services
//   }
  
//   /**
//    * Get singleton instance
//    */
//   public static getInstance(): ApiServiceFactory {
//     if (!ApiServiceFactory.instance) {
//       ApiServiceFactory.instance = new ApiServiceFactory();
//     }
//     return ApiServiceFactory.instance;
//   }
  
//   /**
//    * Get Graph Bundle API Service
//    */
//   public get graphBundleService(): GraphBundleApiService {
//     return this._graphBundleService;
//   }
  
//   // Add getters for other services as needed
// }

// /**
//  * Export a function to get the API service factory
//  */
// export function getApiServices(): ApiServiceFactory {
//   return ApiServiceFactory.getInstance();
// }