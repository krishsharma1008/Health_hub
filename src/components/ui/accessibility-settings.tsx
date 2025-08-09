import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Switch } from './switch'
import { Label } from './label'
import { Slider } from './slider'
import { Badge } from './badge'
import { 
  Eye, 
  Contrast, 
  Type, 
  Volume2, 
  MousePointer,
  Keyboard,
  Settings
} from 'lucide-react'

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  fontSize: number
  soundEnabled: boolean
  keyboardNavigation: boolean
}

export function AccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings')
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      fontSize: 100,
      soundEnabled: true,
      keyboardNavigation: true
    }
  })

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
    applySettings(settings)
  }, [settings])

  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast')
    } else {
      root.classList.remove('accessibility-high-contrast')
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('accessibility-large-text')
    } else {
      root.classList.remove('accessibility-large-text')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('accessibility-reduced-motion')
    } else {
      root.classList.remove('accessibility-reduced-motion')
    }

    // Font size
    root.style.fontSize = `${settings.fontSize}%`

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('accessibility-keyboard-nav')
    } else {
      root.classList.remove('accessibility-keyboard-nav')
    }
  }

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    const defaults: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      fontSize: 100,
      soundEnabled: true,
      keyboardNavigation: true
    }
    setSettings(defaults)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Accessibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Contrast className="w-4 h-4" />
            Visual
          </h3>
          
          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Increases contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="large-text">Large Text</Label>
                <p className="text-sm text-muted-foreground">
                  Increases text size throughout the app
                </p>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
              />
            </div>

            <div className="space-y-3">
              <Label>Font Size: {settings.fontSize}%</Label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={75}
                max={150}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>75%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Motion Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MousePointer className="w-4 h-4" />
            Motion & Interaction
          </h3>
          
          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">
                  Minimizes animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                <p className="text-sm text-muted-foreground">
                  Improved focus indicators and keyboard shortcuts
                </p>
              </div>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
              />
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio
          </h3>
          
          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sound-enabled">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Enables audio feedback for interactions
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setSettings({
                ...settings,
                highContrast: true,
                largeText: true,
                fontSize: 120,
                reducedMotion: true
              })}
              className="h-auto p-4 text-left justify-start"
            >
              <div>
                <div className="font-medium">Low Vision</div>
                <div className="text-sm text-muted-foreground">
                  High contrast, large text, reduced motion
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setSettings({
                ...settings,
                keyboardNavigation: true,
                reducedMotion: true,
                soundEnabled: true
              })}
              className="h-auto p-4 text-left justify-start"
            >
              <div>
                <div className="font-medium">Motor Accessibility</div>
                <div className="text-sm text-muted-foreground">
                  Keyboard navigation, reduced motion
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Badge variant="secondary" className="self-center">
            Settings saved automatically
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
