import { Controller, Get, Post, Delete, Param, UseGuards, Request, Sse, MessageEvent, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  Notification,
  NotificationPriority,
  NotificationType
} from '@prisma/client';
import { NotificationQueueService } from './notification-queue.service';
import { Observable, Subject } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
@Controller('notifications')
export class NotificationController {
  
  constructor(private readonly notificationService: NotificationService, private queueService : NotificationQueueService) {}

  @ApiBearerAuth('JWT-auth')
  @Post('test-notification')
  @ApiOperation({ summary: 'Trigger test notification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', nullable: true }
      }
    }
  })

  @ApiResponse({ 
    status: 201, 
    description: 'Test notification queued successfully' 
  })
  async testNotification(@Body() data: { userId?: number }) {
    await this.queueService.enqueueNotification({
      title: 'Test Notification',
      message: 'This is a system test',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      userId: data.userId
    });
    return { status: 'Notification queued' };
  }

  @ApiBearerAuth('JWT-auth')
  @Sse('sse')
  @ApiOperation({ summary: 'SSE stream for current user notifications' })
  sse(@Request() req): Observable<MessageEvent> {
    return this.notificationService.getUserStream(req.user.sub).asObservable();
  }

  @Sse('sse/:userId')
  @ApiOperation({ summary: 'SSE stream for specific user (admin only)' })
  @ApiExcludeEndpoint() // Remove if you want to show in Swagger
  userSse(@Param('userId') userId: number): Observable<MessageEvent> {
    return this.notificationService.getUserStream(userId).asObservable();
  }
  // REST endpoints remain the same...
  @Get()
  async findAll(@Request() req): Promise<Notification[]> {
    return this.notificationService.findAll(req.user.sub);
  }

  @Get('unread')
  async findUnread(@Request() req): Promise<Notification[]> {
    return this.notificationService.findUnread(req.user.sub);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req): Promise<Notification> {
    return this.notificationService.markAsRead(id, req.user.sub);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req): Promise<void> {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    return this.notificationService.delete(id, req.user.sub);
  }
}