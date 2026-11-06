import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Clock, Calendar, AlertCircle, Settings, ExternalLink } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { notificationsApi } from '../api/notifications.api';
import { getErrorMessage } from '../api/errors';
import { NotificationSettingsData } from '../types/domain';
import Card from './ui/Card';

interface NotificationSettingsProps {
  className?: string;
}

type ReminderSettings = NotificationSettingsData;

const DEFAULT_SETTINGS: ReminderSettings = {
  dailyReminder: false,
  dailyTime: '20:00',
  weeklyReminder: false,
  weeklyDay: 1, // lunes
  transactionReminder: true,
  monthlyReport: true,
};

// Reminders are sent at the user's local time
const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const { isSupported, permission, subscribe, unsubscribe, isSubscribed } = useNotifications();

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // The server is the source of truth for the settings
  useEffect(() => {
    notificationsApi
      .getSettings()
      .then((settings) => setReminderSettings({ ...DEFAULT_SETTINGS, ...settings }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  // Opens the browser's notification settings when permission was blocked
  const openBrowserSettings = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('edg')) window.open('edge://settings/content/notifications', '_blank');
    else if (userAgent.includes('chrome')) window.open('chrome://settings/content/notifications', '_blank');
    else if (userAgent.includes('firefox')) window.open('about:preferences#privacy', '_blank');
    else window.open('https://support.google.com/chrome/answer/3220246', '_blank');
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError(null);
    setSuccess(null);
    try {
      if (isSubscribed) {
        await unsubscribe();
        setSuccess('Notificaciones desactivadas correctamente');
      } else {
        await subscribe({ ...reminderSettings, timezone: browserTimezone() });
        setSuccess('Notificaciones activadas correctamente');
      }
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : 'No se pudieron gestionar las notificaciones');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSettingChange = async <K extends keyof ReminderSettings>(setting: K, value: ReminderSettings[K]) => {
    const previous = reminderSettings;
    setReminderSettings({ ...previous, [setting]: value });
    try {
      await notificationsApi.saveSettings({ [setting]: value, timezone: browserTimezone() });
    } catch (saveError) {
      // Reverts so the screen never shows a setting the server did not keep
      setReminderSettings(previous);
      setError(getErrorMessage(saveError, 'No se pudo guardar la configuración'));
    }
  };

  if (!isSupported) {
    return (
      <Card title="Notificaciones" className={className}>
        <div className="text-center py-8">
          <BellOff className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-base-content mb-2">
            Notificaciones no disponibles
          </h3>
          <p className="text-base-content/70 text-sm">
            Tu navegador no soporta notificaciones push
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Configuración de Notificaciones" className={className}>
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {/* Push Notifications */}
      <div className="mb-6 p-4 border border-base-300 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isSubscribed ? 'bg-success/20 text-success' :
              permission === 'denied' ? 'bg-warning/20 text-warning' :
              'bg-base-200 text-base-content/60'
            }`}>
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-base-content">
                Notificaciones Push
              </h4>
              <p className="text-sm text-base-content/70">
                Recibe recordatorios en tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
              isSubscribed
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-200'
                : permission === 'denied'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-200'
                : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
            }`}
            title={
              isSubscribed
                ? 'Desactivar notificaciones'
                : permission === 'denied'
                ? 'Notificaciones bloqueadas'
                : 'Activar notificaciones'
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-all shadow-md ${
                isSubscribed
                  ? 'bg-white translate-x-6 border-2 border-white drop-shadow-lg'
                  : 'bg-white translate-x-1 border-2 border-gray-100 drop-shadow-sm'
              }`}
            />
            {isSubscribing && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-2 w-2 bg-primary rounded-full animate-ping"></span>
              </span>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {permission === 'denied' && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-warning font-medium mb-2">
                  ⚠️ Notificaciones bloqueadas
                </p>
                <p className="text-xs text-warning/80 mb-3">
                  Las notificaciones fueron bloqueadas en tu navegador. Para activarlas:
                </p>
                <button
                  onClick={openBrowserSettings}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-warning/20 hover:bg-warning/30 text-warning rounded-md text-xs font-medium transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  <span>Abrir Configuración</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubscribed && !isSubscribing && (
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-success" />
              <p className="text-sm text-success font-medium">
                ✓ Notificaciones activadas correctamente
              </p>
            </div>
          </div>
        )}

        {!isSubscribed && permission === 'granted' && !isSubscribing && (
          <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-info" />
              <p className="text-sm text-info">
                Tienes permiso para notificaciones. Activa el interruptor para comenzar a recibirlas.
              </p>
            </div>
          </div>
        )}

        {permission === 'default' && !isSubscribing && (
          <div className="mt-4 p-3 bg-base-200/50 border border-base-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-base-content/60" />
              <p className="text-sm text-base-content/70">
                Activa el interruptor para solicitar permiso de notificaciones.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-base-content mb-3">
          Recordatorios Automáticos
        </h4>

        {/* Daily Reminder */}
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-base-content/60" />
            <div>
              <p className="font-medium text-base-content">
                Recordatorio diario
              </p>
              <p className="text-sm text-base-content/70">
                Recuérdale agregar tus transacciones
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={reminderSettings.dailyTime}
              onChange={(e) => handleSettingChange('dailyTime', e.target.value)}
              className="px-3 py-1 border border-base-300 rounded-md text-sm bg-base-100 text-base-content"
              disabled={!reminderSettings.dailyReminder}
            />
            <button
              onClick={() => handleSettingChange('dailyReminder', !reminderSettings.dailyReminder)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all shadow-sm ${
                reminderSettings.dailyReminder
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-300'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full transition-all shadow-sm ${
                  reminderSettings.dailyReminder
                    ? 'bg-white translate-x-5 border border-white drop-shadow-md'
                    : 'bg-white translate-x-1 border border-gray-50 drop-shadow-sm'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Weekly Reminder */}
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-base-content/60" />
            <div>
              <p className="font-medium text-base-content">
                Recordatorio semanal
              </p>
              <p className="text-sm text-base-content/70">
                Revisión semanal de tus finanzas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={reminderSettings.weeklyDay}
              onChange={(e) => handleSettingChange('weeklyDay', parseInt(e.target.value))}
              className="px-3 py-1 border border-base-300 rounded-md text-sm bg-base-100 text-base-content"
              disabled={!reminderSettings.weeklyReminder}
            >
              <option value={1}>Lunes</option>
              <option value={2}>Martes</option>
              <option value={3}>Miércoles</option>
              <option value={4}>Jueves</option>
              <option value={5}>Viernes</option>
              <option value={6}>Sábado</option>
              <option value={0}>Domingo</option>
            </select>
            <button
              onClick={() => handleSettingChange('weeklyReminder', !reminderSettings.weeklyReminder)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all shadow-sm ${
                reminderSettings.weeklyReminder
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-300'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full transition-all shadow-sm ${
                  reminderSettings.weeklyReminder
                    ? 'bg-white translate-x-5 border border-white drop-shadow-md'
                    : 'bg-white translate-x-1 border border-gray-50 drop-shadow-sm'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Transaction Reminder */}
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-base-content/60" />
            <div>
              <p className="font-medium text-base-content">
                Alertas de transacciones
              </p>
              <p className="text-sm text-base-content/70">
                Notificaciones de gastos e ingresos
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('transactionReminder', !reminderSettings.transactionReminder)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all shadow-sm ${
              reminderSettings.transactionReminder
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-300'
                : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full transition-all shadow-sm ${
                reminderSettings.transactionReminder
                  ? 'bg-white translate-x-5 border border-white drop-shadow-md'
                  : 'bg-white translate-x-1 border border-gray-50 drop-shadow-sm'
              }`}
            />
          </button>
        </div>

        {/* Monthly Report */}
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-base-content/60" />
            <div>
              <p className="font-medium text-base-content">
                Reporte mensual
              </p>
              <p className="text-sm text-base-content/70">
                Resumen mensual de tus finanzas
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('monthlyReport', !reminderSettings.monthlyReport)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all shadow-sm ${
              reminderSettings.monthlyReport
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-300'
                : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full transition-all shadow-sm ${
                reminderSettings.monthlyReport
                  ? 'bg-white translate-x-5 border border-white drop-shadow-md'
                  : 'bg-white translate-x-1 border border-gray-50 drop-shadow-sm'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <p className="text-sm text-primary">
          💡 Las notificaciones te ayudarán a mantener tus finanzas actualizadas.
          Puedes desactivarlas en cualquier momento desde aquí.
        </p>
      </div>
    </Card>
  );
};

export default NotificationSettings;