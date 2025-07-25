import axios, { AxiosInstance, AxiosResponse } from 'axios';

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

export class DataverseClient {
  private config: DataverseConfig;
  private httpClient: AxiosInstance;
  private authToken: AuthToken | null = null;

  constructor(config: DataverseConfig) {
    this.config = config;
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
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
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
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
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
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
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

  async deleteMetadata(endpoint: string): Promise<void> {
    const metadataClient = axios.create({
      baseURL: `${this.config.dataverseUrl}/api/data/v9.2/`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
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
}