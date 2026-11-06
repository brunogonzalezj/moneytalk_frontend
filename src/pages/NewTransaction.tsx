import {useState, useEffect, useRef} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {Mic, MicOff, Save, ChevronDown, ChevronLeft} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {TransactionType, useTransactionStore} from '../stores/transactionStore';
import {useCategoryStore} from '../stores/categoryStore';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import {useUIStore} from '../stores/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import {parseCurrencyInput} from '../utils/formatCurrency';
import {todayIso} from '../utils/date';
import {aiApi} from '../api/ai.api';
import {getErrorMessage, notifyError} from '../api/errors';


interface TransactionFormValues {
    description: string;
    amount: number;
    category: string; // category id
    type: TransactionType;
    date: string; // YYYY-MM-DD
}

const emptyForm = (): TransactionFormValues => ({
    description: '',
    amount: 0,
    category: '',
    type: 'EXPENSE',
    date: todayIso(),
});

const NewTransaction = () => {

    const enableVoiceHints = useUIStore((state) => state.enableVoiceHints);
    const addTransaction = useTransactionStore((state) => state.addTransaction);
    const categories = useCategoryStore((state) => state.categories);
    const fetchCategories = useCategoryStore((state) => state.fetchCategories);
    const createCategory = useCategoryStore((state) => state.createCategory);
    const navigate = useNavigate();
    const {transcript, isListening, error, startListening, stopListening, resetTranscript} = useSpeechRecognition();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voiceCommandsVisible, setVoiceCommandsVisible] = useState(false);
    const [isFetchingGPT, setIsFetchingGPT] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showCategoryCreationDialog, setShowCategoryCreationDialog] = useState(false);
    // The transcript already sent to the AI, so each utterance is categorized once
    const processedTranscript = useRef('');

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

    const {
        control,
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: {errors}
    } = useForm<TransactionFormValues>({ defaultValues: emptyForm() });

    const transactionType = watch('type');

    useEffect(() => {
        if (isListening) reset(emptyForm());
    }, [isListening, reset]);

    const fillForm = (values: Partial<TransactionFormValues>) => {
        (Object.entries(values) as [keyof TransactionFormValues, string | number][]).forEach(([field, value]) =>
            setValue(field, value as never)
        );
    };

    const processVoiceInput = async (text: string) => {
        setIsFetchingGPT(true);
        setValidationError(null);
        setSuggestedCategory(null);

        try {
            const result = await aiApi.categorize(text);

            if (!result.isValidFinancialTransaction) {
                const reason = result.rejectionReason || 'Describe un gasto o un ingreso con su monto';
                setValidationError(reason);
                setValue('description', '');
                toast.error(reason);
                return;
            }

            fillForm({
                amount: result.amountExtracted || 0,
                description: result.descriptionExtracted || '',
                type: result.transactionTypeExtracted === 'INCOME' ? 'INCOME' : 'EXPENSE',
                date: result.dateExtracted || todayIso(),
            });

            // Valid, but no existing category fits: offer to create the suggested one
            if (result.suggestedCategory) {
                setValue('category', '');
                setSuggestedCategory(result.suggestedCategory);
                setShowCategoryCreationDialog(true);
                return;
            }

            // The server already matched the name to one of the user's categories
            const matched = categories.find(
                (cat) => cat.name.toLowerCase() === result.categoryName.toLowerCase() && cat.type === result.transactionTypeExtracted
            );
            setValue('category', matched ? String(matched.id) : '');

            if (result.confidence > 0.7) {
                toast.success('Transacción categorizada correctamente');
            } else {
                toast('Revisa los datos: la categorización tiene baja confianza.');
            }
        } catch (apiError) {
            setValue('description', '');
            setValidationError(getErrorMessage(apiError, 'No se pudo procesar el texto'));
            notifyError(apiError, 'No se pudo procesar el texto');
        } finally {
            setIsFetchingGPT(false);
        }
    };

    useEffect(() => {
        const text = transcript.trim();
        if (!text || text === processedTranscript.current) return;
        processedTranscript.current = text;
        void processVoiceInput(text);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    const handleCreateCategory = async () => {
        if (!suggestedCategory) return;
        try {
            const newCategory = await createCategory(suggestedCategory, watch('type'));
            setValue('category', String(newCategory.id));
            setSuggestedCategory(null);
            setShowCategoryCreationDialog(false);
            toast.success(`Categoría "${newCategory.name}" lista`);
        } catch (createError) {
            notifyError(createError, 'No se pudo crear la categoría');
        }
    };

    const handleRejectCategory = () => {
        setSuggestedCategory(null);
        setShowCategoryCreationDialog(false);
        toast('Selecciona una categoría existente');
    };

    const onSubmit = async (data: TransactionFormValues) => {
        const category = categories.find((cat) => String(cat.id) === data.category);
        if (!category) {
            toast.error('Selecciona una categoría');
            return;
        }

        setIsSubmitting(true);
        try {
            await addTransaction({
                description: data.description.trim(),
                amount: Number(data.amount),
                categoryId: category.id,
                categoryName: category.name,
                type: data.type,
                date: data.date,
            });
            navigate('/transactions');
        } catch {
            // The store already showed the error; the form keeps the data to retry
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
                    className="-ml-2 mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Volver a la página anterior"
                >
                    <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Agregar Nueva Transacción</h1>
            </div>

            <Card className="mb-6">
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative mb-4">
                        <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center ${
                                isListening
                                    ? 'bg-accent-100 dark:bg-accent-900/60 animate-pulse-slow'
                                    : 'bg-primary-100 dark:bg-primary-900/60'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-[transform,background-color,box-shadow] duration-200 active:scale-95 ${
                                    isListening
                                        ? 'bg-accent-600 hover:bg-accent-700 shadow-[0_6px_16px_-4px_rgba(231,61,62,0.55)]'
                                        : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 shadow-[0_6px_16px_-4px_rgba(5,150,105,0.55)]'
                                }`}
                                aria-label={isListening ? 'Detener grabación' : 'Iniciar grabación'}
                            >
                                {isListening ? (
                                    <MicOff size={24}/>
                                ) : (
                                    <Mic size={26}/>
                                )}
                            </button>
                        </div>

                        {isListening && (
                            <div
                                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-accent-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
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

                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium text-center">
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
                                max={todayIso()}
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