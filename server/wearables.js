import { EventEmitter } from 'events'

export class WearablesIntegration extends EventEmitter {
  constructor() {
    super()
    this.devices = new Map()
    this.dataStreams = new Map()
    this.models = new Map()
    this.anomalyThresholds = {
      heartRate: { min: 40, max: 200, restingMax: 100 },
      steps: { dailyMin: 1000, dailyTarget: 10000 },
      sleep: { minHours: 4, optimalHours: 8 },
      hrv: { min: 10, optimal: 50 },
      bodyTemp: { min: 96.0, max: 100.4 }
    }
  }

  // Device registration and management
  async registerDevice(deviceInfo) {
    const device = {
      id: deviceInfo.id,
      type: deviceInfo.type, // 'apple_watch', 'oura_ring', 'fitbit', etc.
      name: deviceInfo.name,
      userId: deviceInfo.userId,
      status: 'connected',
      lastSync: Date.now(),
      batteryLevel: deviceInfo.batteryLevel || 100,
      capabilities: deviceInfo.capabilities || [],
      settings: deviceInfo.settings || {}
    }
    
    this.devices.set(device.id, device)
    this.emit('device_registered', device)
    
    return device
  }

  // Simulated data streams for demo (replace with real integrations)
  startDataStream(deviceId) {
    if (this.dataStreams.has(deviceId)) {
      return // Already streaming
    }
    
    const device = this.devices.get(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }
    
    const stream = {
      deviceId,
      isActive: true,
      lastUpdate: Date.now(),
      data: {
        heartRate: [],
        steps: 0,
        calories: 0,
        distance: 0,
        sleep: null,
        hrv: [],
        bodyTemp: [],
        oxygenSaturation: [],
        stress: []
      }
    }
    
    // Simulate real-time data generation
    const interval = setInterval(() => {
      if (!stream.isActive) {
        clearInterval(interval)
        return
      }
      
      this.generateSimulatedData(stream)
      this.emit('data_update', { deviceId, data: stream.data })
      
      // Check for anomalies
      this.checkAnomalies(deviceId, stream.data)
      
    }, 30000) // Update every 30 seconds
    
    stream.interval = interval
    this.dataStreams.set(deviceId, stream)
    
    return stream
  }

  generateSimulatedData(stream) {
    const now = Date.now()
    const timeOfDay = new Date().getHours()
    
    // Heart rate (varies by time of day and activity)
    const baseHR = timeOfDay < 6 || timeOfDay > 22 ? 60 : 75
    const heartRate = baseHR + Math.random() * 40 - 20
    stream.data.heartRate.push({
      value: Math.max(40, Math.min(200, Math.round(heartRate))),
      timestamp: now
    })
    
    // Keep only last 100 readings
    if (stream.data.heartRate.length > 100) {
      stream.data.heartRate = stream.data.heartRate.slice(-100)
    }
    
    // Steps (cumulative daily)
    const stepIncrement = Math.round(Math.random() * 100)
    stream.data.steps += stepIncrement
    
    // Calories (estimate based on steps and heart rate)
    stream.data.calories += Math.round(stepIncrement * 0.04 + heartRate * 0.1)
    
    // Distance (estimate based on steps)
    stream.data.distance += stepIncrement * 0.0008 // km
    
    // HRV (Heart Rate Variability)
    const hrv = 30 + Math.random() * 40
    stream.data.hrv.push({
      value: Math.round(hrv),
      timestamp: now
    })
    
    if (stream.data.hrv.length > 50) {
      stream.data.hrv = stream.data.hrv.slice(-50)
    }
    
    // Body temperature
    const bodyTemp = 98.6 + (Math.random() - 0.5) * 2
    stream.data.bodyTemp.push({
      value: Math.round(bodyTemp * 10) / 10,
      timestamp: now
    })
    
    if (stream.data.bodyTemp.length > 50) {
      stream.data.bodyTemp = stream.data.bodyTemp.slice(-50)
    }
    
    // Oxygen saturation
    const spo2 = 95 + Math.random() * 5
    stream.data.oxygenSaturation.push({
      value: Math.round(spo2),
      timestamp: now
    })
    
    if (stream.data.oxygenSaturation.length > 50) {
      stream.data.oxygenSaturation = stream.data.oxygenSaturation.slice(-50)
    }
    
    // Stress level (0-100)
    const stressBase = timeOfDay > 8 && timeOfDay < 18 ? 40 : 20
    const stress = Math.max(0, Math.min(100, stressBase + Math.random() * 30 - 15))
    stream.data.stress.push({
      value: Math.round(stress),
      timestamp: now
    })
    
    if (stream.data.stress.length > 50) {
      stream.data.stress = stream.data.stress.slice(-50)
    }
    
    stream.lastUpdate = now
  }

  checkAnomalies(deviceId, data) {
    const anomalies = []
    
    // Heart rate anomalies
    if (data.heartRate.length > 0) {
      const latestHR = data.heartRate[data.heartRate.length - 1].value
      if (latestHR < this.anomalyThresholds.heartRate.min || 
          latestHR > this.anomalyThresholds.heartRate.max) {
        anomalies.push({
          type: 'heart_rate_extreme',
          value: latestHR,
          severity: latestHR < 40 || latestHR > 180 ? 'high' : 'medium',
          message: `Heart rate ${latestHR} is outside normal range`
        })
      }
    }
    
    // Body temperature anomalies
    if (data.bodyTemp.length > 0) {
      const latestTemp = data.bodyTemp[data.bodyTemp.length - 1].value
      if (latestTemp < this.anomalyThresholds.bodyTemp.min || 
          latestTemp > this.anomalyThresholds.bodyTemp.max) {
        anomalies.push({
          type: 'body_temperature_abnormal',
          value: latestTemp,
          severity: latestTemp > 101 || latestTemp < 95 ? 'high' : 'medium',
          message: `Body temperature ${latestTemp}°F is abnormal`
        })
      }
    }
    
    // Oxygen saturation anomalies
    if (data.oxygenSaturation.length > 0) {
      const latestSpo2 = data.oxygenSaturation[data.oxygenSaturation.length - 1].value
      if (latestSpo2 < 95) {
        anomalies.push({
          type: 'low_oxygen_saturation',
          value: latestSpo2,
          severity: latestSpo2 < 90 ? 'high' : 'medium',
          message: `Oxygen saturation ${latestSpo2}% is below normal`
        })
      }
    }
    
    if (anomalies.length > 0) {
      this.emit('anomalies_detected', { deviceId, anomalies })
    }
  }

  // Predictive analytics (lightweight heuristics)
  async generatePredictions(deviceId, days = 7) {
    const stream = this.dataStreams.get(deviceId)
    if (!stream) {
      throw new Error('No data stream found for device')
    }
    
    const predictions = {
      heartRatePattern: await this.predictHeartRatePattern(stream.data.heartRate),
      stepGoalAchievement: await this.predictStepGoals(stream.data.steps),
      sleepQuality: await this.predictSleepQuality(stream.data),
      riskFactors: await this.assessRiskFactors(stream.data)
    }
    
    return predictions
  }

  async predictHeartRatePattern(heartRateData) {
    if (heartRateData.length < 24) {
      return { error: 'Insufficient data for prediction' }
    }
    
    // Simple moving average prediction
    const recent = heartRateData.slice(-24).map(d => d.value)
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const trend = recent[recent.length - 1] - recent[0]
    
    return {
      averageNext24h: Math.round(avg),
      trend: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
      confidence: 0.75,
      recommendation: avg > 100 ? 'Consider stress management techniques' : 'Heart rate pattern looks normal'
    }
  }

  async predictStepGoals(currentSteps) {
    const hoursLeft = 24 - new Date().getHours()
    const currentRate = currentSteps / (24 - hoursLeft)
    const projectedSteps = Math.round(currentSteps + (currentRate * hoursLeft))
    
    return {
      projectedDailySteps: projectedSteps,
      goalAchievementProbability: Math.min(1, projectedSteps / 10000),
      recommendation: projectedSteps < 8000 ? 'Consider a 30-minute walk to reach your goal' : 'Great progress on your step goal!'
    }
  }

  async predictSleepQuality(data) {
    // Analyze stress and heart rate variability for sleep quality prediction
    const recentStress = data.stress.slice(-10).map(d => d.value)
    const recentHRV = data.hrv.slice(-10).map(d => d.value)
    
    if (recentStress.length === 0 || recentHRV.length === 0) {
      return { error: 'Insufficient data for sleep prediction' }
    }
    
    const avgStress = recentStress.reduce((sum, val) => sum + val, 0) / recentStress.length
    const avgHRV = recentHRV.reduce((sum, val) => sum + val, 0) / recentHRV.length
    
    // Simple heuristic for sleep quality prediction
    let sleepQuality = 'good'
    if (avgStress > 60 || avgHRV < 25) sleepQuality = 'poor'
    else if (avgStress > 40 || avgHRV < 35) sleepQuality = 'fair'
    
    return {
      predictedSleepQuality: sleepQuality,
      factors: {
        stress: avgStress > 50 ? 'elevated' : 'normal',
        hrv: avgHRV < 30 ? 'low' : 'normal'
      },
      recommendations: sleepQuality === 'poor' ? 
        ['Practice relaxation techniques', 'Avoid screens 1 hour before bed'] :
        ['Maintain consistent sleep schedule']
    }
  }

  async assessRiskFactors(data) {
    const risks = []
    
    // Heart rate variability risk
    const recentHRV = data.hrv.slice(-20)
    if (recentHRV.length > 0) {
      const avgHRV = recentHRV.reduce((sum, d) => sum + d.value, 0) / recentHRV.length
      if (avgHRV < 20) {
        risks.push({
          factor: 'low_hrv',
          risk: 'moderate',
          description: 'Low heart rate variability may indicate stress or cardiovascular risk',
          probability: 0.3,
          timeframe: '6 months'
        })
      }
    }
    
    // Chronic stress risk
    const recentStress = data.stress.slice(-50)
    if (recentStress.length > 0) {
      const highStressCount = recentStress.filter(d => d.value > 70).length
      if (highStressCount > recentStress.length * 0.3) {
        risks.push({
          factor: 'chronic_stress',
          risk: 'moderate',
          description: 'Persistent high stress levels detected',
          probability: 0.4,
          timeframe: '3 months'
        })
      }
    }
    
    return risks
  }

  // Apple Health integration stubs
  async connectAppleHealth(userId, authToken) {
    // In a real implementation, this would use HealthKit APIs
    const device = await this.registerDevice({
      id: `apple_health_${userId}`,
      type: 'apple_health',
      name: 'iPhone Health App',
      userId,
      capabilities: ['steps', 'heart_rate', 'sleep', 'workouts']
    })
    
    return device
  }

  // Oura Ring integration stubs
  async connectOuraRing(userId, accessToken) {
    // In a real implementation, this would use Oura API
    const device = await this.registerDevice({
      id: `oura_${userId}`,
      type: 'oura_ring',
      name: 'Oura Ring',
      userId,
      capabilities: ['sleep', 'hrv', 'body_temp', 'activity']
    })
    
    return device
  }

  getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId)
    const stream = this.dataStreams.get(deviceId)
    
    if (!device) return null
    
    return {
      ...device,
      isStreaming: stream?.isActive || false,
      lastDataUpdate: stream?.lastUpdate || null,
      dataPoints: stream ? {
        heartRate: stream.data.heartRate.length,
        steps: stream.data.steps,
        lastSync: stream.lastUpdate
      } : null
    }
  }

  getAllDevices(userId) {
    return Array.from(this.devices.values())
      .filter(device => device.userId === userId)
  }

  stopDataStream(deviceId) {
    const stream = this.dataStreams.get(deviceId)
    if (stream) {
      stream.isActive = false
      if (stream.interval) {
        clearInterval(stream.interval)
      }
      this.dataStreams.delete(deviceId)
    }
  }
}

export default WearablesIntegration
