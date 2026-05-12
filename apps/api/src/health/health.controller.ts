import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return {
      ok: true,
      service: 'live-every-day-api',
    };
  }
}
