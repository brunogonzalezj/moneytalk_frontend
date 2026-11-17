import {useState, useEffect, useRef} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {Mic, MicOff, Save, ChevronDown, ChevronLeft, WifiOff, Sparkles, AlertCircle, CheckCircle2, Keyboard, X} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {TransactionType, useTransactionStore} from '../stores/transactionStore';
import {useCategoryStore} from '../stores/categoryStore';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useOfflineDetection from '../hooks/useOfflineDetection';
import {useUIStore} from '../stores/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {parseCurrencyInput} from '../utils/formatCurrency';
import {todayIso} from '../utils/date';
import {aiApi} from '../api/ai.api';
import {getErrorMessage, notifyError} from '../api/errors';
import VoiceBatchReview, {BatchItem} from '../components/transactions/VoiceBatchReview';
import {CategorizeResult, Category} from '../types/domain';


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
    const {transcript, interimTranscript, isSupported, isListening, error, startListening, stopListening, resetTranscript} = useSpeechRecognition();
    const {isOnline} = useOfflineDetection();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voiceCommandsVisible, setVoiceCommandsVisible] = useState(false);
    const [isFetchingGPT, setIsFetchingGPT] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showCategoryCreationDialog, setShowCategoryCreationDialog] = useState(false);
    const [aiFilled, setAiFilled] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [typedText, setTypedText] = useState('');
    // The transcript already sent to the AI, so each utterance is categorized once
    const processedTranscript = useRef('');
    // Several transactions in one dictation are reviewed one card at a time
    const [batch, setBatch] = useState<BatchItem[] | null>(null);
    const [batchIndex, setBatchIndex] = useState(0);
    const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);
    const [isSavingBatch, setIsSavingBatch] = useState(false);

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
        if (!isListening) return;
        reset(emptyForm());
        setBatch(null);
        setEditingBatchIndex(null);
    }, [isListening, reset]);

    // Voice recognition and the AI both need internet: stop listening when the connection drops
    useEffect(() => {
        if (!isOnline && isListening) stopListening();
    }, [isOnline, isListening, stopListening]);

    const fillForm = (values: Partial<TransactionFormValues>) => {
        (Object.entries(values) as [keyof TransactionFormValues, string | number][]).forEach(([field, value]) =>
            setValue(field, value as never)
        );
    };

    const categoryIdFor = (result: CategorizeResult, list: Category[] = categories) => {
        const matched = list.find(
            (cat) => cat.name.toLowerCase() === result.categoryName.toLowerCase() && cat.type === result.transactionTypeExtracted
        );
        return matched ? String(matched.id) : '';
    };

    const processVoiceInput = async (text: string) => {
        setIsFetchingGPT(true);
        setValidationError(null);
        setSuggestedCategory(null);
        setAiFilled(false);
        setBatch(null);
        setEditingBatchIndex(null);

        try {
            const [result, list] = await Promise.all([
                aiApi.categorize(text),
                // The AI names a category; matching it needs the list, so it is loaded again if it came back empty
                categories.length ? Promise.resolve(categories) : fetchCategories(true),
            ]);

            // Several transactions: review them as cards instead of filling the form
            if (result.transactions && result.transactions.length > 1) {
                reset(emptyForm());
                setBatch(result.transactions.map((item) => ({
                    type: item.transactionTypeExtracted === 'INCOME' ? 'INCOME' : 'EXPENSE',
                    amount: item.amountExtracted,
                    description: item.descriptionExtracted,
                    date: item.dateExtracted || todayIso(),
                    categoryId: categoryIdFor(item, list),
                    suggestedCategory: item.suggestedCategory,
                    status: 'pending',
                })));
                setBatchIndex(0);
                return;
            }

            if (!result.isValidFinancialTransaction) {
                const reason = result.rejectionReason || 'Describe un gasto o un ingreso con su monto';
                setValidationError(reason);
                // Nothing usable came out: don't leave data from a previous attempt in the form
                reset(emptyForm());
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
            setValue('category', categoryIdFor(result, list));
            setAiFilled(true);
            if (result.confidence <= 0.7) {
                toast('Revisa los datos: la categorización tiene baja confianza.');
            }
        } catch (apiError) {
            setValue('description', '');
            setValidationError(getErrorMessage(apiError, 'No se pudo procesar el texto'));
        } finally {
            setIsFetchingGPT(false);
        }
    };

    // The dictation is analyzed once, when listening ends: the browser delivers it in parts,
    // and sending the first part alone would lose the other transactions
    useEffect(() => {
        const text = transcript.trim();
        if (isListening || !text || text === processedTranscript.current) return;
        processedTranscript.current = text;
        void processVoiceInput(text);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript, isListening]);

    const handleAnalyzeTyped = (event: React.FormEvent) => {
        event.preventDefault();
        const text = typedText.trim();
        if (!text || isFetchingGPT || !isOnline) return;
        void processVoiceInput(text);
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
            return;
        }
        setValidationError(null);
        setAiFilled(false);
        startListening();
    };

    // Escape closes the category dialog, like any other modal
    useEffect(() => {
        if (!showCategoryCreationDialog) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleRejectCategory();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showCategoryCreationDialog]);

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

    // Opening a category list that came back empty asks the server again
    const reloadCategoriesIfEmpty = () => {
        if (!categories.length) void fetchCategories(true);
    };

    const updateBatchItem = (index: number, changes: Partial<BatchItem>) =>
        setBatch((items) => items && items.map((item, i) => (i === index ? {...item, ...changes} : item)));

    // Moves to the next card still pending, or wraps up when every card was saved or discarded
    const advanceBatch = (items: BatchItem[], from: number) => {
        const pending = items.map((item, i) => (item.status === 'pending' ? i : -1)).filter((i) => i >= 0);
        if (pending.length) {
            setBatchIndex(pending.find((i) => i > from) ?? pending[0]);
            return;
        }
        const saved = items.filter((item) => item.status === 'saved').length;
        setBatch(null);
        if (saved) {
            toast.success(`Guardaste ${saved} de ${items.length} transacciones`);
            navigate('/transactions');
        } else {
            toast('Descartaste todas las transacciones');
        }
    };

    const saveBatchItem = async (item: BatchItem) => {
        const category = categories.find((cat) => String(cat.id) === item.categoryId);
        if (!category) return false;
        try {
            await addTransaction({
                description: item.description.trim(),
                amount: Number(item.amount),
                categoryId: category.id,
                categoryName: category.name,
                type: item.type,
                date: item.date,
            });
            return true;
        } catch {
            // The store already showed the error; the card stays pending to retry
            return false;
        }
    };

    const handleBatchSave = async (index: number) => {
        if (!batch) return;
        setIsSavingBatch(true);
        const ok = await saveBatchItem(batch[index]);
        setIsSavingBatch(false);
        if (!ok) return;
        const items = batch.map((item, i) => (i === index ? {...item, status: 'saved' as const} : item));
        setBatch(items);
        advanceBatch(items, index);
    };

    const handleBatchSaveAll = async () => {
        if (!batch) return;
        setIsSavingBatch(true);
        let items = batch;
        for (let i = 0; i < items.length; i++) {
            if (items[i].status !== 'pending') continue;
            if (!(await saveBatchItem(items[i]))) break;
            items = items.map((item, k) => (k === i ? {...item, status: 'saved' as const} : item));
        }
        setIsSavingBatch(false);
        setBatch(items);
        advanceBatch(items, batchIndex);
    };

    const handleBatchDiscard = (index: number) => {
        if (!batch) return;
        const items = batch.map((item, i) => (i === index ? {...item, status: 'discarded' as const} : item));
        setBatch(items);
        advanceBatch(items, index);
    };

    // Editing loads the card into the full form; saving the form saves that card and returns to the rest
    const handleBatchEdit = (index: number) => {
        if (!batch) return;
        const item = batch[index];
        reset({description: item.description, amount: item.amount, category: item.categoryId, type: item.type, date: item.date});
        setEditingBatchIndex(index);
        // On phones the form sits below the fold
        requestAnimationFrame(() => document.getElementById('transaction-form')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
    };

    // Closing the review discards the cards still pending
    const handleBatchClose = () => {
        if (!batch) return;
        const items = batch.map((item) => (item.status === 'pending' ? {...item, status: 'discarded' as const} : item));
        setBatch(items);
        advanceBatch(items, batchIndex);
    };

    const handleBatchCreateSuggested = async (index: number) => {
        const item = batch?.[index];
        if (!item?.suggestedCategory) return;
        try {
            const newCategory = await createCategory(item.suggestedCategory, item.type);
            setBatch((items) => items && items.map((entry) =>
                // Other cards that suggested the same name get it too
                entry.status === 'pending' && !entry.categoryId && entry.type === item.type && entry.suggestedCategory === item.suggestedCategory
                    ? {...entry, categoryId: String(newCategory.id), suggestedCategory: undefined}
                    : entry
            ));
            toast.success(`Categoría "${newCategory.name}" lista`);
        } catch (createError) {
            notifyError(createError, 'No se pudo crear la categoría');
        }
    };

    const cancelBatchEdit = () => {
        setEditingBatchIndex(null);
        reset(emptyForm());
    };

    const onSubmit = async (data: TransactionFormValues) => {
        const category = categories.find((cat) => String(cat.id) === data.category);
        if (!category) {
            toast.error('Selecciona una categoría');
            return;
        }

        if (batch && editingBatchIndex !== null) {
            const edited: BatchItem = {
                ...batch[editingBatchIndex],
                description: data.description,
                amount: Number(data.amount),
                categoryId: data.category,
                type: data.type,
                date: data.date,
            };
            setIsSubmitting(true);
            const ok = await saveBatchItem(edited);
            setIsSubmitting(false);
            if (!ok) return;
            const items = batch.map((item, i) => (i === editingBatchIndex ? {...edited, status: 'saved' as const} : item));
            setEditingBatchIndex(null);
            reset(emptyForm());
            setBatch(items);
            advanceBatch(items, editingBatchIndex);
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

    // Offline or unsupported the mic is unavailable; while the AI works it is only busy
    const micUnavailable = !isOnline || !isSupported;
    const micDisabled = micUnavailable || isFetchingGPT;

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
                                    : micUnavailable
                                        ? 'bg-gray-100 dark:bg-gray-800'
                                        : 'bg-primary-100 dark:bg-primary-900/60'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={handleMicClick}
                                disabled={micDisabled}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-[transform,background-color,box-shadow] duration-200 ${
                                    micUnavailable
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                                        : isFetchingGPT
                                            ? 'bg-primary-600 text-white cursor-wait'
                                            : isListening
                                                ? 'bg-accent-600 hover:bg-accent-700 text-white active:scale-95 shadow-[0_6px_16px_-4px_rgba(231,61,62,0.55)]'
                                                : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105 active:scale-95 shadow-[0_6px_16px_-4px_rgba(5,150,105,0.55)]'
                                }`}
                                aria-label={
                                    !isOnline ? 'Grabación no disponible sin conexión'
                                        : !isSupported ? 'Grabación no disponible en este navegador'
                                            : isFetchingGPT ? 'Analizando la transacción'
                                                : isListening ? 'Detener grabación' : 'Iniciar grabación'
                                }
                                title={!isOnline ? 'Necesitas conexión a internet para usar la voz' : undefined}
                                aria-pressed={isListening}
                            >
                                {!isOnline ? (
                                    <WifiOff size={24}/>
                                ) : isFetchingGPT ? (
                                    <span className="w-6 h-6 rounded-full border-[3px] border-white/40 border-t-white animate-spin" aria-hidden="true"/>
                                ) : isListening || !isSupported ? (
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

                    {/* What the user is saying, live, and then the final text */}
                    {(isListening || transcript) && (
                        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3" aria-live="polite">
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{isListening ? 'Escuchando:' : 'Escuché:'}</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium min-h-[1.5rem]">
                                {transcript}
                                {interimTranscript && <span className="text-gray-500 dark:text-gray-400"> {interimTranscript}</span>}
                                {isListening && !transcript && !interimTranscript && (
                                    <span className="text-gray-400 dark:text-gray-500">…</span>
                                )}
                            </p>
                            {transcript && !isListening && !isFetchingGPT && (
                                <button
                                    type="button"
                                    onClick={resetTranscript}
                                    className="text-xs text-primary dark:text-primary-400 hover:underline mt-1"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    )}

                    <div role="status" aria-live="polite" className="w-full max-w-md flex flex-col items-center">
                        {!isOnline ? (
                            <div className="w-full flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 mb-2 text-sm text-amber-900 dark:text-amber-200">
                                <WifiOff size={18} className="mt-0.5 shrink-0"/>
                                <p>
                                    <span className="font-semibold">Sin conexión.</span> La voz y la IA necesitan internet. Puedes llenar
                                    el formulario a mano: se guardará y se enviará al reconectar.
                                </p>
                            </div>
                        ) : isFetchingGPT ? (
                            <p className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                                <Sparkles size={16} className="animate-pulse"/>
                                Analizando con IA…
                            </p>
                        ) : validationError ? (
                            <div className="w-full flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-2 text-sm">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500"/>
                                <div className="flex-1">
                                    <p className="font-semibold text-red-800 dark:text-red-300">No pude reconocer la transacción</p>
                                    <p className="text-red-700 dark:text-red-300">{validationError}</p>
                                    {isSupported && (
                                        <button type="button" onClick={handleMicClick} className="mt-1 font-semibold text-red-800 dark:text-red-200 hover:underline">
                                            Intentar de nuevo
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setValidationError(null)}
                                    aria-label="Cerrar mensaje"
                                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                >
                                    <X size={16}/>
                                </button>
                            </div>
                        ) : error ? (
                            <div className="w-full flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-2 text-sm text-red-700 dark:text-red-300">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500"/>
                                <p>{error}</p>
                            </div>
                        ) : aiFilled ? (
                            <p className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                                <CheckCircle2 size={16}/>
                                Listo. Revisa los datos y guarda.
                            </p>
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium text-center">
                                {isListening
                                    ? "Estoy escuchando... habla claramente e incluye el monto."
                                    : "Toca el micrófono y describe tu transacción"
                                }
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
                        {enableVoiceHints && (
                            <button
                                type="button"
                                className="text-primary dark:text-primary-400 text-xs hover:underline flex items-center"
                                onClick={() => setVoiceCommandsVisible(!voiceCommandsVisible)}
                                aria-expanded={voiceCommandsVisible}
                            >
                                {voiceCommandsVisible ? 'Ocultar consejos' : 'Mostrar consejos'}
                                <ChevronDown
                                    size={14}
                                    className={`ml-1 transform transition-transform ${voiceCommandsVisible ? 'rotate-180' : ''}`}
                                />
                            </button>
                        )}
                        {isOnline && (
                            <button
                                type="button"
                                className="text-primary dark:text-primary-400 text-xs hover:underline flex items-center gap-1"
                                onClick={() => setShowTextInput(!showTextInput)}
                                aria-expanded={showTextInput || !isSupported}
                            >
                                <Keyboard size={14}/>
                                {showTextInput || !isSupported ? 'Ocultar texto' : '¿Prefieres escribirlo?'}
                            </button>
                        )}
                    </div>

                    {isOnline && (showTextInput || !isSupported) && (
                        <form onSubmit={handleAnalyzeTyped} className="mt-3 w-full max-w-md flex gap-2">
                            <label htmlFor="typed-transaction" className="sr-only">Describe tu transacción</label>
                            <input
                                id="typed-transaction"
                                type="text"
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                placeholder='Ej: "Gasté 45 Bs en el supermercado ayer"'
                                maxLength={500}
                                className="input input-bordered input-sm w-full"
                                disabled={isFetchingGPT}
                            />
                            <Button type="submit" variant="primary" size="sm" disabled={!typedText.trim() || isFetchingGPT} icon={<Sparkles size={14}/>}>
                                Analizar
                            </Button>
                        </form>
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
            {batch && editingBatchIndex === null ? (
                <VoiceBatchReview
                    items={batch}
                    index={batchIndex}
                    categories={categories}
                    busy={isSavingBatch}
                    onIndexChange={setBatchIndex}
                    onCategoryChange={(index, categoryId) => updateBatchItem(index, {categoryId})}
                    onCategoriesNeeded={reloadCategoriesIfEmpty}
                    onCreateSuggested={(index) => void handleBatchCreateSuggested(index)}
                    onSave={(index) => void handleBatchSave(index)}
                    onEdit={handleBatchEdit}
                    onDiscard={handleBatchDiscard}
                    onSaveAll={() => void handleBatchSaveAll()}
                    onClose={handleBatchClose}
                />
            ) : (
            <Card className="scroll-mt-4">
                <div id="transaction-form" />
                {batch && editingBatchIndex !== null && (
                    <div className="flex items-center justify-between gap-3 mb-4 rounded-lg bg-primary-50 dark:bg-primary-900/30 px-3 py-2 text-sm">
                        <p className="font-semibold text-primary-800 dark:text-primary-200">
                            Editando la transacción {editingBatchIndex + 1} de {batch.length}
                        </p>
                        <button type="button" onClick={cancelBatchEdit} className="font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                            Volver a las tarjetas
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <fieldset disabled={isFetchingGPT} aria-busy={isFetchingGPT} className={`transition-opacity ${isFetchingGPT ? 'opacity-50' : ''}`}>
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
                            onFocus={reloadCategoriesIfEmpty}
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

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                        {!isOnline && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 sm:mr-auto">
                                Se guardará en este dispositivo y se enviará al reconectar.
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            disabled={isFetchingGPT}
                            icon={<Save size={16}/>}
                        >
                            Guardar Transacción
                        </Button>
                    </div>
                    </fieldset>
                </form>
            </Card>
            )}

            {/* Diálogo de confirmación para crear nueva categoría */}
            {showCategoryCreationDialog && suggestedCategory && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(event) => event.target === event.currentTarget && handleRejectCategory()}
                >
                    <div role="dialog" aria-modal="true" aria-labelledby="new-category-title" className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 id="new-category-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            ¿Crear nueva categoría?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            La IA sugiere la categoría <span className="font-medium text-primary-600 dark:text-primary-400">"{suggestedCategory}"</span>
                            {" "}para esta transacción de tipo <span className="font-medium">{transactionType === 'INCOME' ? 'Ingreso' : 'Gasto'}</span>.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
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

        </div>
    );
};

export default NewTransaction;