import { ChevronLeft, ChevronRight, Pencil, Save, Sparkles, Trash2, X } from 'lucide-react';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/date';
import { Category, TransactionType } from '../../types/domain';

export type BatchStatus = 'pending' | 'saved' | 'discarded';

/** One transaction the AI found in a dictation with several of them. */
export interface BatchItem {
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  categoryId: string; // '' until the user or the AI picks one
  suggestedCategory?: string;
  status: BatchStatus;
}

interface VoiceBatchReviewProps {
  items: BatchItem[];
  index: number;
  categories: Category[];
  busy: boolean;
  onIndexChange: (index: number) => void;
  onCategoryChange: (index: number, categoryId: string) => void;
  /** Called when the category list is opened, so an empty list can be loaded again */
  onCategoriesNeeded: () => void;
  onCreateSuggested: (index: number) => void;
  onSave: (index: number) => void;
  onEdit: (index: number) => void;
  onDiscard: (index: number) => void;
  onSaveAll: () => void;
  /** Closes the review, discarding the cards still pending */
  onClose: () => void;
}

/**
 * Cards for reviewing, one at a time, the transactions found in a single dictation:
 * each one is saved, edited in the full form, or discarded.
 * On phones it opens as a bottom sheet over the page, so the result is seen without scrolling.
 */
const VoiceBatchReview = ({
  items,
  index,
  categories,
  busy,
  onIndexChange,
  onCategoryChange,
  onCategoriesNeeded,
  onCreateSuggested,
  onSave,
  onEdit,
  onDiscard,
  onSaveAll,
  onClose,
}: VoiceBatchReviewProps) => {
  const pending = items.map((item, i) => (item.status === 'pending' ? i : -1)).filter((i) => i >= 0);
  const item = items[index];
  if (!item) return null;

  const position = pending.indexOf(index);
  const previous = position > 0 ? pending[position - 1] : undefined;
  const next = position >= 0 && position < pending.length - 1 ? pending[position + 1] : undefined;
  const isIncome = item.type === 'INCOME';
  const typeCategories = categories.filter((cat) => cat.type === item.type);
  const readyToSaveAll = pending.length > 1 && pending.every((i) => items[i].categoryId);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:static md:z-auto md:block" role="dialog" aria-modal="true" aria-labelledby="batch-title">
      <div className="absolute inset-0 bg-black/50 md:hidden animate-fade-in" aria-hidden="true" />
    <section className="relative w-full max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-base-200 dark:bg-gray-900 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.18)] animate-slide-up md:max-h-none md:overflow-visible md:max-w-md md:mx-auto md:rounded-none md:bg-transparent md:dark:bg-transparent md:p-0 md:shadow-none md:animate-fade-in">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600 md:hidden" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3 mb-3">
        <p id="batch-title" className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
          <Sparkles size={16} />
          {items.length > 1 ? `Encontré ${items.length} transacciones` : 'Encontré esta transacción'}
        </p>
        <div className="flex items-center gap-2">
          {items.length > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {position + 1} de {pending.length}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={items.length > 1 ? 'Cerrar y descartar las que faltan' : 'Cerrar y descartar'}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => previous !== undefined && onIndexChange(previous)}
          disabled={previous === undefined || busy}
          aria-label="Transacción anterior"
          className={`${items.length > 1 ? '' : 'hidden '}p-1 sm:p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronLeft size={20} />
        </button>

        <article
          key={index}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_4px_12px_-2px_rgba(16,24,40,0.08)] animate-slide-up"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isIncome
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  : 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200'
              }`}
            >
              {isIncome ? 'Ingreso' : 'Gasto'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatShortDate(item.date, true)}</span>
          </div>

          <p className={`mt-2 text-2xl font-extrabold ${isIncome ? 'text-primary-700 dark:text-primary-300' : 'text-accent-700 dark:text-accent-300'}`}>
            {formatCurrency(item.amount)}
          </p>
          <p className="text-gray-900 dark:text-gray-100 font-medium break-words">{item.description}</p>

          <label htmlFor={`batch-category-${index}`} className="block mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">
            Categoría
          </label>
          <select
            id={`batch-category-${index}`}
            className="select select-bordered select-sm w-full mt-1"
            value={item.categoryId}
            onChange={(e) => onCategoryChange(index, e.target.value)}
            onFocus={onCategoriesNeeded}
            disabled={busy}
          >
            <option value="">Selecciona una categoría</option>
            {typeCategories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          {!item.categoryId && item.suggestedCategory && (
            <button
              type="button"
              onClick={() => onCreateSuggested(index)}
              disabled={busy}
              className="mt-1 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline"
            >
              Crear la categoría «{item.suggestedCategory}»
            </button>
          )}

          {/* Save spans the card; edit and discard share the row below, so labels fit on narrow phones */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => onSave(index)}
              disabled={!item.categoryId}
              isLoading={busy}
              icon={<Save size={16} />}
              title={item.categoryId ? undefined : 'Elige una categoría para guardar'}
              className="col-span-2 justify-center"
            >
              Guardar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(index)} disabled={busy} icon={<Pencil size={14} />} className="justify-center">
              Editar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDiscard(index)} disabled={busy} icon={<Trash2 size={14} />} className="justify-center">
              Descartar
            </Button>
          </div>
        </article>

        <button
          type="button"
          onClick={() => next !== undefined && onIndexChange(next)}
          disabled={next === undefined || busy}
          aria-label="Transacción siguiente"
          className={`${items.length > 1 ? '' : 'hidden '}p-1 sm:p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={`justify-center gap-1.5 mt-3 ${items.length > 1 ? 'flex' : 'hidden'}`} aria-hidden="true">
        {items.map((entry, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? 'w-5 bg-primary-600'
                : entry.status === 'saved'
                  ? 'w-1.5 bg-primary-300'
                  : entry.status === 'discarded'
                    ? 'w-1.5 bg-gray-200 dark:bg-gray-700'
                    : 'w-1.5 bg-gray-400 dark:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {readyToSaveAll && (
        <div className="text-center mt-3">
          <button
            type="button"
            onClick={onSaveAll}
            disabled={busy}
            className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:underline disabled:opacity-50"
          >
            Guardar las {pending.length} que faltan
          </button>
        </div>
      )}
    </section>
    </div>
  );
};

export default VoiceBatchReview;
