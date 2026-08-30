'use client';

import { CalendarRange, Check, Repeat2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { db } from './lib/db';
import {
  type RotationPlan,
  type RotationUnit,
  type ShiftCode,
  type ShiftConfig,
} from './lib/domain';

type RotationPlannerProps = {
  plan: RotationPlan;
  shifts: ShiftConfig[];
  onClose: () => void;
};

export function RotationPlanner({ plan, shifts, onClose }: RotationPlannerProps) {
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
      setError('The rotation plan could not be saved. Please try again.');
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
            <span className="eyebrow">Automatic planning</span>
            <h2 id="rotation-title">Shift rotation</h2>
            <p>Create a repeating plan for your diary.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close rotation planner">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={savePlan}>
          <label className="rotation-toggle">
            <span><Repeat2 size={18} /><span><strong>Show planned shifts</strong><small>Keep the rotation visible in your diary</small></span></span>
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          </label>

          <div className="planner-field-row">
            <label>
              <span><CalendarRange size={15} /> Plan starts</span>
              <input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <fieldset className="rotation-unit">
              <legend>Change shift every</legend>
              <div>
                <button className={rotationUnit === 'WEEKLY' ? 'selected' : ''} type="button" onClick={() => setRotationUnit('WEEKLY')}>Week</button>
                <button className={rotationUnit === 'DAILY' ? 'selected' : ''} type="button" onClick={() => setRotationUnit('DAILY')}>Day</button>
              </div>
            </fieldset>
          </div>

          <fieldset className="sequence-fieldset">
            <legend>Repeating sequence</legend>
            <p>After the last step, Sentrio starts again from step one.</p>
            <div className="sequence-list">
              {sequence.map((shiftCode, index) => (
                <label key={`${index}-${shiftCode}`}>
                  <span>{rotationUnit === 'WEEKLY' ? `Week ${index + 1}` : `Day ${index + 1}`}</span>
                  <select value={shiftCode} onChange={(event) => updateSequence(index, event.target.value as ShiftCode)}>
                    {shifts.filter((shift) => shift.enabled).map((shift) => (
                      <option key={shift.code} value={shift.code}>Shift {shift.code} · {shift.name}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rotation-preview">
            <span>Repeats</span>
            <div>{sequence.map((shift, index) => <span key={`${shift}-${index}`}>{shift}</span>)}</div>
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="sheet-actions">
            <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
            <button className="save-action" type="submit" disabled={isSaving}>
              <Check size={18} />{isSaving ? 'Saving…' : 'Save rotation'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
