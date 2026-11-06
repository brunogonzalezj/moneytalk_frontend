import { BookOpen, Mic, TrendingUp, DollarSign, Calendar, PieChart, Settings, Download } from 'lucide-react';
import Card from '../components/ui/Card';

const Manual = () => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
          <BookOpen size={32} className="text-primary-500" />
          Manual de Usuario - MoneyTalk
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Guía completa para aprovechar al máximo tu aplicación de gestión financiera
        </p>
      </div>

      <div className="space-y-6">
        {/* Introducción */}
        <Card title="🎯 Introducción">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              MoneyTalk es una aplicación de gestión financiera personal que te permite controlar tus ingresos y gastos 
              de manera intuitiva. Con tecnología de reconocimiento de voz, puedes registrar transacciones simplemente hablando.
            </p>
          </div>
        </Card>

        {/* Dashboard */}
        <Card title="📊 Panel Principal (Dashboard)">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Vista General</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  El dashboard muestra un resumen de tu situación financiera actual, incluyendo balance total, 
                  ingresos y gastos del mes, y gráficos de tendencias.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Características:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Balance total actualizado en tiempo real</li>
                <li>Resumen mensual de ingresos y gastos</li>
                <li>Gráfico de tendencias de los últimos meses</li>
                <li>Transacciones recientes</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Nueva Transacción con Voz */}
        <Card title="🎤 Agregar Transacciones con Voz">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mic className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Reconocimiento de Voz</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  La función de voz te permite registrar transacciones de forma rápida y natural.
                </p>
              </div>
            </div>
            
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">📝 Ejemplos de comandos de voz:</h4>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="font-mono text-sm">"Gasto de 50 euros en supermercado"</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="font-mono text-sm">"Ingreso de 1500 euros por salario"</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="font-mono text-sm">"Compra de 25 euros en restaurante"</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="font-mono text-sm">"Pago de 100 euros en gasolina"</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Pasos para usar la voz:</h4>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Haz clic en el botón del micrófono</li>
                <li>Permite el acceso al micrófono si es la primera vez</li>
                <li>Di tu transacción de forma clara</li>
                <li>Revisa que la información capturada sea correcta</li>
                <li>Ajusta si es necesario y guarda</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Transacciones Manuales */}
        <Card title="💰 Agregar Transacciones Manualmente">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  También puedes agregar transacciones llenando el formulario manualmente desde la sección 
                  "Nueva Transacción".
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Campos requeridos:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong>Tipo:</strong> Ingreso o Gasto</li>
                <li><strong>Monto:</strong> Cantidad de dinero</li>
                <li><strong>Categoría:</strong> Clasifica tu transacción</li>
                <li><strong>Descripción:</strong> Detalles adicionales (opcional)</li>
                <li><strong>Fecha:</strong> Fecha de la transacción</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Presupuestos */}
        <Card title="🎯 Gestión de Presupuestos">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <PieChart className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Crea y administra presupuestos mensuales por categoría para controlar tus gastos y alcanzar tus metas financieras.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Funcionalidades:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Establece límites de gasto por categoría</li>
                <li>Visualiza el progreso en tiempo real</li>
                <li>Recibe alertas cuando te acerques al límite</li>
                <li>Compara presupuesto vs. gasto real</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Pagos Recurrentes */}
        <Card title="🔄 Pagos Recurrentes">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Configura recordatorios para pagos que se repiten mensualmente como suscripciones, servicios, alquiler, etc.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Características:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Programa pagos automáticos o recordatorios</li>
                <li>Define frecuencia (mensual, semanal, anual)</li>
                <li>Activa o desactiva pagos según necesites</li>
                <li>Historial de todos los pagos realizados</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Reportes */}
        <Card title="📈 Reportes y Análisis">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Visualiza tus finanzas con gráficos detallados y reportes personalizables.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Tipos de reportes:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Gráfico de ingresos vs gastos</li>
                <li>Distribución por categorías</li>
                <li>Evolución mensual</li>
                <li>Tendencias y proyecciones</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Exportar Datos */}
        <Card title="📥 Exportar Datos">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Download className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Exporta todas tus transacciones en formato CSV o Excel para análisis externos o respaldos.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Cómo exportar:</h4>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Ve a Perfil → Exportar Todos los Datos</li>
                <li>Selecciona el rango de fechas</li>
                <li>Elige el formato (CSV o XLSX)</li>
                <li>Descarga el archivo</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Configuración */}
        <Card title="⚙️ Configuración de Perfil">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Settings className="text-primary-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Personaliza tu experiencia en MoneyTalk desde la sección de Perfil.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Opciones disponibles:</h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong>Tema:</strong> Claro, Oscuro o Automático</li>
                <li><strong>Reconocimiento de voz:</strong> Activa/desactiva sugerencias</li>
                <li><strong>Notificaciones:</strong> Configura alertas de presupuesto</li>
                <li><strong>Seguridad:</strong> Cambia contraseña y 2FA</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Tips y Consejos */}
        <Card title="💡 Tips y Consejos">
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-lg border border-primary-200 dark:border-primary-800">
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Registra tus transacciones diariamente para mantener un control preciso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Usa categorías consistentes para mejores reportes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Revisa tus reportes semanalmente para detectar patrones de gasto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Configura presupuestos realistas basados en tu historial</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Aprovecha la función de voz para registrar gastos sobre la marcha</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Exporta tus datos regularmente como respaldo</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Soporte */}
        <Card title="🆘 Soporte y Ayuda">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Si tienes problemas o preguntas adicionales:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Revisa las secciones anteriores de este manual</li>
              <li>Verifica tu conexión a internet si hay problemas de sincronización</li>
              <li>Asegúrate de tener permisos de micrófono habilitados para usar la función de voz</li>
              <li>Contacta al equipo de soporte para asistencia adicional</li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 pb-8">
        <p>MoneyTalk - Tu asistente financiero personal</p>
        <p className="mt-1">Versión 1.0 • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Manual;
