import type { BoardSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: BoardSettings;
  onUpdate: <K extends keyof BoardSettings>(key: K, value: BoardSettings[K]) => void;
  onReset: () => void;
  open: boolean;
  onToggle: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="sp-row">
      <span className="sp-label">{label}</span>
      <div className="sp-slider-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span className="sp-value">{value}{unit}</span>
      </div>
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="sp-row">
      <span className="sp-label">{label}</span>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="sp-color"
      />
    </label>
  );
}

export function SettingsPanel({ settings, onUpdate, onReset, open, onToggle }: SettingsPanelProps) {
  return (
    <>
      <button className="sp-toggle" onClick={onToggle} title="Personnaliser">
        {open ? '✕' : '⚙'}
      </button>

      <div className={`settings-panel${open ? ' open' : ''}`}>
        <div className="sp-header">
          <h2>Personnalisation</h2>
          <button className="sp-reset" onClick={onReset}>Reset</button>
        </div>

        <div className="sp-section">
          <h3>Thème & couleurs</h3>
          <ColorRow
            label="Fond"
            value={settings.bgColor}
            onChange={v => onUpdate('bgColor', v)}
          />
          <ColorRow
            label="Tags"
            value={settings.tagColor}
            onChange={v => onUpdate('tagColor', v)}
          />
          <SliderRow
            label="Opacité annotations"
            value={settings.annotationOpacity}
            min={0} max={1} step={0.05}
            onChange={v => onUpdate('annotationOpacity', v)}
          />
        </div>

        <div className="sp-section">
          <h3>Layout</h3>
          <SliderRow
            label="Espacement"
            value={settings.gap}
            min={0} max={20} step={1}
            onChange={v => onUpdate('gap', v)}
            unit="px"
          />
          <SliderRow
            label="Arrondi"
            value={settings.borderRadius}
            min={0} max={16} step={1}
            onChange={v => onUpdate('borderRadius', v)}
            unit="px"
          />

          <label className="sp-row">
            <span className="sp-label">Colonnes</span>
            <div className="sp-cols">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  className={settings.columns === n ? 'active' : ''}
                  onClick={() => onUpdate('columns', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="sp-section">
          <h3>Filtres image</h3>
          <SliderRow
            label="Luminosité"
            value={settings.brightness}
            min={0.3} max={1.5} step={0.02}
            onChange={v => onUpdate('brightness', v)}
          />
          <SliderRow
            label="Contraste"
            value={settings.contrast}
            min={0.5} max={1.5} step={0.02}
            onChange={v => onUpdate('contrast', v)}
          />
          <SliderRow
            label="Saturation"
            value={settings.saturation}
            min={0} max={1.5} step={0.02}
            onChange={v => onUpdate('saturation', v)}
          />
          <button
            className="sp-reset-filters"
            onClick={() => {
              onUpdate('brightness', DEFAULT_SETTINGS.brightness);
              onUpdate('contrast', DEFAULT_SETTINGS.contrast);
              onUpdate('saturation', DEFAULT_SETTINGS.saturation);
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </>
  );
}
