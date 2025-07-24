import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';

// 8-1. Adobe 생태계 통합
export interface AdobeCredentials {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  expiresAt: Date;
}

export interface CreativeCloudProject {
  id: string;
  name: string;
  type: 'premiere' | 'after_effects' | 'photoshop';
  lastModified: Date;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
}

export interface AdobeStockAsset {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'template';
  previewUrl: string;
  downloadUrl?: string;
  license: 'standard' | 'extended';
  price?: number;
  keywords: string[];
}

// 8-1-1. Creative Cloud API 통합
export class AdobeIntegrationService {
  private baseUrl = 'https://cc-api.adobe.io';
  private stockBaseUrl = 'https://stock.adobe.io';

  constructor() {
    logger.info('Adobe Integration Service initialized');
  }

  // 8-1-2. Adobe ID 연동
  async authenticateUser(authCode: string): Promise<AdobeCredentials> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: process.env.ADOBE_CLIENT_ID!,
          client_secret: process.env.ADOBE_CLIENT_SECRET!,
          redirect_uri: process.env.ADOBE_REDIRECT_URI!
        })
      });

      const data = await response.json();
      
      const credentials: AdobeCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        clientId: process.env.ADOBE_CLIENT_ID!,
        clientSecret: process.env.ADOBE_CLIENT_SECRET!,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };

      // 캐시에 저장
      await cache.set(`adobe:credentials:${data.user_id}`, credentials, data.expires_in);

      logger.info('Adobe authentication successful');
      return credentials;
    } catch (error) {
      logger.error('Adobe authentication failed:', error);
      throw new Error('Adobe authentication failed');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AdobeCredentials> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.ADOBE_CLIENT_ID!,
          client_secret: process.env.ADOBE_CLIENT_SECRET!
        })
      });

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        clientId: process.env.ADOBE_CLIENT_ID!,
        clientSecret: process.env.ADOBE_CLIENT_SECRET!,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };
    } catch (error) {
      logger.error('Adobe token refresh failed:', error);
      throw new Error('Failed to refresh Adobe token');
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': process.env.ADOBE_CLIENT_ID!
        }
      });

      if (!response.ok) {
        throw new Error(`Adobe API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get Adobe user profile:', error);
      throw error;
    }
  }

  // 8-1-3. Creative Cloud Libraries 연동
  async getCreativeCloudLibraries(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/libraries`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': process.env.ADOBE_CLIENT_ID!
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch libraries: ${response.status}`);
      }

      const data = await response.json();
      logger.debug(`Found ${data.libraries?.length || 0} Creative Cloud libraries`);
      
      return data.libraries || [];
    } catch (error) {
      logger.error('Failed to get Creative Cloud libraries:', error);
      return [];
    }
  }

  async getLibraryElements(accessToken: string, libraryId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/libraries/${libraryId}/elements`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': process.env.ADOBE_CLIENT_ID!
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch library elements: ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      logger.error('Failed to get library elements:', error);
      return [];
    }
  }

  // 라이브러리에 에셋 추가
  async addElementToLibrary(
    accessToken: string, 
    libraryId: string, 
    element: {
      name: string;
      type: string;
      content: Buffer | string;
      mimeType: string;
    }
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('name', element.name);
      formData.append('type', element.type);
      
      if (Buffer.isBuffer(element.content)) {
        formData.append('content', new Blob([element.content]), element.name);
      } else {
        formData.append('content', element.content);
      }

      const response = await fetch(`${this.baseUrl}/v1/libraries/${libraryId}/elements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': process.env.ADOBE_CLIENT_ID!
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to add element to library: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to add element to library:', error);
      throw error;
    }
  }

  // 8-1-4. Adobe Stock 통합
  async searchStockAssets(
    query: string, 
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      orientation?: 'horizontal' | 'vertical' | 'square';
      assetType?: 'photo' | 'video' | 'audio' | 'template';
    } = {}
  ): Promise<{ assets: AdobeStockAsset[]; totalCount: number }> {
    try {
      const params = new URLSearchParams({
        search_parameters: JSON.stringify({
          words: query,
          limit: options.limit?.toString() || '20',
          offset: options.offset?.toString() || '0',
          ...(options.category && { category: options.category }),
          ...(options.orientation && { orientation: options.orientation }),
          ...(options.assetType && { asset_type: options.assetType })
        })
      });

      const response = await fetch(`${this.stockBaseUrl}/Rest/Media/1/Search/Files?${params}`, {
        headers: {
          'X-Product': 'Ovistra/1.0',
          'X-API-Key': process.env.ADOBE_STOCK_API_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`Adobe Stock API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assets: AdobeStockAsset[] = (data.files || []).map((file: any) => ({
        id: file.id,
        title: file.title,
        type: this.mapStockAssetType(file.media_type_id),
        previewUrl: file.thumbnail_url,
        downloadUrl: file.comp_url,
        license: 'standard', // Default license
        keywords: file.keywords || []
      }));

      logger.debug(`Found ${assets.length} Adobe Stock assets for query: ${query}`);

      return {
        assets,
        totalCount: data.nb_results || 0
      };
    } catch (error) {
      logger.error('Adobe Stock search failed:', error);
      return { assets: [], totalCount: 0 };
    }
  }

  // Stock 에셋 다운로드
  async downloadStockAsset(
    accessToken: string, 
    assetId: string, 
    license: 'comp' | 'standard' | 'extended' = 'comp'
  ): Promise<Buffer> {
    try {
      // 라이선스 정보 조회
      const licenseResponse = await fetch(`${this.stockBaseUrl}/Rest/Libraries/1/Content/License?content_id=${assetId}&license=${license}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Product': 'Ovistra/1.0',
          'X-API-Key': process.env.ADOBE_STOCK_API_KEY!
        }
      });

      if (!licenseResponse.ok) {
        throw new Error(`License request failed: ${licenseResponse.status}`);
      }

      const licenseData = await licenseResponse.json();
      const downloadUrl = licenseData.contents?.[assetId]?.content_url;

      if (!downloadUrl) {
        throw new Error('No download URL provided');
      }

      // 파일 다운로드
      const downloadResponse = await fetch(downloadUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }

      const buffer = Buffer.from(await downloadResponse.arrayBuffer());
      logger.info(`Downloaded Adobe Stock asset ${assetId}, size: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      logger.error('Adobe Stock download failed:', error);
      throw error;
    }
  }

  // 8-1-5. After Effects 연동
  async getAfterEffectsProjects(accessToken: string): Promise<CreativeCloudProject[]> {
    try {
      // Mock 구현 - 실제로는 After Effects API 호출
      const projects: CreativeCloudProject[] = [
        {
          id: 'ae_001',
          name: 'Motion Graphics Template',
          type: 'after_effects',
          lastModified: new Date(),
          thumbnailUrl: 'https://example.com/ae_thumb.jpg',
          metadata: {
            duration: 30,
            fps: 30,
            resolution: '1920x1080'
          }
        }
      ];

      logger.debug(`Found ${projects.length} After Effects projects`);
      return projects;
    } catch (error) {
      logger.error('Failed to get After Effects projects:', error);
      return [];
    }
  }

  async exportAfterEffectsTemplate(
    accessToken: string, 
    projectId: string, 
    options: {
      format: 'mogrt' | 'aep';
      quality: 'high' | 'medium' | 'low';
    }
  ): Promise<{ exportId: string; status: 'pending' | 'processing' | 'completed' | 'failed' }> {
    try {
      // Mock 구현 - 실제로는 After Effects 렌더링 API 호출
      const exportId = `export_${Date.now()}`;
      
      logger.info(`Started After Effects export: ${exportId}`);
      
      return {
        exportId,
        status: 'pending'
      };
    } catch (error) {
      logger.error('After Effects export failed:', error);
      throw error;
    }
  }

  // Premiere Pro 연동 (CEP에서 이미 구현됨)
  async getPremiereProjects(): Promise<CreativeCloudProject[]> {
    // CEP 환경에서는 ExtendScript로 직접 접근
    // 백엔드에서는 Creative Cloud API 사용
    try {
      const projects: CreativeCloudProject[] = [
        {
          id: 'pp_001',
          name: 'Main Project',
          type: 'premiere',
          lastModified: new Date(),
          metadata: {
            sequences: 3,
            duration: 1800, // 30분
            resolution: '1920x1080'
          }
        }
      ];

      return projects;
    } catch (error) {
      logger.error('Failed to get Premiere Pro projects:', error);
      return [];
    }
  }

  // Helper 메서드들
  private mapStockAssetType(mediaTypeId: number): AdobeStockAsset['type'] {
    switch (mediaTypeId) {
      case 1: return 'image';
      case 2: return 'video';
      case 3: return 'audio';
      case 4: return 'template';
      default: return 'image';
    }
  }

  // 연결 상태 확인
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 에셋 동기화
  async syncAssetsToLibrary(
    accessToken: string,
    libraryId: string,
    assets: Array<{
      name: string;
      type: string;
      localPath: string;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const asset of assets) {
      try {
        // 파일 읽기 및 업로드 (실제 구현에서는 파일 시스템 접근)
        const mockContent = Buffer.from('mock file content');
        
        await this.addElementToLibrary(accessToken, libraryId, {
          name: asset.name,
          type: asset.type,
          content: mockContent,
          mimeType: 'application/octet-stream'
        });

        success++;
        logger.debug(`Successfully synced asset: ${asset.name}`);
      } catch (error) {
        failed++;
        const errorMsg = `Failed to sync ${asset.name}: ${error}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.info(`Asset sync completed: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }
}

// 싱글톤 인스턴스
export const adobeIntegrationService = new AdobeIntegrationService();