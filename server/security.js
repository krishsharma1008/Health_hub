import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto-js'
import winston from 'winston'
import rateLimit from 'express-rate-limit'

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.SHA256('default-key').toString()

// PHI (Protected Health Information) patterns
const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
  /\b\d{10}\b/, // Phone number (simple)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // Date of birth
  /MRN\s*:?\s*\d+/i, // Medical record number
  /Patient\s+ID\s*:?\s*\d+/i // Patient ID
]

export class SecurityManager {
  constructor() {
    this.auditLog = []
  }

  // Rate limiting middleware
  static createRateLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      windowMs,
      max,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    })
  }

  // PHI redaction
  static redactPHI(text) {
    let redacted = text
    
    PHI_PATTERNS.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]')
    })
    
    return redacted
  }

  // Data encryption
  static encrypt(text) {
    return crypto.AES.encrypt(text, ENCRYPTION_KEY).toString()
  }

  static decrypt(encryptedText) {
    const bytes = crypto.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    return bytes.toString(crypto.enc.Utf8)
  }

  // Password hashing
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12)
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  // JWT token management
  static generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn })
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  // Authentication middleware
  static authenticate(req, res, next) {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' })
    }
    
    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = SecurityManager.verifyToken(token)
      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }

  // Role-based access control
  static authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' })
      }
      
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      
      next()
    }
  }

  // Audit logging
  logAuditEvent(event) {
    const auditEntry = {
      id: crypto.lib.WordArray.random(128/8).toString(),
      timestamp: new Date().toISOString(),
      ...event
    }
    
    this.auditLog.push(auditEntry)
    logger.info('Audit Event', auditEntry)
    
    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }
    
    return auditEntry
  }

  // Input validation
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Data anonymization for analytics
  static anonymizeHealthData(data) {
    const anonymized = { ...data }
    
    // Remove direct identifiers
    delete anonymized.name
    delete anonymized.email
    delete anonymized.phone
    delete anonymized.address
    delete anonymized.ssn
    delete anonymized.mrn
    
    // Generalize age to ranges
    if (anonymized.age) {
      const ageRanges = [[0, 18], [19, 30], [31, 45], [46, 60], [61, 75], [76, 100]]
      const range = ageRanges.find(([min, max]) => anonymized.age >= min && anonymized.age <= max)
      anonymized.ageRange = range ? `${range[0]}-${range[1]}` : 'unknown'
      delete anonymized.age
    }
    
    // Generalize location to state/region only
    if (anonymized.location) {
      anonymized.region = anonymized.location.state || anonymized.location.region
      delete anonymized.location
    }
    
    return anonymized
  }

  // Security headers middleware
  static securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
    next()
  }

  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit)
  }
}

export default SecurityManager
