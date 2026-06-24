import { useState, useEffect } from 'react';
import { loadTheme, saveTheme, applyTheme, resetTheme, DEFAULT_THEME } from '../utils/themeStorage';
import type { ThemeColors } from '../utils/themeStorage';
import { Button } from './ui/button';
import { Palette, RotateCcw } from 'lucide-react';

type ThemeKey = keyof ThemeColors;

const LABELS: Record<ThemeKey, string> = {
  accent: 'Cor de destaque',
  accent2: 'Destaque secundário',
  bg: 'Fundo',
  bgSoft: 'Fundo suave',
  card: 'Cartão',
  cardStrong: 'Cartão forte',
  line: 'Linhas',
  text: 'Texto',
  muted: 'Texto suave',
  muted2: 'Texto apagado',
  danger: 'Perigo',
  warning: 'Aviso',
  cyan: 'Ciano',
};

const GROUPS: Array<{ label: string; keys: ThemeKey[] }> = [
  { label: 'Destaque', keys: ['accent', 'accent2'] },
  { label: 'Fundo', keys: ['bg', 'bgSoft'] },
  { label: 'Cartões', keys: ['card', 'cardStrong', 'line'] },
  { label: 'Texto', keys: ['text', 'muted', 'muted2'] },
  { label: 'Semântica', keys: ['danger', 'warning', 'cyan'] },
];

export default function ThemeCustomizer() {
  const [colors, setColors] = useState<ThemeColors>(loadTheme);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    applyTheme(colors);
  }, [colors]);

  const update = (key: ThemeKey, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveTheme(colors);
    applyTheme(colors);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetTheme();
    setColors({ ...DEFAULT_THEME });
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <div className="card-heading">
        <span className="icon-pill" aria-hidden="true"><Palette size={20} /></span>
        <h2>Cores do Sistema</h2>
      </div>

      <p style={{ color: 'var(--muted-2)', fontSize: '13px', marginBottom: '20px' }}>
        Personaliza as cores do painel administrativo e da landing page. As alterações são aplicadas em tempo real e salvas no navegador.
      </p>

      <div className="stack-form">
        {GROUPS.map(group => (
          <div key={group.label}>
            <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: 'var(--muted)' }}>{group.label}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {group.keys.map(key => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted-2)' }}>{LABELS[key]}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={e => update(key, e.target.value)}
                      style={{
                        width: '32px', height: '32px', padding: '2px',
                        borderRadius: '8px', border: '2px solid var(--line)',
                        background: 'transparent', cursor: 'pointer', flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={e => update(key, e.target.value)}
                      style={{
                        flex: 1, padding: '6px 8px', borderRadius: '8px',
                        border: '1px solid var(--line)', background: 'var(--bg)',
                        color: 'var(--text)', fontSize: '12px', fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
        <Button onClick={handleSave}>
          {saved ? '✓ Salvo' : 'Salvar cores'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw size={16} /> Restaurar padrão
        </Button>
      </div>

      <div
        style={{
          marginTop: '20px', padding: '16px', borderRadius: '14px',
          background: 'var(--card)', border: '1px solid var(--line)',
        }}
      >
        <p style={{ fontSize: '12px', color: 'var(--muted-2)', marginBottom: '8px' }}>Preview:</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '12px' }}>Botão</span>
          <span style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--line)', color: 'var(--text)', fontSize: '12px' }}>Secundário</span>
          <span style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--danger)', color: '#fff', fontWeight: 600, fontSize: '12px' }}>Erro</span>
          <span style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--warning)', color: '#000', fontWeight: 600, fontSize: '12px' }}>Aviso</span>
        </div>
      </div>
    </div>
  );
}
