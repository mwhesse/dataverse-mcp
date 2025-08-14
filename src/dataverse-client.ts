import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface DataverseConfig {
  dataverseUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface DataverseError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}

export interface SolutionContext {
  solutionUniqueName: string;
  solutionDisplayName?: string;
  publisherUniqueName?: string;
  publisherDisplayName?: string;
  customizationPrefix?: string;
  lastUpdated: string;
}

export class DataverseClient {
  private config: DataverseConfig;
  private httpClient: AxiosInstance;
  private authToken: AuthToken | null = null;
  private solutionUniqueName: string | null = null;
  private solutionContext: SolutionContext | null = null;
  private contextFilePath: string;

  constructor(config: DataverseConfig) {
    this.config = config;
    this.contextFilePath = path.join(process.cwd(), '.dataverse-mcp');
    
    // Load persisted solution context on startup
    this.loadSolutionContext();
    
    this.httpClient = axios.create({
      baseURL: `${config.dataverseUrl}/api/data/v9.2/`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    });

    // Add request interceptor to handle authentication
    this.httpClient.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken.access_token}`;
      }
      return config;
    });

    // Add response interceptor to handle errors
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );
  }

  private async authenticate(): Promise<AuthToken> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('scope', `${this.config.dataverseUrl}/.default`);

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token: AuthToken = {
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in * 1000) - 60000 // Subtract 1 minute for safety
      };

      return token;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken || Date.now() >= this.authToken.expires_at) {
      this.authToken = await this.authenticate();
    }
  }

  // Solution context persistence methods
  private loadSolutionContext(): void {
    try {
      if (fs.existsSync(this.contextFilePath)) {
        const contextData = fs.readFileSync(this.contextFilePath, 'utf8');
        this.solutionContext = JSON.parse(contextData);
        this.solutionUniqueName = this.solutionContext?.solutionUniqueName || null;
        
        if (this.solutionContext) {
          console.log(`Loaded solution context: ${this.solutionContext.solutionUniqueName} (${this.solutionContext.solutionDisplayName || 'Unknown'})`);
        }
      }
    } catch (error) {
      console.warn('Failed to load solution context from .dataverse-mcp file:', error instanceof Error ? error.message : 'Unknown error');
      // Reset context on error
      this.solutionContext = null;
      this.solutionUniqueName = null;
    }
  }

  private saveSolutionContext(): void {
    try {
      if (this.solutionContext) {
        fs.writeFileSync(this.contextFilePath, JSON.stringify(this.solutionContext, null, 2), 'utf8');
      } else {
        // Remove file when context is cleared
        if (fs.existsSync(this.contextFilePath)) {
          fs.unlinkSync(this.contextFilePath);
        }
      }
    } catch (error) {
      console.warn('Failed to save solution context to .dataverse-mcp file:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Enhanced solution context methods
  async setSolutionContext(solutionUniqueName: string): Promise<void> {
    try {
      // Fetch solution details to populate context
      const result = await this.get(
        `solutions?$filter=uniquename eq '${solutionUniqueName}'&$expand=publisherid($select=uniquename,friendlyname,customizationprefix)&$select=uniquename,friendlyname`
      );

      if (!result.value || result.value.length === 0) {
        throw new Error(`Solution '${solutionUniqueName}' not found`);
      }

      const solution = result.value[0];
      const publisher = solution.publisherid;

      this.solutionContext = {
        solutionUniqueName: solution.uniquename,
        solutionDisplayName: solution.friendlyname,
        publisherUniqueName: publisher?.uniquename,
        publisherDisplayName: publisher?.friendlyname,
        customizationPrefix: publisher?.customizationprefix,
        lastUpdated: new Date().toISOString()
      };

      this.solutionUniqueName = solutionUniqueName;
      this.saveSolutionContext();
    } catch (error) {
      throw new Error(`Failed to set solution context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getSolutionContext(): SolutionContext | null {
    return this.solutionContext;
  }

  getSolutionUniqueName(): string | null {
    return this.solutionUniqueName;
  }

  clearSolutionContext(): void {
    this.solutionUniqueName = null;
    this.solutionContext = null;
    this.saveSolutionContext();
  }

