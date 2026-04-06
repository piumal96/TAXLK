import { useEffect, useId, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  formatAssessmentPeriodLabel,
  parseAssessmentYearLabel,
  TAX_ASSESSMENT_YEAR,
} from '@/lib/taxCalculator';

const PRESET_YEARS = ['2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];

type Variant = 'default' | 'onDark';

export function AssessmentYearSelector({
  className,
  variant = 'default',
  showPeriod = true,
  readOnly = false,
}: {
  className?: string;
  variant?: Variant;
  /** Show derived 1 Apr – 31 Mar line */
  showPeriod?: boolean;
  /** If true, show YoA from app state only (edit on Income Sources). */
  readOnly?: boolean;
}) {
  const { state, dispatch } = useAppContext();
  const effective = parseAssessmentYearLabel(state.assessmentYear) ?? TAX_ASSESSMENT_YEAR;
  const [draft, setDraft] = useState(state.assessmentYear);
  const listId = useId();

  useEffect(() => {
    setDraft(state.assessmentYear);
  }, [state.assessmentYear]);

  const commit = () => {
    const parsed = parseAssessmentYearLabel(draft);
    if (parsed) {
      dispatch({ type: 'SET_ASSESSMENT_YEAR', payload: parsed });
      setDraft(parsed);
    } else {
      setDraft(effective);
    }
  };

  const periodPreview = formatAssessmentPeriodLabel(parseAssessmentYearLabel(draft) ?? effective);
  const periodReadOnly = formatAssessmentPeriodLabel(effective);

  const onDark = variant === 'onDark';

  if (readOnly) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <p className={cn('text-sm font-medium', onDark ? 'text-white/90' : 'text-foreground')}>Year of Assessment</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={cn('font-mono text-base font-semibold tabular-nums', onDark ? 'text-white' : 'text-foreground')}>
            {effective}
          </span>
          {showPeriod && periodReadOnly && (
            <span className={cn('text-sm', onDark ? 'text-white/65' : 'text-muted-foreground')}>{periodReadOnly}</span>
          )}
        </div>
        <p className={cn('text-xs', onDark ? 'text-white/45' : 'text-muted-foreground')}>
          Set on the <span className="font-medium text-foreground/80">Income Sources</span> page.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 min-w-[10rem]">
          <Label
            htmlFor="assessment-year-input"
            className={cn(onDark ? 'text-white/80' : undefined)}
          >
            Year of Assessment
          </Label>
          <Input
            id="assessment-year-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            list={listId}
            placeholder="2024/2025"
            maxLength={9}
            className={cn(
              'font-mono text-sm w-36',
              onDark && 'bg-white/10 border-white/25 text-white placeholder:text-white/40',
            )}
            aria-invalid={draft.trim() !== '' && !parseAssessmentYearLabel(draft)}
          />
          <datalist id={listId}>
            {PRESET_YEARS.map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>
        </div>
        {showPeriod && periodPreview && (
          <p
            className={cn(
              'text-xs pb-0.5',
              onDark ? 'text-white/60' : 'text-muted-foreground',
            )}
          >
            {periodPreview}
          </p>
        )}
      </div>
      <p className={cn('text-[11px] leading-snug', onDark ? 'text-white/45' : 'text-muted-foreground')}>
        Format <span className="font-mono">YYYY/YYYY</span>. Used across Income, Calculator, and Tax Return. Suggestions
        appear as you type.
      </p>
    </div>
  );
}
