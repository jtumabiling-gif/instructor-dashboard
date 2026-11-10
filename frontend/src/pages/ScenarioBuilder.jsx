import { useState } from 'react';
import { AlertTriangle, Anchor, CloudLightning, Sun, Moon, Ship, SlidersHorizontal, Rocket } from 'lucide-react';

const WEATHER_PRESETS = [
  { value: 'Nominal', color: 'safe' },
  { value: 'Deteriorating', color: 'warning' },
  { value: 'Cyclone Imminent', color: 'critical' },
];

const ScenarioBuilder = ({ onDeploy }) => {
  const [name, setName] = useState('New Vessel Simulation Scenario');
  const [isSaving, setIsSaving] = useState(false);
  const [weather, setWeather] = useState('Nominal');
  const [fogDensity, setFogDensity] = useState(20);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [trafficDensity, setTrafficDensity] = useState(8);
  const [hazardX, setHazardX] = useState(120);
  const [hazardZ, setHazardZ] = useState(-240);
  const [timeLimit, setTimeLimit] = useState(5);
  const [minimumHullHealth, setMinimumHullHealth] = useState(80);
  const [maxBreakwaterSpeed, setMaxBreakwaterSpeed] = useState(5);

  const deploy = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    await onDeploy({
      name: name.trim(),
      weather,
      fog_density: Number(fogDensity),
      time_of_day: timeOfDay,
      traffic_density: Number(trafficDensity),
      hazard_x: Number(hazardX),
      hazard_z: Number(hazardZ),
      time_limit_minutes: Number(timeLimit),
      minimum_hull_health: Number(minimumHullHealth),
      max_breakwater_speed: Number(maxBreakwaterSpeed),
    });
    setIsSaving(false);
  };

  return (
    <form className="instructor-scenario-form" onSubmit={deploy}>
      <div className="scenario-title-field instructor-panel">
        <label className="scenario-input-field"><span>SCENARIO NAME</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={160} required /></label>
        <span className="instructor-status status-draft">Ready to deploy</span>
      </div>
      <div className="instructor-scenario-grid">
        <section className="instructor-panel scenario-config-panel">
          <div className="instructor-section-head">
            <div><p className="instructor-eyebrow">ENVIRONMENT</p><h2>Weather &amp; conditions</h2></div>
            <CloudLightning size={18} />
          </div>
          <label className="scenario-label">WEATHER PRESET</label>
          <div className="scenario-weather-options" role="group" aria-label="Weather preset">
            {WEATHER_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.value}
                className={`scenario-weather-option ${preset.color} ${weather === preset.value ? 'selected' : ''}`}
                aria-pressed={weather === preset.value}
                onClick={() => setWeather(preset.value)}
              >
                {preset.value}
              </button>
            ))}
          </div>
          <label className="scenario-range-field">
            <span><span>Fog density</span><strong>{fogDensity}%</strong></span>
            <input type="range" min="0" max="100" step="5" value={fogDensity} onChange={(event) => setFogDensity(Number(event.target.value))} />
          </label>
          <div className="scenario-time-toggle">
            <span className="scenario-label">TIME OF DAY</span>
            <div role="group" aria-label="Time of day">
              <button type="button" className={timeOfDay === 'Day' ? 'selected' : ''} onClick={() => setTimeOfDay('Day')} aria-pressed={timeOfDay === 'Day'}><Sun size={14} /> Day</button>
              <button type="button" className={timeOfDay === 'Night' ? 'selected' : ''} onClick={() => setTimeOfDay('Night')} aria-pressed={timeOfDay === 'Night'}><Moon size={14} /> Night</button>
            </div>
          </div>
        </section>

        <section className="instructor-panel scenario-config-panel">
          <div className="instructor-section-head">
            <div><p className="instructor-eyebrow">TRAFFIC &amp; HAZARDS</p><h2>Simulation setup</h2></div>
            <Ship size={18} />
          </div>
          <label className="scenario-input-field">
            <span>AI vessel traffic density</span>
            <span className="scenario-input-with-unit"><input type="number" min="0" max="50" value={trafficDensity} onChange={(event) => setTrafficDensity(event.target.value)} /><small>VESSELS</small></span>
          </label>
          <div className="scenario-coordinate-block">
            <span className="scenario-label"><AlertTriangle size={13} /> SHALLOW WATER RING</span>
            <div className="scenario-coordinate-grid">
              <label className="scenario-input-field"><span>X COORDINATE</span><input type="number" value={hazardX} onChange={(event) => setHazardX(event.target.value)} /></label>
              <label className="scenario-input-field"><span>Z COORDINATE</span><input type="number" value={hazardZ} onChange={(event) => setHazardZ(event.target.value)} /></label>
            </div>
          </div>
          <p className="scenario-field-note"><Anchor size={13} /> Coordinates are simulation-world X/Z positions.</p>
        </section>

        <section className="instructor-panel scenario-config-panel scenario-assessment-panel">
          <div className="instructor-section-head">
            <div><p className="instructor-eyebrow">PASS / FAIL CONDITIONS</p><h2>Assessment criteria</h2></div>
            <SlidersHorizontal size={18} />
          </div>
          <div className="scenario-criteria-grid">
            <label className="scenario-input-field">
              <span>Berthing time limit</span>
              <span className="scenario-input-with-unit"><input type="number" min="1" max="60" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} /><small>MIN</small></span>
            </label>
            <label className="scenario-input-field">
              <span>Minimum hull health</span>
              <span className="scenario-input-with-unit"><input type="number" min="1" max="100" value={minimumHullHealth} onChange={(event) => setMinimumHullHealth(event.target.value)} /><small>%</small></span>
            </label>
            <label className="scenario-input-field">
              <span>Max speed inside breakwater</span>
              <span className="scenario-input-with-unit"><input type="number" min="1" max="20" value={maxBreakwaterSpeed} onChange={(event) => setMaxBreakwaterSpeed(event.target.value)} /><small>KTS</small></span>
            </label>
          </div>
          <p className="scenario-field-note">Fail if time or speed limits are exceeded, or hull health falls below its threshold.</p>
        </section>
      </div>
      <div className="scenario-deploy-row">
        <span>Scenario settings will be saved to the instructor workspace.</span>
        <button className="instructor-button primary scenario-deploy-button" type="submit" disabled={isSaving}><Rocket size={16} /> {isSaving ? 'Deploying…' : 'Deploy Scenario'}</button>
      </div>
    </form>
  );
};

export default ScenarioBuilder;
