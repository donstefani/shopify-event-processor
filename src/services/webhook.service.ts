import { TokenService } from './token.service.js';

/**
 * Webhook Service for Event Processor
 * 
 * Handles webhook registration and management using tokens from auth-service
 */

export interface WebhookRegistration {
  topic: string;
  address: string;
  format?: 'json' | 'xml';
  fields?: string[];
  metafield_namespaces?: string[];
  private_metafield_namespaces?: string[];
}

export interface ShopifyWebhook {
  id: number;
  address: string;
  topic: string;
  format: 'json' | 'xml';
  created_at: string;
  updated_at: string;
  fields?: string[];
  metafield_namespaces?: string[];
  private_metafield_namespaces?: string[];
  api_version?: string;
}

export interface WebhookApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class WebhookService {
  private readonly tokenService: TokenService;
  private readonly apiVersion: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.tokenService = new TokenService();
    this.apiVersion = process.env['SHOPIFY_API_VERSION'] || '2025-07';
    this.clientId = process.env['SHOPIFY_CLIENT_ID'] || '';
    this.clientSecret = process.env['SHOPIFY_CLIENT_SECRET'] || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️  SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET not set! Webhook registration may fail.');
    }
  }

  /**
   * Register a webhook with Shopify using stored access token
   */
  async registerWebhook(
    shopDomain: string, 
    webhookData: WebhookRegistration
  ): Promise<WebhookApiResponse<ShopifyWebhook>> {
    try {
      const tokenData = await this.tokenService.getToken(shopDomain);
      if (!tokenData) {
        return {
          success: false,
          error: 'No access token found',
          message: `No valid access token found for shop: ${shopDomain}. Please reinstall the app.`
        };
      }

      const url = `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks.json`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': tokenData.accessToken
        },
        body: JSON.stringify({ webhook: webhookData })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: 'Webhook registration failed',
          message: `Failed to register webhook: ${response.status} ${response.statusText}`,
          data: errorData as any
        };
      }

      const result = await response.json() as { webhook: ShopifyWebhook };
      return {
        success: true,
        data: result.webhook,
        message: 'Webhook registered successfully'
      };
    } catch (error) {
      console.error('Webhook registration error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to register webhook'
      };
    }
  }

  /**
   * List all webhooks for a shop
   */
  async listWebhooks(shopDomain: string): Promise<WebhookApiResponse<ShopifyWebhook[]>> {
    try {
      const tokenData = await this.tokenService.getToken(shopDomain);
      if (!tokenData) {
        return {
          success: false,
          error: 'No access token found',
          message: `No valid access token found for shop: ${shopDomain}. Please reinstall the app.`
        };
      }

      const url = `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': tokenData.accessToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: 'Failed to list webhooks',
          message: `Failed to list webhooks: ${response.status} ${response.statusText}`,
          data: errorData as any
        };
      }

      const result = await response.json() as { webhooks: ShopifyWebhook[] };
      return {
        success: true,
        data: result.webhooks,
        message: 'Webhooks retrieved successfully'
      };
    } catch (error) {
      console.error('Webhook listing error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to list webhooks'
      };
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(shopDomain: string, webhookId: number): Promise<WebhookApiResponse<never>> {
    try {
      const tokenData = await this.tokenService.getToken(shopDomain);
      if (!tokenData) {
        return {
          success: false,
          error: 'No access token found',
          message: `No valid access token found for shop: ${shopDomain}. Please reinstall the app.`
        };
      }

      const url = `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks/${webhookId}.json`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': tokenData.accessToken
        }
      });

      if (!response.ok) {
        await response.json().catch(() => ({}));
        return {
          success: false,
          error: 'Failed to delete webhook',
          message: `Failed to delete webhook: ${response.status} ${response.statusText}`
        } as WebhookApiResponse<never>;
      }

      return {
        success: true,
        message: 'Webhook deleted successfully'
      } as WebhookApiResponse<never>;
    } catch (error) {
      console.error('Webhook deletion error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete webhook'
      };
    }
  }

  /**
   * Get a specific webhook
   */
  async getWebhook(shopDomain: string, webhookId: number): Promise<WebhookApiResponse<ShopifyWebhook>> {
    try {
      const tokenData = await this.tokenService.getToken(shopDomain);
      if (!tokenData) {
        return {
          success: false,
          error: 'No access token found',
          message: `No valid access token found for shop: ${shopDomain}. Please reinstall the app.`
        };
      }

      const url = `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks/${webhookId}.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': tokenData.accessToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: 'Failed to get webhook',
          message: `Failed to get webhook: ${response.status} ${response.statusText}`,
          data: errorData as any
        };
      }

      const result = await response.json() as { webhook: ShopifyWebhook };
      return {
        success: true,
        data: result.webhook,
        message: 'Webhook retrieved successfully'
      };
    } catch (error) {
      console.error('Webhook retrieval error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve webhook'
      };
    }
  }
}
