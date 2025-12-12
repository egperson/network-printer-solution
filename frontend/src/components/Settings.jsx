import React, { useState, useEffect } from 'react'
import CustomCard from './CustomCard'
import CustomSelect from './CustomSelect'
import CustomButton from './CustomButton'
import CustomInput from './CustomInput'

export default function Settings() {
  const [settings, setSettings] = useState({
    autoRefresh: 30,
    alertThreshold: 20,
    theme: 'dark',
    notifications: true,
    soundAlerts: false,
    emailNotifications: false,
    email: '',
    // New Settings
    snmpCommunity: 'public',
    snmpTimeout: 2000,
    snmpRetries: 3,
    scanInterval: 15,
    webhookUrl: '',
    adminPassword: '',
    allowedIps: '',
    maintenanceMode: false,
    ipMaps: []
  })

  // Load backend config on mount
  useEffect(() => {
    async function loadConfig() {
      // 1. Load LocalStorage (UI prefs)
      try {
        const local = JSON.parse(localStorage.getItem('monitor.settings') || '{}')
        // 2. Load Backend Config (Network/Scan)
        const res = await fetch('/api/printers')
        const json = await res.json()

        let backendMaps = []
        if (json.ok && json.printers && json.printers.scan && Array.isArray(json.printers.scan.prefixes)) {
          backendMaps = json.printers.scan.prefixes.map(p => ({
            prefix: typeof p === 'string' ? p : p.prefix,
            location: typeof p === 'string' ? '' : p.label
          }))
        }

        setSettings(prev => ({
          ...prev,
          ...local,
          ipMaps: backendMaps.length > 0 ? backendMaps : (local.ipMaps || [])
        }))
      } catch (e) {
        console.error('Failed to load config', e)
        // Fallback to local
        const local = JSON.parse(localStorage.getItem('monitor.settings') || '{}')
        setSettings(prev => ({ ...prev, ...local }))
      }
    }
    loadConfig()
  }, [])

  // Local state for adding new mapping
  const [newMap, setNewMap] = useState({ prefix: '', location: '' })

  async function handleSave() {
    // 1. Save UI prefs to LocalStorage
    localStorage.setItem('monitor.settings', JSON.stringify(settings))

    // 2. Save Network/Scan config to Backend
    try {
      // First get current backend config to avoid overwriting other fields (like static printers)
      const resVal = await fetch('/api/printers')
      const jsonVal = await resVal.json()
      const currentConfig = (jsonVal.ok && jsonVal.printers) ? jsonVal.printers : {}

      const newConfig = {
        ...currentConfig,
        scan: {
          ...(currentConfig.scan || {}),
          enabled: true,
          prefixes: settings.ipMaps.map(m => ({ prefix: m.prefix, label: m.location }))
        }
      }

      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (res.ok) {
        alert('Configurações salvas com sucesso!')
      } else {
        throw new Error('Falha ao salvar no backend')
      }
    } catch (e) {
      alert('Configurações salvas localmente, mas erro ao sincronizar com servidor: ' + e.message)
    }
  }

  function handleReset() {
    if (!confirm('Resetar todas as configurações para o padrão?')) return
    const defaults = {
      autoRefresh: 30,
      alertThreshold: 20,
      theme: 'dark',
      notifications: true,
      soundAlerts: false,
      emailNotifications: false,
      email: '',
      snmpCommunity: 'public',
      snmpTimeout: 2000,
      snmpRetries: 3,
      scanInterval: 15,
      webhookUrl: '',
      adminPassword: '',
      allowedIps: '',
      maintenanceMode: false,
      ipMaps: [
        { prefix: '192.168.1.', location: 'Matriz - 1º Andar' },
        { prefix: '10.0.0.', location: 'Filial SP' }
      ]
    }
    setSettings(defaults)
    localStorage.setItem('monitor.settings', JSON.stringify(defaults))
  }

  function addMap() {
    if (!newMap.prefix || !newMap.location) return alert('Preencha prefixo e local')
    setSettings({ ...settings, ipMaps: [...settings.ipMaps, { ...newMap }] })
    setNewMap({ prefix: '', location: '' })
  }

  function removeMap(idx) {
    const newMaps = [...settings.ipMaps]
    newMaps.splice(idx, 1)
    setSettings({ ...settings, ipMaps: newMaps })
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-white/60">Gerencie o comportamento do sistema</p>
        </div>
        <div className="flex gap-2">
          <CustomButton variant="secondary" icon="restore" onClick={handleReset}>
            Restaurar Padrão
          </CustomButton>
          <CustomButton icon="save" onClick={handleSave}>
            Salvar Alterações
          </CustomButton>
        </div>
      </div>

      {/* Grid Layout for Settings Groups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Column 1: General & Appearance & Notifications & IP Mapping */}
        <div className="space-y-6">
          <CustomCard title="Geral & Aparência" icon="tune">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect
                  label="Tema"
                  value={settings.theme}
                  onChange={(theme) => setSettings({ ...settings, theme })}
                  icon="brightness_6"
                  options={[
                    { value: 'dark', label: 'Escuro', icon: 'dark_mode' },
                    { value: 'light', label: 'Claro', icon: 'light_mode' },
                    { value: 'auto', label: 'Automático', icon: 'brightness_auto' }
                  ]}
                />
                <CustomInput
                  label="Auto-Refresh (segundos)"
                  type="number"
                  value={settings.autoRefresh}
                  onChange={(e) => setSettings({ ...settings, autoRefresh: parseInt(e.target.value) || 30 })}
                  icon="refresh"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                <div>
                  <div className="font-medium">Modo Manutenção</div>
                  <div className="text-sm text-white/60">Pausar alertas e notificações</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Notificações" icon="notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                <div>
                  <div className="font-medium">Notificações na Tela</div>
                  <div className="text-sm text-white/60">Popups de alerta no sistema</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                <div>
                  <div className="font-medium">Alertas Sonoros</div>
                  <div className="text-sm text-white/60">Reproduzir som em erros</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundAlerts}
                    onChange={(e) => setSettings({ ...settings, soundAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="p-3 bg-white/5 rounded border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">E-mail de Alertas</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
                {settings.emailNotifications && (
                  <CustomInput
                    label="Endereço de E-mail"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    icon="email"
                    placeholder="admin@empresa.com"
                  />
                )}
                <div className="mt-3">
                  <CustomInput
                    label="Limite de Alerta (%)"
                    type="number"
                    value={settings.alertThreshold}
                    onChange={(e) => setSettings({ ...settings, alertThreshold: parseInt(e.target.value) || 20 })}
                    icon="warning"
                    hint="Disparar alerta quando suprimento estiver abaixo deste valor"
                  />
                </div>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Mapeamento de Locais" icon="map" variant="default">
            <div className="text-sm text-white/60 mb-4">
              Defina prefixos de IP para atribuir automaticamente locais e restringir o escopo de busca.
            </div>

            {/* List */}
            <div className="space-y-2 mb-4">
              {settings.ipMaps.map((map, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5">
                  <div className="flex-1 font-mono text-sm">{map.prefix}</div>
                  <div className="flex-[2] text-sm text-cyan-300">{map.location}</div>
                  <button onClick={() => removeMap(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <span className="mi">delete</span>
                  </button>
                </div>
              ))}
              {settings.ipMaps.length === 0 && <div className="text-center text-white/40 italic py-2">Nenhum mapeamento definido.</div>}
            </div>

            {/* Add New */}
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <CustomInput
                  label="Prefixo IP"
                  value={newMap.prefix}
                  onChange={e => setNewMap({ ...newMap, prefix: e.target.value })}
                  placeholder="Ex: 192.168.10."
                />
              </div>
              <div className="flex-[2] w-full">
                <CustomInput
                  label="Local"
                  value={newMap.location}
                  onChange={e => setNewMap({ ...newMap, location: e.target.value })}
                  placeholder="Ex: Sala de Reunião"
                />
              </div>
              <div className="mb-0.5">
                <CustomButton icon="add" onClick={addMap} size="small" />
              </div>
            </div>
          </CustomCard>
        </div>

        {/* Column 2: Network, Integration, Security, Data */}
        <div className="space-y-6">
          <CustomCard title="Rede & Monitoramento" icon="router">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                label="SNMP Community"
                value={settings.snmpCommunity}
                onChange={(e) => setSettings({ ...settings, snmpCommunity: e.target.value })}
                icon="key"
                type="password"
              />
              <CustomInput
                label="Intervalo de Scan (min)"
                type="number"
                value={settings.scanInterval}
                onChange={(e) => setSettings({ ...settings, scanInterval: parseInt(e.target.value) || 15 })}
                icon="timer"
              />
              <CustomInput
                label="Timeout (ms)"
                type="number"
                value={settings.snmpTimeout}
                onChange={(e) => setSettings({ ...settings, snmpTimeout: parseInt(e.target.value) || 2000 })}
                icon="hourglass_empty"
              />
              <CustomInput
                label="Retentativas"
                type="number"
                value={settings.snmpRetries}
                onChange={(e) => setSettings({ ...settings, snmpRetries: parseInt(e.target.value) || 3 })}
                icon="replay"
              />
            </div>
          </CustomCard>

          <CustomCard title="Integrações" icon="hub">
            <div className="space-y-4">
              <CustomInput
                label="Webhook URL (Slack/Teams/Discord)"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                icon="link"
                placeholder="https://hooks.slack.com/services/..."
              />
              <div className="text-xs text-white/40">
                Envia cargas JSON POST para este endpoint quando alertas críticos ocorrem.
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Segurança & Acesso" icon="security">
            <div className="space-y-4">
              <CustomInput
                label="Alterar Senha de Admin"
                type="password"
                value={settings.adminPassword}
                onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                icon="lock"
                placeholder="Nova senha..."
              />
              <CustomInput
                label="Whitelist de IPs (Separado por vírgula)"
                value={settings.allowedIps}
                onChange={(e) => setSettings({ ...settings, allowedIps: e.target.value })}
                icon="lan"
                placeholder="192.168.1.0/24, 10.0.0.5"
                hint="Deixe vazio para permitir todos"
              />
            </div>
          </CustomCard>

          <CustomCard title="Gerenciamento de Dados" icon="storage" variant="warning">
            <p className="text-sm text-white/60 mb-4">Ações irreversíveis que afetam os dados do sistema.</p>
            <div className="flex flex-wrap gap-3">
              <CustomButton variant="secondary" icon="download" onClick={() => alert('Backup iniciado... (Simulação)')}>
                Backup
              </CustomButton>
              <CustomButton variant="secondary" icon="upload" onClick={() => prompt('Cole o JSON de backup aqui:') && alert('Restauração simulada com sucesso.')}>
                Restaurar
              </CustomButton>
              <CustomButton variant="danger" icon="delete_forever" onClick={() => confirm('Tem certeza? Isso apagará todo o histórico.') && alert('Dados limpos.')}>
                Limpar Tudo
              </CustomButton>
            </div>
          </CustomCard>
        </div>

      </div>
    </div>
  )
}
