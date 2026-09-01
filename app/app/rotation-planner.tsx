'use client';

import { CalendarRange, Check, Repeat2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { db } from './lib/db';
import { shiftName } from './lib/i18n';
import {
  type RotationPlan,
  type RotationUnit,
  type LanguageCode,
  type ShiftCode,
  type ShiftConfig,
} from './lib/domain';

type RotationPlannerProps = {
  plan: RotationPlan;
  shifts: ShiftConfig[];
  onClose: () => void;
  language: LanguageCode;
};

const ROTATION_COPY = {
  en: { automatic: 'Automatic planning', title: 'Shift rotation', helper: 'Create a repeating plan for your diary.', show: 'Show planned shifts', keep: 'Keep the rotation visible in your diary', starts: 'Plan starts', change: 'Change shift every', week: 'Week', day: 'Day', sequence: 'Repeating sequence', sequenceHelp: 'After the last step, Sentrio starts again from step one.', repeats: 'Repeats', cancel: 'Cancel', save: 'Save rotation', saving: 'Saving…', error: 'The rotation plan could not be saved. Please try again.', close: 'Close rotation planner', shift: 'Shift' },
  mr: { automatic: 'आपोआप नियोजन', title: 'पाळी चक्र', helper: 'दैनंदिनीसाठी पुन्हा पुन्हा चालणारे पाळी नियोजन तयार करा.', show: 'नियोजित पाळ्या दाखवा', keep: 'पाळी चक्र दैनंदिनीत दिसू द्या', starts: 'योजनेची सुरुवात', change: 'पाळी बदलण्याचा कालावधी', week: 'आठवडा', day: 'दिवस', sequence: 'पुन्हा चालणारा क्रम', sequenceHelp: 'शेवटच्या टप्प्यानंतर Sentrio पुन्हा पहिल्या टप्प्यापासून सुरू होते.', repeats: 'पुन्हा', cancel: 'रद्द करा', save: 'पाळी चक्र जतन करा', saving: 'जतन करत आहे…', error: 'पाळी चक्र जतन झाले नाही. पुन्हा प्रयत्न करा.', close: 'पाळी चक्र बंद करा', shift: 'पाळी' },
} as const;

export function RotationPlanner({ plan, shifts, onClose, language }: RotationPlannerProps) {
  const text = ROTATION_COPY[language];
  const [enabled, setEnabled] = useState(plan.enabled);
  const [startDate, setStartDate] = useState(plan.startDate);
  const [rotationUnit, setRotationUnit] = useState<RotationUnit>(plan.rotationUnit);
  const [sequence, setSequence] = useState<ShiftCode[]>(plan.sequence);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function updateSequence(index: number, value: ShiftCode) {
    setSequence((current) =>
      current.map((shift, position) => (position === index ? value : shift)),
    );
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await db.rotationPlans.put({
        ...plan,
        enabled,
        startDate,
        rotationUnit,
        sequence,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      setError(text.error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="attendance-sheet rotation-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <div>
            <span className="eyebrow">{text.automatic}</span>
            <h2 id="rotation-title">{text.title}</h2>
            <p>{text.helper}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={text.close}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={savePlan}>
          <label className="rotation-toggle">
            <span><Repeat2 size={18} /><span><strong>{text.show}</strong><small>{text.keep}</small></span></span>
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          </label>

          <div className="planner-field-row">
            <label>
              <span><CalendarRange size={15} /> {text.starts}</span>
              <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <fieldset className="rotation-unit">
              <legend>{text.change}</legend>
              <div>
                <button className={rotationUnit === 'WEEKLY' ? 'selected' : ''} type="button" onClick={() => setRotationUnit('WEEKLY')}>{text.week}</button>
                <button className={rotationUnit === 'DAILY' ? 'selected' : ''} type="button" onClick={() => setRotationUnit('DAILY')}>{text.day}</button>
              </div>
            </fieldset>
          </div>

          <fieldset className="sequence-fieldset">
            <legend>{text.sequence}</legend>
            <p>{text.sequenceHelp}</p>
            <div className="sequence-list">
              {sequence.map((shiftCode, index) => (
                <label key={`${index}-${shiftCode}`}>
                  <span>{rotationUnit === 'WEEKLY' ? `${text.week} ${index + 1}` : `${text.day} ${index + 1}`}</span>
                  <select value={shiftCode} onChange={(event) => updateSequence(index, event.target.value as ShiftCode)}>
                    {shifts.filter((shift) => shift.enabled).map((shift) => (
                      <option key={shift.code} value={shift.code}>{text.shift} {shift.code} · {shiftName(language, shift.code, shift.name)}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rotation-preview">
            <span>{text.repeats}</span>
            <div>{sequence.map((shift, index) => <span key={`${shift}-${index}`}>{shift}</span>)}</div>
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="sheet-actions">
            <button className="secondary-action" type="button" onClick={onClose}>{text.cancel}</button>
            <button className="save-action" type="submit" disabled={isSaving}>
              <Check size={18} />{isSaving ? text.saving : text.save}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
