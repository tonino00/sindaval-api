import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin')
export class AdminController {
  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Health check admin' })
  healthCheck() {
    return {
      status: 'ok',
      message: 'Admin panel is running',
    };
  }
}
