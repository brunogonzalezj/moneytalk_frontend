import {useState, useEffect} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {Mic, MicOff, Save, ChevronDown, ChevronLeft} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {TransactionType} from '../stores/transactionStore';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import {useUIStore} from '../stores/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {parseCurrencyInput} from '../utils/formatCurrency';
import {DateTime} from "luxon";
import axios from 'axios';
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner.tsx";
import { useAuthStore } from '../stores/authStore';


interface TransactionFormValues {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
}

interface Category {
    id: number
    name: string;
    type: TransactionType;
}

interface CategorizeResult {
    categoryName: string;
    amountExtracted: number;
    descriptionExtracted: string;
    dateExtracted?: string; // Formato YYYY-MM-DD
    transactionTypeExtracted: 'INCOME' | 'EXPENSE';
    isValidFinancialTransaction: boolean;
    suggestedCategory?: string;
    confidence: number;
    rejectionReason?: string;
}

const NewTransaction = () => {

    const {enableVoiceHints} = useUIStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const {transcript, isListening, error, startListening, stopListening, resetTranscript} = useSpeechRecognition();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voiceCommandsVisible, setVoiceCommandsVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isFetchingGPT, setIsFetchingGPT] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showCategoryCreationDialog, setShowCategoryCreationDialog] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/categories');
                setCategories(response.data); // Asume que la API devuelve un array de categorías
                return response.data; // Asume que la API devuelve un array de categorías
            } catch (error) {
                console.error('Error al obtener categorías:', error);
                return [];
            }
        }
        fetchCategories()
    }, []);

    useEffect(() => {
        if (transcript && categories.length > 0) {
            processVoiceInput(transcript);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript, categories]);

    const createTransaction = async (data: TransactionFormValues) => {
        try {
            if (!user) {
                throw new Error('Usuario no autenticado');
            }
            
            const response = await axios.post('http://localhost:3000/api/transactions', {
                description: data.description,
                amount: data.amount,
                categoryId: parseInt(data.category),
                type: data.type,
                date: DateTime.fromISO(data.date).toJSDate(),
                userId: parseInt(user.id) // Convertir string a number
            });
            toast.success('Transacción creada exitosamente');
            if (!response.data) {
                throw new Error('No se pudo crear la transacción');
            }
        } catch (error) {
            console.error('Error al crear transacción:', error);
            throw new Error('No se pudo crear la transacción');
        }
    }

    const fetchGPT = async (description: string): Promise<CategorizeResult | null> => {
        try {
            // Obtener token del auth-storage (como lo hace el resto de la app)
            const authStorage = localStorage.getItem('auth-storage');
            const token = authStorage ? JSON.parse(authStorage).state?.token : null;

            console.log('Token from auth-storage:', token ? 'exists' : 'null');
            console.log('Token length:', token?.length);

            if (!token) {
                toast.error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
                return null;
            }

            const response = await fetch('http://localhost:3000/api/gpt/categorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({text: description}),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Sesion expirada. Por favor, inicia sesión nuevamente.');
                    // Opcional: redirigir a login
                    // window.location.href = '/login';
                } else {
                    toast.error('Error al categorizar la transacción');
                }
                throw new Error('Error al categorizar');
            }

            const data = await response.json();
            return data as CategorizeResult;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const createCategory = async (categoryName: string, transactionType: TransactionType): Promise<Category | null> => {
        try {
            // Obtener token del auth-storage (como lo hace el resto de la app)
            const authStorage = localStorage.getItem('auth-storage');
            console.log('Auth storage:', authStorage);
            const token = authStorage ? JSON.parse(authStorage).state?.token : null;
            console.log('Token from createCategory:', token ? token.substring(0, 50) + '...' : 'null');

            if (!token) {
                throw new Error('No hay token de autenticación disponible');
            }

            const response = await fetch('http://localhost:3000/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: categoryName,
                    type: transactionType
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al crear categoría'}`);
            }

            const data = await response.json();
            console.log('Category created successfully:', data);
            return data as Category;
        } catch (e) {
            console.error('Create category error:', e);
            toast.error(e.message || 'Error al crear la categoría');
            return null;
        }
    };

    const {
        control,
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: {errors}
    } = useForm<TransactionFormValues>({
        defaultValues: {
            description: '',
            amount: 0,
            category: '',
            type: 'EXPENSE',
            date: DateTime.now().toISODate(), // Fecha actual
        },
    });

    const transactionType = watch('type');

    useEffect(() => {
        if (isListening) {
            reset({
                description: '',
                amount: 0,
                category: '',
                type: 'EXPENSE',
                date: DateTime.now().toISODate(),
            });
        }
    }, [isListening, reset]);

    useEffect(() => {
        if (transcript) {
            processVoiceInput(transcript);
        }
    }, [transcript]);

    const processVoiceInput = async (text: string) => {
        // Llama a la API para categorizar
        setIsFetchingGPT(true);
        setValidationError(null);
        setSuggestedCategory(null);

        const apiResult = await fetchGPT(text);
        setIsFetchingGPT(false);

        if (apiResult) {
            if (!apiResult.isValidFinancialTransaction) {
                // Transacción no válida - no establecer descripción
                setValidationError(apiResult.rejectionReason || 'No se reconoció como una transacción financiera válida');
                setValue('description', ''); // Mantener descripción vacía
                toast.error(apiResult.rejectionReason || 'Por favor, describe una transacción financiera (gasto o ingreso)');
                return;
            }

            // Transacción válida pero necesita nueva categoría
            if (apiResult.suggestedCategory) {
                setSuggestedCategory(apiResult.suggestedCategory);
                setValue('amount', apiResult.amountExtracted || 0);
                setValue('description', apiResult.descriptionExtracted || '');
                setValue('type', apiResult.transactionTypeExtracted === 'INCOME' ? 'INCOME' : 'EXPENSE');
                setValue('category', '');
                
                // Establecer fecha si fue proporcionada
                if (apiResult.dateExtracted) {
                    setValue('date', apiResult.dateExtracted);
                } else {
                    // Si no hay fecha, usar hoy por defecto
                    setValue('date', DateTime.now().toISODate());
                }

                // Mostrar diálogo de confirmación para crear categoría
                setShowCategoryCreationDialog(true);
                return;
            }

            // Transacción válida con categoría existente
            if (apiResult.categoryName) {
                const matchedCategory = categories.find(
                    cat => cat.name.toLowerCase() === apiResult.categoryName?.toLowerCase()
                );
                setValue('category', matchedCategory ? matchedCategory.id.toString() : '');
                setValue('amount', apiResult.amountExtracted || 0);
                setValue('description', apiResult.descriptionExtracted || '');
                setValue('type', apiResult.transactionTypeExtracted === 'INCOME' ? 'INCOME' : 'EXPENSE');
                
                // Establecer fecha si fue proporcionada por GPT
                if (apiResult.dateExtracted) {
                    setValue('date', apiResult.dateExtracted);
                } else {
                    // Si no hay fecha, usar hoy por defecto
                    setValue('date', DateTime.now().toISODate());
                }

                if (apiResult.confidence > 0.7) {
                    toast.success('Transacción categorizada correctamente');
                } else {
                    toast('Transacción categorizada con baja confianza. Por favor, verifica los datos.');
                }
            } else {
                // No hay categoría válida y no hay sugerencia - mantener descripción vacía
                setValue('description', '');
            }
        } else {
            // Error en la API - mantener descripción vacía
            setValue('description', '');
            toast.error('Error al procesar la transacción');
        }
    };

    const handleCreateCategory = async () => {
        if (!suggestedCategory) return;

        const transactionType = watch('type');
        const newCategory = await createCategory(suggestedCategory, transactionType);

        if (newCategory) {
            // Actualizar lista de categorías
            setCategories(prev => [...prev, newCategory]);

            // Autoseleccionar la nueva categoría
            setValue('category', newCategory.id.toString());

            // Limpiar estado
            setSuggestedCategory(null);
            setShowCategoryCreationDialog(false);

            toast.success(`Categoría "${newCategory.name}" creada exitosamente`);
        }
    };

    const handleRejectCategory = () => {
        setSuggestedCategory(null);
        setShowCategoryCreationDialog(false);
        toast('Por favor, selecciona una categoría existente manualmente');
    };

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);

        console.log('Datos de la transacción:', data);
        try {
            await createTransaction({
                description: data.description,
                amount: data.amount,
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

    const goBack = () => {
        navigate(-1); // Regresa a la página anterior en el historial
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center mb-6">
                <button
                    onClick={goBack}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Volver a la página anterior"
                >
                    <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Agregar Nueva Transacción</h1>
            </div>

            <Card className="mb-6">
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative mb-4">
                        <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center ${
                                isListening
                                    ? 'bg-primary-100 dark:bg-primary-900 animate-pulse-slow'
                                    : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                    isListening
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                aria-label={isListening ? 'Detener grabación' : 'Iniciar grabación'}
                            >
                                {isListening ? (
                                    <MicOff size={24}/>
                                ) : (
                                    <Mic size={24} className="text-primary"/>
                                )}
                            </button>
                        </div>

                        {isListening && (
                            <div
                                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-black text-xs px-2 py-1 rounded-full">
                                Escuchando...
                            </div>
                        )}
                    </div>

                    {transcript && (
                        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
                            <p className="text-gray-700 dark:text-gray-300 text-sm">Escuché:</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{transcript}</p>
                            <button
                                type="button"
                                onClick={resetTranscript}
                                className="text-xs text-primary dark:text-primary-400 hover:underline mt-1"
                            >
                                Limpiar
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="text-error text-sm mb-2">{error}</div>
                    )}

                    <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                        {isListening
                            ? "Estoy escuchando... habla claramente e incluye el monto."
                            : "Toca el micrófono y describe tu transacción"
                        }
                    </p>

                    {enableVoiceHints && (
                        <button
                            type="button"
                            className="text-primary dark:text-primary-400 text-xs mt-2 hover:underline flex items-center"
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
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg w-full max-w-md">
                            <p className="font-medium mb-1 text-gray-700 dark:text-gray-300">Prueba diciendo:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                <li>"Gasté Bs 45 en el supermercado ayer"</li>
                                <li>"Café en Starbucks por Bs 4.50"</li>
                                <li>"Recibí Bs 500 de salario"</li>
                                <li>"Factura de luz Bs 65"</li>
                            </ul>
                        </div>
                    )}
                </div>
            </Card>
            {isFetchingGPT ? (
                <div className="flex justify-center mb-4">
                    <Spinner />
                </div>
            ):(
            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Tipo de Transacción</span>
                            </label>
                            <div className="flex rounded-md shadow-sm">
                                <label className={`flex-1 py-2 px-4 text-center cursor-pointer rounded-l-md border ${
                                    transactionType === 'EXPENSE'
                                        ? 'bg-accent-100 dark:bg-accent-900 border-accent-300 dark:border-accent-600 text-accent-800 dark:text-accent-200 font-medium'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}>
                                    <input
                                        type="radio"
                                        value="EXPENSE"
                                        className="sr-only"
                                        {...register('type')}
                                    />
                                    <span>Gasto</span>
                                </label>
                                <label className={`flex-1 py-2 px-4 text-center cursor-pointer rounded-r-md border ${
                                    transactionType === 'INCOME'
                                        ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-600 text-primary-800 dark:text-primary-200 font-medium'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}>
                                    <input
                                        type="radio"
                                        value="INCOME"
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
                                max={DateTime.now().toISODate()}
                                {...register('date', {required: 'La fecha es requerida'})}
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
                                    validate: value => value > 0 || 'El monto debe ser mayor a 0',
                                }}
                                render={({field, fieldState}) => (
                                    <div className="relative">
                                        <span
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">Bs</span>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            className={`input input-bordered w-full pl-8 ${fieldState.error ? 'input-error' : ''}`}
                                            value={field.value}
                                            {...register('amount', {
                                                required: 'El monto es requerido',
                                                validate: value => value > 0 || 'El monto debe ser mayor a 0'}
                                            )}
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
                            name={'category'}
                        >
                            <option value="">Selecciona una categoría</option>
                            {(Array.isArray(categories) ? categories : [])
                                .filter(cat => cat.type === transactionType)
                                .map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))
                            }
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
                            icon={<Save size={16}/>}
                        >
                            Guardar Transacción
                        </Button>
                    </div>
                </form>
            </Card>)}

            {/* Diálogo de confirmación para crear nueva categoría */}
            {showCategoryCreationDialog && suggestedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            ¿Crear nueva categoría?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            La IA sugiere la categoría <span className="font-medium text-primary-600 dark:text-primary-400">"{suggestedCategory}"</span>
                            {" "}para esta transacción de tipo <span className="font-medium">{transactionType === 'INCOME' ? 'Ingreso' : 'Gasto'}</span>.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={handleRejectCategory}
                            >
                                No, seleccionar manualmente
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateCategory}
                            >
                                Sí, crear categoría
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mensaje de error de validación */}
            {validationError && (
                <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md z-50">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                                Transacción no reconocida
                            </h3>
                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                {validationError}
                            </p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setValidationError(null)}
                                className="inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:outline-none"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewTransaction;