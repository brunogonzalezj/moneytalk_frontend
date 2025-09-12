import {useState, useEffect} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {Mic, MicOff, Save, ChevronDown} from 'lucide-react';
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

const NewTransaction = () => {

    const {enableVoiceHints} = useUIStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const {transcript, isListening, error, startListening, stopListening, resetTranscript} = useSpeechRecognition();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voiceCommandsVisible, setVoiceCommandsVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isFetchingGPT, setIsFetchingGPT] = useState(false);

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

    const fetchGPT = async (description: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/gpt/categorize', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: description}),
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
        const apiResult = await fetchGPT(text);
        setIsFetchingGPT(false);

        if (apiResult) {
            // Buscar la categoría por nombre y obtener su id
            const matchedCategory = categories.find(
                cat => cat.name.toLowerCase() === apiResult.categoryName?.toLowerCase()
            );
            setValue('category', matchedCategory ? matchedCategory.id.toString() : '');
            setValue('amount', apiResult.amountExtracted || 0);
            setValue('description', apiResult.descriptionExtracted || '');
            setValue('type', apiResult.transactionTypeExtracted === 'INCOME' ? 'INCOME' : 'EXPENSE');
        } else {
            setValue('description', text);
        }
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
                                        ? 'bg-accent-100 border-accent-300 text-accent-800 font-medium'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
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
                                        ? 'bg-primary-100 border-primary-300 text-primary-800 font-medium'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
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
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Bs</span>
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
        </div>
    );
};

export default NewTransaction;