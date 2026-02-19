const DATADIS_BASE_URL = 'https://datadis.es/api-private/api';
const DATADIS_AUTH_URL = 'https://datadis.es/nikola-auth/tokens/login';

interface DatadisConfig {
  username?: string;
  password?: string;
}

export class DatadisService {
  private username: string;
  private password: string;
  private token: string | null = null;

  constructor(config: DatadisConfig = {}) {
    this.username = config.username || process.env.DATADIS_USERNAME || '';
    this.password = config.password || process.env.DATADIS_PASSWORD || '';

    if (!this.username || !this.password) {
      console.error('Datadis credentials missing. Please check .env.local');
      // We don't throw here to allow instantiation, but requests will fail
    }
  }

  private async login(): Promise<string> {
    if (this.token) return this.token;
    
    if (!this.username || !this.password) {
      throw new Error('Missing Datadis credentials (DATADIS_USERNAME or DATADIS_PASSWORD)');
    }

    try {
      console.log(`Attempting login to Datadis for user: ${this.username ? this.username.substring(0, 3) + '***' : 'MISSING'}`);
      
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);

      const response = await fetch(DATADIS_AUTH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Datadis Login Failed. Status: ${response.status}, Body: ${errorText}`);
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }

      this.token = await response.text();
      return this.token;
    } catch (error) {
      console.error('Datadis Login Error:', error);
      throw error;
    }
  }

  private async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const token = await this.login();
      
      const url = new URL(`${DATADIS_BASE_URL}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
             url.searchParams.append(key, String(params[key]));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401) {
        this.token = null;
        throw new Error('Unauthorized - Token may have expired');
      }

      if (response.status === 429) {
        throw new Error('429 Rate Limit Exceeded: Daily query limit reached for this supply.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request to ${endpoint} failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Datadis Request Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getSupplies(authorizedNif?: string) {
    // V2 Recommended
    const params: any = {};
    if (authorizedNif) params.authorizedNif = authorizedNif;
    
    return this.request('/get-supplies-v2', params);
  }

  async getConsumptionData(params: {
    cups: string;
    distributorCode: string;
    startDate: string; // YYYY/MM
    endDate: string;   // YYYY/MM
    measurementType: number; // 0 = hourly, 1 = quarter-hourly
    pointType: number;
    authorizedNif?: string;
  }) {
    // V2 Recommended
    return this.request('/get-consumption-data-v2', params);
  }
  async createAuthorization(params: {
    authorizedNif: string;
    startDate?: string; // YYYY/MM/DD, default today? Datadis might require it. Prompt says "Fecha inicio"
    endDate?: string;   // YYYY/MM/DD
    cups?: string[];    // Optional, if empty authorizes all
  }) {
    // Default dates if needed, but let's pass them as is
    return this.request('/new-authorization', params);
  }

  async listAuthorizations() {
    return this.request('/list-authorization');
  }

  async cancelAuthorization(authorizedNif: string) {
    // The prompt says params: "authorizedNif" (required)
    // endpoint: /cancel-authorization
    return this.request('/cancel-authorization', { authorizedNif });
  }

  async getContractDetail(params: {
    cups: string;
    distributorCode: string;
    authorizedNif?: string;
  }) {
    // V2 Recommended
    return this.request('/get-contract-detail-v2', params);
  }

  async getMaxPower(params: {
    cups: string;
    distributorCode: string;
    startDate: string;
    endDate: string;
    authorizedNif?: string;
  }) {
    // V2 Recommended
    return this.request('/get-max-power-v2', params);
  }
}

export const datadisService = new DatadisService();
