import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Audit logger for sensitive operations
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '90d', // Keep audit logs for 90 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
})

interface AuditLogData {
  action: string
  userId?: string
  userRole?: string
  resourceType: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
}

export const logAuditEvent = (data: AuditLogData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
    // Remove sensitive data
    details: data.details ? sanitizeData(data.details) : undefined
  }
  
  auditLogger.info('AUDIT_EVENT', logEntry)
}

// Sanitize sensitive data from logs
const sanitizeData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key])
    }
  }
  
  return sanitized
}

export default auditLogger