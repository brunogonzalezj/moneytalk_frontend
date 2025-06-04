import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Mic, MicOff, Save, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore, TransactionType } from '../stores/transactionStore';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useUIStore } from '../stores/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { parseCurrencyInput } from '../utils/formatCurrency';

interface TransactionFormValues {
  description: string;
  amount: string;
  category: string;
  type: TransactionType;
  date: string;
}

const EXPENSE_CATEGORIES = [
  'Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 'Compras', 
  'Servicios', 'Salud', 'Educación', 'Viajes', 'Otros'
];

const INCOME_CATEGORIES = [
  'Salario', 'Freelance', 'Inversiones', 'Regalos', 'Reembolsos', 
  'Ingresos Extras', 'Otros'
];

const NewTransaction = () => {
  const { addTransaction } = useTransactionStore();
  const { enableVoiceHints } = useUIStore();
  const navigate = useNavigate();
  const { transcript, isListening, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceCommandsVisible, setVoiceCommandsVisible] = useState(false);

  const fetchGPT = async (description: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/gpt/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description }),
      });
      if (!response.ok) throw new Error('Error al categorizar');
      const data = await response.json();
      return data; // categoryName, amountExtracted, descriptionExtracted, transactionTypeExtracted
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const { 
    control,
    register, 
    handleSubmit,
    setValue,
    watch,
    formState: { errors } 
  } = useForm<TransactionFormValues>({
    defaultValues: {
      description: '',
      amount: '',
      category: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  });
  
  const transactionType = watch('type');
  
  useEffect(() => {
    if (transcript) {
      processVoiceInput(transcript);
    }
  }, [transcript]);

  const processVoiceInput = async (text: string) => {
    // Llama a la API para categorizar
    const apiResult = await fetchGPT(text);

    if (apiResult) {
      setValue('category', apiResult.categoryName || '');
      setValue('amount', apiResult.amountExtracted?.toString() || '');
      setValue('description', apiResult.descriptionExtracted || '');
      setValue('type', apiResult.transactionTypeExtracted === 'income' ? 'income' : 'expense');
    } else {
      // Fallback simple si la API falla
      setValue('description', text);
    }
  };
  
  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true);
    
    try {
      const numericAmount = parseCurrencyInput(data.amount);
      
      await addTransaction({
        description: data.description,
        amount: numericAmount,
        category: data.category,
        type: data.type,
        date: data.date,
      });
      
      navigate('/transactions');
    } catch (error) {
      console.error('Error al agregar transacción:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Agregar Nueva Transacción</h1>
      
      <Card className="mb-6">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative mb-4">
            <div 
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isListening 
                  ? 'bg-primary-100 animate-pulse-slow' 
                  : 'bg-gray-100'
              }`}
            >
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isListening 
                    ? 'bg-primary text-white' 
                    : 'bg-white shadow-md hover:bg-gray-50'
                }`}
                aria-label={isListening ? 'Detener grabación' : 'Iniciar grabación'}
              >
                {isListening ? (
                  <MicOff size={24} />
                ) : (
                  <Mic size={24} className="text-primary" />
                )}
              </button>
            </div>
            
            {isListening && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-black text-xs px-2 py-1 rounded-full">
                Escuchando...
              </div>
            )}
          </div>
          
          {transcript && (
            <div className="w-full max-w-md bg-gray-50 p-3 rounded-lg mb-3">
              <p className="text-gray-700 text-sm">Escuché:</p>
              <p className="text-gray-900 font-medium">{transcript}</p>
              <button
                type="button"
                onClick={resetTranscript}
                className="text-xs text-primary hover:underline mt-1"
              >
                Limpiar
              </button>
            </div>
          )}
          
          {error && (
            <div className="text-error text-sm mb-2">{error}</div>
          )}
          
          <p className="text-gray-600 text-sm text-center">
            {isListening 
              ? "Estoy escuchando... habla claramente e incluye el monto."
              : "Toca el micrófono y describe tu transacción"
            }
          </p>
          
          {enableVoiceHints && (
            <button 
              type="button"
              className="text-primary text-xs mt-2 hover:underline flex items-center"
              onClick={() => setVoiceCommandsVisible(!voiceCommandsVisible)}
            >
              {voiceCommandsVisible ? 'Ocultar consejos' : 'Mostrar consejos'} 
              <ChevronDown 
                size={14} 
                className={`ml-1 transform transition-transform ${voiceCommandsVisible ? 'rotate-180' : ''}`} 
              />
            </button>
          )}
          
          {voiceCommandsVisible && (
            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg w-full max-w-md">
              <p className="font-medium mb-1">Prueba diciendo:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>"Gasté Bs 45 en el supermercado ayer"</li>
                <li>"Café en Starbucks por Bs 4.50"</li>
                <li>"Recibí Bs 500 de salario"</li>
                <li>"Factura de luz Bs 65"</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
      
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tipo de Transacción</span>
              </label>
              <div className="flex rounded-md shadow-sm">
                <label className={`flex-1 py-2 px-4 text-center cursor-pointer rounded-l-md border ${
                  transactionType === 'expense'
                    ? 'bg-accent-100 border-accent-300 text-accent-800 font-medium'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    value="expense"
                    className="sr-only"
                    {...register('type')}
                  />
                  <span>Gasto</span>
                </label>
                <label className={`flex-1 py-2 px-4 text-center cursor-pointer rounded-r-md border ${
                  transactionType === 'income'
                    ? 'bg-primary-100 border-primary-300 text-primary-800 font-medium'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    value="income"
                    className="sr-only"
                    {...register('type')}
                  />
                  <span>Ingreso</span>
                </label>
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Fecha</span>
              </label>
              <input
                type="date"
                className={`input input-bordered w-full ${errors.date ? 'input-error' : ''}`}
                {...register('date', { required: 'La fecha es requerida' })}
              />
              {errors.date && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.date.message}</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Descripción</span>
              </label>
              <input
                type="text"
                placeholder="¿Para qué fue esta transacción?"
                className={`input input-bordered w-full ${errors.description ? 'input-error' : ''}`}
                {...register('description', { 
                  required: 'La descripción es requerida',
                })}
              />
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.description.message}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Monto</span>
              </label>
              <Controller
                name="amount"
                control={control}
                rules={{ 
                  required: 'El monto es requerido',
                  validate: value => parseCurrencyInput(value) > 0 || 'El monto debe ser mayor a 0',
                }}
                render={({ field, fieldState }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Bs</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      className={`input input-bordered w-full pl-8 ${fieldState.error ? 'input-error' : ''}`}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.]/g, '');
                        field.onChange(value);
                      }}
                      onBlur={(e) => {
                        const numericValue = parseCurrencyInput(e.target.value);
                        if (numericValue > 0) {
                          field.onChange(numericValue.toString());
                        }
                      }}
                    />
                  </div>
                )}
              />
              {errors.amount && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.amount.message}</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Categoría</span>
            </label>
            <select
              className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
              {...register('category', { 
                required: 'La categoría es requerida',
              })}
            >
              <option value="">Selecciona una categoría</option>
              {transactionType === 'income' ? (
                INCOME_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))
              ) : (
                EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))
              )}
            </select>
            {errors.category && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.category.message}</span>
              </label>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save size={16} />}
            >
              Guardar Transacción
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewTransaction;