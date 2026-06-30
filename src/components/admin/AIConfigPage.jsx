import React, { useState } from 'react';
import { MdArrowBack, MdOutlineSmartToy, MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlineWarningAmber, MdOutlineSync, MdOutlineHistory, MdOutlineSend, MdOutlineClose, MdOutlineSave } from 'react-icons/md';

// --- Ponytail Mini Helper Components ---
const Card = ({ title, icon: Icon, children, headerBadge }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eef0f3', padding: '24px' }}>
    {title && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {Icon && <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#1b6eff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><Icon /></div>}
          <div><h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#111322' }}>{title}</h3></div>
        </div>
        {headerBadge}
      </div>
    )}
    {children}
  </div>
);

const FormGroup = ({ label, children }) => (
  <div style={{ width: '100%' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6278', marginBottom: '8px' }}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', color: '#111322', outline: 'none', backgroundColor: props.disabled ? '#f8fafc' : '#fff', ...props.style }} />
);

const Select = ({ options, ...props }) => (
  <select {...props} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', color: '#111322', outline: 'none', backgroundColor: '#fff', ...props.style }}>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const Button = ({ children, primary, icon: Icon, onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: primary ? 'none' : '1px solid #eef0f3', borderRadius: '6px', backgroundColor: primary ? '#1b6eff' : '#fff', color: primary ? '#fff' : '#111322', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', opacity: disabled ? 0.7 : 1, ...style }}>
    {Icon && <Icon />} {children}
  </button>
);

const ParameterSlider = ({ label, value, min, max, step, defaultValue }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#5e6278' }}>{label}</span>
      <span style={{ backgroundColor: '#1b6eff', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{defaultValue}</span>
    </div>
    <input type="range" min={min} max={max} step={step} defaultValue={defaultValue} style={{ width: '100%', cursor: 'pointer' }} />
  </div>
);

// --- Main Page Component ---
const AIConfigPage = () => {
  const [env, setEnv] = useState('Production');
  const [provider, setProvider] = useState('OpenAI');
  const [activeModel, setActiveModel] = useState('GPT-4o');
  
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  const [showKey, setShowKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState('');

  const providers = ['OpenAI', 'Azure OpenAI', 'Anthropic', 'Gemini', 'Local Model'];
  const models = {
    'OpenAI': ['GPT-4o', 'GPT-4 Turbo', 'GPT-3.5 Turbo'],
    'Anthropic': ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'],
    'Gemini': ['Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
    'Azure OpenAI': ['GPT-4o (Azure)', 'GPT-3.5 Turbo (Azure)'],
    'Local Model': ['Llama 3 (8B)', 'Mistral 7B']
  };

  const handleModelChangeRequest = (e) => {
    const newModel = e.target.value;
    if (newModel !== activeModel) { setPendingChanges({ type: 'model', from: activeModel, to: newModel }); setShowModal(true); }
  };

  const handleProviderChangeRequest = (e) => {
    const newProvider = e.target.value;
    if (newProvider !== provider) {
      setPendingChanges({ type: 'provider', from: provider, to: newProvider, defaultModel: models[newProvider][0] });
      setShowModal(true);
    }
  };

  const confirmChange = () => {
    if (pendingChanges.type === 'model') setActiveModel(pendingChanges.to);
    else if (pendingChanges.type === 'provider') { setProvider(pendingChanges.to); setActiveModel(pendingChanges.defaultModel); }
    setShowModal(false); setPendingChanges(null);
  };

  const simulateTest = () => {
    setIsTesting(true); setTestResponse('');
    setTimeout(() => { setIsTesting(false); setTestResponse('Simulated response successful.'); }, 1000);
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#5e6278', textTransform: 'uppercase', marginBottom: '16px' }}>
            <MdArrowBack style={{ fontSize: '16px', cursor: 'pointer' }} /> <span>Dashboard</span> &gt; <span style={{ color: '#111322' }}>AI Configuration</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>AI Configuration</h2>
          <p style={{ margin: 0, color: '#5e6278', fontSize: '14px' }}>Configure your active language model, connectivity, and parameters. <span style={{ color: '#ef4444', fontWeight: '600' }}>Super Admin access only.</span></p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button icon={MdOutlineHistory}>Rollback</Button>
          <Button style={{ backgroundColor: '#f8fafc' }}>Save Draft</Button>
          <Button primary icon={MdOutlineSave}>Save Configuration</Button>
        </div>
      </div>

      {/* Top Selectors */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eef0f3' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#787a91', marginBottom: '6px', textTransform: 'uppercase' }}>Target Environment</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Development', 'Staging', 'Production'].map(e => (
              <button key={e} onClick={() => setEnv(e)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: env === e ? '#111322' : '#f3f5f9', color: env === e ? '#fff' : '#5e6278' }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#787a91', marginBottom: '6px', textTransform: 'uppercase' }}>AI Provider</label>
          <select value={provider} onChange={handleProviderChangeRequest} style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #eef0f3', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', fontWeight: '500' }}>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card title="Model Architecture" icon={MdOutlineSmartToy} headerBadge={<span style={{ backgroundColor: '#dcfce7', color: '#10b981', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></div> ACTIVE</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <FormGroup label="Active LLM Instance"><Select value={activeModel} onChange={handleModelChangeRequest} options={models[provider] || []} /></FormGroup>
              <FormGroup label="API Endpoint URL"><Input defaultValue="https://api.openai.com/v1/chat/completions" disabled /></FormGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <FormGroup label="Secret API Key (Auto-encrypted)">
                  <Input type={showKey ? 'text' : 'password'} defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                  <div onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: '12px', top: '34px', color: '#9093a3', cursor: 'pointer', fontSize: '18px' }}>
                    {showKey ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                  </div>
                </FormGroup>
              </div>
              <FormGroup label="Fallback Model (Auto-switch on fail)"><Select options={['GPT-3.5 Turbo', 'Claude 3 Haiku', 'None']} /></FormGroup>
            </div>
          </Card>

          <Card title="Network & Reliability Policies">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormGroup label="Rate Limit (Req/min)"><Input type="number" defaultValue={500} /></FormGroup>
              <FormGroup label="Retry Policy (Max Attempts)"><Input type="number" defaultValue={3} /></FormGroup>
              <FormGroup label="Timeout (ms)"><Input type="number" defaultValue={30000} /></FormGroup>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <MdOutlineSync style={{ fontSize: '20px', color: '#1b6eff' }} /><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Generation Parameters</h3>
            </div>
            <ParameterSlider label="Temperature (Creativity)" min="0" max="2" step="0.1" defaultValue="0.7" />
            <ParameterSlider label="Max Output Tokens" min="256" max="128000" step="256" defaultValue="4096" />
            <ParameterSlider label="Top-P (Nucleus Sampling)" min="0" max="1" step="0.05" defaultValue="0.9" />
          </Card>

          <Card title="Test Connection & Playground">
            <div style={{ display: 'flex', gap: '12px' }}>
              <Input placeholder="Enter a prompt to test the current configuration..." value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} />
              <Button onClick={simulateTest} disabled={!testPrompt || isTesting} icon={isTesting ? null : MdOutlineSend} style={{ backgroundColor: '#111322', color: '#fff' }}>
                {isTesting ? 'Sending...' : 'Send'}
              </Button>
            </div>
            {testResponse && <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderLeft: '4px solid #10b981', borderRadius: '4px', fontSize: '14px', color: '#334155' }}>{testResponse}</div>}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#111322', borderRadius: '12px', padding: '24px', color: '#fff' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '600' }}>Integration Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9093a3' }}>Gateway Response</span><span style={{ color: '#10b981', fontWeight: '600' }}>✓ 124ms</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9093a3' }}>SSL Certificate</span><span style={{ color: '#10b981', fontWeight: '600' }}>Valid (320d)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9093a3' }}>Last Health Check</span><span>2 mins ago</span></div>
            </div>
            <button style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#111322', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><MdOutlineSync style={{ fontSize: '18px' }} /> Test Connection</button>
          </div>

          <Card title="Usage & Quotas">
            {[{ label: 'MONTHLY API SPEND', val: '$1,240 / $2,500', pct: '49.6%', color: '#1b6eff' }, { label: 'TOKEN THROUGHPUT', val: '1.2M / 2.0M', pct: '60%', color: '#10b981' }].map((q, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#5e6278' }}><span>{q.label}</span><span style={{ color: '#111322' }}>{q.val}</span></div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}><div style={{ width: q.pct, height: '100%', backgroundColor: q.color }}></div></div>
              </div>
            ))}
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
              <MdOutlineWarningAmber style={{ color: '#ef4444', fontSize: '20px' }} />
              <div style={{ fontSize: '12px', color: '#991b1b' }}>Usage is 15% higher than last month. Consider reviewing high-token tasks.</div>
            </div>
          </Card>

          {(activeModel.includes('GPT-4') || activeModel.includes('Opus')) && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px', display: 'flex', gap: '12px' }}>
              <MdOutlineWarningAmber style={{ color: '#d97706', fontSize: '24px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#92400e' }}>High-Cost Model Selected</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#b45309' }}>{activeModel} is significantly more expensive than standard models.</p>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#020617', borderRadius: '12px', padding: '24px', color: '#fff', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'radial-gradient(circle at top left, rgba(14,165,233,0.15) 0%, #020617 70%)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>Performance Analysis</h3>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>View detailed latency logs &gt;</div>
          </div>
        </div>
      </div>

      {showModal && pendingChanges && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Confirm Change</h3>
              <MdOutlineClose style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>Affecting all upcoming inference requests in <strong>{env}</strong>.</p>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', marginBottom: '24px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>From:</span><span style={{ color: '#ef4444', fontWeight: '600' }}>{pendingChanges.from}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>To:</span><span style={{ color: '#10b981', fontWeight: '600' }}>{pendingChanges.to}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button primary onClick={confirmChange}>Confirm Change</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfigPage;