  // Helper method to get headers with solution context
  private getMetadataHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };

    if (this.solutionUniqueName) {
      headers['MSCRM.SolutionUniqueName'] = this.solutionUniqueName;
    }

    return headers;
  }

  // Helper method to get the customization prefix from the current solution context
  getCustomizationPrefix(): string | null {
    if (!this.solutionContext) {
      return null;
    }
    return this.solutionContext.customizationPrefix || null;
  }

  // Async method to refresh and get customization prefix (for backward compatibility)
  async getCustomizationPrefixAsync(): Promise<string> {
    if (!this.solutionUniqueName) {
      throw new Error('No solution context is set. Please set a solution context using set_solution_context tool to get the customization prefix.');
    }

    // If we have cached prefix, return it
    if (this.solutionContext?.customizationPrefix) {
      return this.solutionContext.customizationPrefix;
    }

    // Otherwise fetch it
    try {
      const result = await this.get(
        `solutions?$filter=uniquename eq '${this.solutionUniqueName}'&$expand=publisherid($select=customizationprefix)`
      );

      if (!result.value || result.value.length === 0) {
        throw new Error(`Solution '${this.solutionUniqueName}' not found`);
      }

      const prefix = result.value[0].publisherid?.customizationprefix;
      if (!prefix) {
        throw new Error(`No customization prefix found for solution '${this.solutionUniqueName}'`);
      }

      return prefix;
    } catch (error) {
      throw new Error(`Failed to get customization prefix: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.get(endpoint, { params });
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.post(endpoint, data);
    return response.data;
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.patch(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint: string): Promise<void> {
    await this.httpClient.delete(endpoint);
  }

  // Metadata-specific methods
  async getMetadata<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: this.getMetadataHeaders()
    });

    // Add error interceptor
    metadataClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      metadataClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    const response: AxiosResponse<T> = await metadataClient.get(endpoint, { params });
    return response.data;
  }

  async postMetadata<T = any>(endpoint: string, data?: any): Promise<T> {
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: this.getMetadataHeaders()
    });

    // Add error interceptor
    metadataClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      metadataClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    const response: AxiosResponse<T> = await metadataClient.post(endpoint, data);
    return response.data;
  }

  async patchMetadata<T = any>(endpoint: string, data?: any): Promise<T> {
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: this.getMetadataHeaders()
    });

    // Add error interceptor
    metadataClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      metadataClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    const response: AxiosResponse<T> = await metadataClient.patch(endpoint, data);
    return response.data;
  }

  async putMetadata<T = any>(endpoint: string, data?: any, additionalHeaders?: Record<string, string>): Promise<T> {
    const headers = { ...this.getMetadataHeaders(), ...additionalHeaders };
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers
    });

    // Add error interceptor
    metadataClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      metadataClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    const response: AxiosResponse<T> = await metadataClient.put(endpoint, data);
    return response.data;
  }

  async deleteMetadata(endpoint: string): Promise<void> {
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: this.getMetadataHeaders()
    });

    // Add error interceptor
    metadataClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      metadataClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    await metadataClient.delete(endpoint);
  }

  // Action-specific method for calling Dataverse actions
  async callAction<T = any>(actionName: string, data?: any): Promise<T> {
    const actionClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    });

    // Add error interceptor
    actionClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          const dataverseError = error.response.data as DataverseError;
          throw new Error(`Dataverse API Error: ${dataverseError.error.message} (Code: ${dataverseError.error.code})`);
        }
        throw error;
      }
    );

    await this.ensureAuthenticated();
    if (this.authToken) {
      actionClient.defaults.headers.Authorization = `Bearer ${this.authToken.access_token}`;
    }

    // Actions should be called with Microsoft.Dynamics.CRM prefix for bound actions
    // Global actions and option set actions don't need the prefix
    const globalActions = [
      'PublishXml', 'PublishAllXml', 'ImportSolution', 'ExportSolution',
      'InsertOptionValue', 'UpdateOptionValue', 'DeleteOptionValue', 'OrderOption'
    ];
    const actionUrl = globalActions.includes(actionName) ? actionName : `Microsoft.Dynamics.CRM.${actionName}`;
    const response: AxiosResponse<T> = await actionClient.post(actionUrl, data);
    return response.data;
  }
}