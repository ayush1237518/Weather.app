/* ============================================================
   WeatherX Pro — app.js
   Weather fetching + animated background engine
   ============================================================ */

/* ── WEATHER CODE LABELS ── */
const WC = {
  0:"Clear sky", 1:"Mainly clear", 2:"Partly cloudy", 3:"Overcast",
  45:"Foggy", 48:"Rime fog",
  51:"Light drizzle", 53:"Drizzle", 55:"Dense drizzle",
  61:"Slight rain", 63:"Moderate rain", 65:"Heavy rain",
  71:"Slight snow", 73:"Moderate snow", 75:"Heavy snow",
  80:"Rain showers", 81:"Rain showers", 82:"Violent showers",
  95:"Thunderstorm", 96:"Thunderstorm + hail", 99:"Thunderstorm + hail"
};
function wLabel(c) { return WC[c] || "Unknown"; }

/* ── MAP CODE → THEME KEY ── */
function wClass(code, day) {
  if ([95,96,99].includes(code))             return "storm";
  if ([71,73,75].includes(code))             return "snow";
  if ([45,48].includes(code))                return "fog";
  if ([61,63,65,51,53,55,80,81,82].includes(code)) return "rain";
  if (code === 3)                            return "cloudy";
  if (code === 2)                            return "pcloud";
  if ([0,1].includes(code))                 return day ? "cday" : "cnight";
  return "def";
}

/* ── THEME DEFINITIONS ── */
const T = {
  cday: {
    from:"#000000", mid:"#1e3c72", to:"#2a5298",
    tc:"#ffd166", tg:"rgba(255,200,0,.65)",
    stars:0, aurora:0, moon:0, clouds:0, fog:0, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:28, c:"rgba(255,240,180,.65)", mn:1, mx:3 }
  },
  cnight: {
    from:"#000000", mid:"#0d1520", to:"#000000",
    tc:"#7ec8ff", tg:"rgba(0,150,255,.55)",
    stars:1, aurora:1, moon:1, clouds:0, fog:0, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:0 }
  },
  pcloud: {
    from:"#111111", mid:"#1d2a3a", to:"#2c3e50",
    tc:"#a8b8c8", tg:"rgba(150,180,200,.4)",
    stars:0, aurora:0, moon:0, clouds:.42, fog:0, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:10, c:"rgba(200,220,240,.35)", mn:2, mx:8 }
  },
  cloudy: {
    from:"#0f2027", mid:"#1c3040", to:"#2c5364",
    tc:"#8aa0b0", tg:"rgba(100,140,170,.4)",
    stars:0, aurora:0, moon:0, clouds:.72, fog:.22, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:0 }
  },
  rain: {
    from:"#000428", mid:"#00254a", to:"#004e92",
    tc:"#74b9ff", tg:"rgba(0,100,200,.55)",
    stars:0, aurora:0, moon:0, clouds:.5, fog:0, rain:1, snow:0, storm:false, glass:true,
    pts:{ n:0 }
  },
  storm: {
    from:"#000000", mid:"#0c0c0c", to:"#232526",
    tc:"#dce0e0", tg:"rgba(200,220,220,.4)",
    stars:0, aurora:0, moon:0, clouds:.65, fog:0, rain:1, snow:0, storm:true, glass:true,
    pts:{ n:0 }
  },
  snow: {
    from:"#0f2027", mid:"#284060", to:"#4b79a1",
    tc:"#c8e8ff", tg:"rgba(200,230,255,.45)",
    stars:.35, aurora:0, moon:0, clouds:.32, fog:.12, rain:0, snow:1, storm:false, glass:false,
    pts:{ n:0 }
  },
  fog: {
    from:"#232526", mid:"#2e3336", to:"#414345",
    tc:"#bec8d0", tg:"rgba(180,190,200,.32)",
    stars:0, aurora:0, moon:0, clouds:.22, fog:.85, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:0 }
  },
  def: {
    from:"#000", mid:"#0a0a0a", to:"#111",
    tc:"#aaa", tg:"rgba(150,150,150,.3)",
    stars:0, aurora:0, moon:0, clouds:0, fog:0, rain:0, snow:0, storm:false, glass:false,
    pts:{ n:0 }
  }
};

/* ── THEME ENGINE ── */
let curTheme = null, ltInt = null;

function setOp(id, v) { document.getElementById(id).style.opacity = v; }

function applyTheme(key, temp) {
  if (curTheme === key) return;
  curTheme = key;
  const t = T[key] || T.def;

  const bg = document.getElementById('bg-grad');
  bg.style.background = `linear-gradient(135deg, ${t.from} 0%, ${t.mid} 50%, ${t.to} 100%)`;
  bg.style.backgroundSize = '400% 400%';

  let bf = 1;
  if (temp != null) { if (temp > 35) bf = 1.1; else if (temp < 0) bf = .82; }
  bg.style.filter = `brightness(${bf})`;

  document.documentElement.style.setProperty('--c-temp', t.tc);
  document.documentElement.style.setProperty('--c-temp-glow', t.tg);

  setOp('ly-stars',  t.stars);
  setOp('ly-aurora', t.aurora);
  document.getElementById('moon').style.opacity = t.moon;

  buildClouds(t.clouds);
  buildFog(t.fog);
  buildRain(t.rain, t.glass);
  buildSnow(t.snow);
  buildPts(t.pts);

  if (ltInt) { clearTimeout(ltInt); ltInt = null; }
  if (t.storm) startLightning();
}

/* ── BACKGROUND BUILDERS ── */
function buildStars() {
  const l = document.getElementById('ly-stars');
  l.innerHTML = '';
  for (let i = 0; i < 160; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.2 + .4;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--td:${2+Math.random()*4.5}s;--tdd:${Math.random()*6}s`;
    l.appendChild(s);
  }
}

function buildClouds(op) {
  const l = document.getElementById('ly-clouds');
  l.innerHTML = ''; l.style.opacity = op;
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('div');
    c.className = 'cloud-el';
    const w = 160 + Math.random()*300, h = 65 + Math.random()*110;
    const d = 26 + Math.random()*55,   tp = Math.random()*58;
    const g = Math.floor(95 + Math.random()*75);
    c.style.cssText = `width:${w}px;height:${h}px;top:${tp}%;background:rgba(${g},${g},${g+12},.16);--cd:${d}s;--cdd:${-Math.random()*d}s`;
    l.appendChild(c);
  }
}

function buildFog(op) {
  const l = document.getElementById('ly-fog');
  l.innerHTML = ''; l.style.opacity = op;
  for (let i = 0; i < 7; i++) {
    const f = document.createElement('div');
    f.className = 'fog-b';
    f.style.cssText = `top:${6+i*13}%;height:${50+Math.random()*80}px;opacity:${.32+Math.random()*.45};--fd:${12+Math.random()*20}s;--fdd:${-Math.random()*22}s`;
    l.appendChild(f);
  }
}

function buildRain(op, glass) {
  const l = document.getElementById('ly-rain');
  l.innerHTML = ''; l.style.opacity = op;
  for (let i = 0; i < 130; i++) {
    const r = document.createElement('div');
    r.className = 'rd';
    const h = 9 + Math.random()*20, d = .45 + Math.random()*.7;
    r.style.cssText = `left:${Math.random()*112-6}%;top:${-22+Math.random()*32}px;height:${h}px;--rdd:${d}s;--rddd:${-Math.random()*d}s`;
    l.appendChild(r);
  }
  // Glass drops (raindrops on screen effect)
  const pl = document.getElementById('ly-particles');
  pl.innerHTML = '';
  if (glass) {
    for (let i = 0; i < 35; i++) {
      const g = document.createElement('div');
      g.className = 'gd';
      const w = 3 + Math.random()*4, h = 5 + Math.random()*9, d = 3 + Math.random()*4.5;
      g.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*80}%;width:${w}px;height:${h}px;--gdd:${d}s;--gddd:${-Math.random()*d}s`;
      pl.appendChild(g);
    }
  }
}

function buildSnow(op) {
  const l = document.getElementById('ly-snow');
  l.innerHTML = ''; l.style.opacity = op;
  for (let i = 0; i < 85; i++) {
    const s = document.createElement('div');
    s.className = 'sf';
    const sz = 2 + Math.random()*4.5, d = 5 + Math.random()*8;
    const dr = (Math.random() - .5) * 60;
    s.style.cssText = `left:${Math.random()*100}%;width:${sz}px;height:${sz}px;--sfd:${d}s;--sfdd:${-Math.random()*d}s;--sfdrift:${dr}px`;
    l.appendChild(s);
  }
}

function buildPts(cfg) {
  const l = document.getElementById('ly-particles');
  // Only clear & rebuild if not already used by glass drops
  if (!l.querySelector('.gd')) l.innerHTML = '';
  const n = cfg?.n || 0;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'pt';
    const sz = (cfg.mn || 1) + Math.random() * ((cfg.mx || 4) - (cfg.mn || 1));
    const d  = 6 + Math.random() * 7;
    p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;background:${cfg.c || 'rgba(255,255,255,.5)'};--ptd:${d}s;--ptdd:${-Math.random()*d}s`;
    l.appendChild(p);
  }
}

function startLightning() {
  const l = document.getElementById('ly-lightning');
  function flash() {
    if (Math.random() > .32) {
      l.style.opacity = '.82';
      setTimeout(() => {
        l.style.opacity = '0';
        setTimeout(() => {
          if (Math.random() > .48) {
            l.style.opacity = '.58';
            setTimeout(() => l.style.opacity = '0', 58);
          }
        }, 78);
      }, 72);
    }
    ltInt = setTimeout(flash, 2000 + Math.random() * 9000);
  }
  ltInt = setTimeout(flash, 1000 + Math.random() * 4500);
}

/* ── HELPERS ── */
function fmt(v, u, fb = "—") { return v != null && !Number.isNaN(+v) ? `${v}${u}` : fb; }

function localTime(iso, tz) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium", timeStyle: "short", timeZone: tz
  }).format(new Date(iso));
}

/* ── SEARCH ── */
const srchEl = document.getElementById('srch');
const sugEl  = document.getElementById('sug');
let activeCity = null, refTimer = null, srchTimer = null, srchAbort = null;

function showStatus(msg, type) {
  const s = document.getElementById('status');
  s.textContent = msg; s.className = 'status-bar ' + type; s.style.display = 'block';
}
function hideStatus() { document.getElementById('status').style.display = 'none'; }

srchEl.addEventListener('input', () => {
  clearTimeout(srchTimer);
  srchTimer = setTimeout(async () => {
    const q = srchEl.value.trim();
    if (q.length < 2) { sugEl.style.display = 'none'; return; }
    if (srchAbort) srchAbort.abort();
    srchAbort = new AbortController();
    try {
      const res  = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6`,
        { signal: srchAbort.signal }
      );
      const data = await res.json();
      sugEl.innerHTML = '';
      if (!data.results?.length) { sugEl.style.display = 'none'; return; }
      sugEl.style.display = 'block';
      data.results.forEach(c => {
        const d = document.createElement('div');
        d.className = 'sug-item';
        d.textContent = [c.name, c.admin1, c.country].filter(Boolean).join(', ');
        d.onclick = () => {
          srchEl.value = c.name;
          sugEl.style.display = 'none';
          selectCity(c.latitude, c.longitude, d.textContent);
        };
        sugEl.appendChild(d);
      });
    } catch(e) { if (e.name !== 'AbortError') console.error(e); }
  }, 300);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.srch-wrap')) sugEl.style.display = 'none';
});

function selectCity(lat, lon, name) {
  activeCity = { lat, lon, name };
  getWeather();
  clearInterval(refTimer);
  refTimer = setInterval(getWeather, 10 * 60 * 1000);
}

/* ── WEATHER FETCH ── */
async function getWeather() {
  if (!activeCity) return;
  const { lat, lon, name } = activeCity;
  showStatus('Loading live weather…', 'loading');

  const p = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: 'auto',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index,visibility,rain,surface_pressure,is_day,cloud_cover'
  });

  try {
    const res  = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
    if (!res.ok) throw new Error('Could not fetch weather data.');
    const data = await res.json();
    const cur  = data.current;
    if (!cur) throw new Error('Weather data unavailable for this location.');
    hideStatus();

    const isDay = cur.is_day === 1;
    applyTheme(wClass(cur.weather_code, isDay), cur.temperature_2m);

    document.getElementById('w-city').textContent  = name;
    document.getElementById('w-badge').textContent = isDay ? 'Day' : 'Night';
    document.getElementById('w-cond').textContent  = wLabel(cur.weather_code);
    document.getElementById('w-temp').textContent  = fmt(Math.round(cur.temperature_2m), '°C');
    document.getElementById('w-upd').textContent   = `Updated: ${localTime(cur.time, data.timezone)}`;
    document.getElementById('w-hum').textContent   = fmt(Math.round(cur.relative_humidity_2m), '%');
    document.getElementById('w-wind').textContent  = fmt(Math.round(cur.wind_speed_10m), ' km/h');
    document.getElementById('w-uv').textContent    = fmt(cur.uv_index?.toFixed(1), '');
    document.getElementById('w-rain').textContent  = fmt(cur.rain?.toFixed(1), ' mm');
    document.getElementById('w-vis').textContent   = cur.visibility
      ? fmt(Math.round(cur.visibility / 1000), ' km') : '—';
    document.getElementById('w-pres').textContent  = fmt(Math.round(cur.surface_pressure), ' hPa');

    const wc = document.getElementById('wcard');
    wc.style.display    = 'block';
    wc.style.animation  = 'none';
    void wc.offsetWidth;
    wc.style.animation  = 'fadeUp .65s ease';

  } catch(e) {
    showStatus(e.message || 'Something went wrong. Please try again.', 'error');
  }
}

/* ── INIT ── */
buildStars();
buildClouds(0);
buildFog(0);
buildRain(0, false);
buildSnow(0);
applyTheme('cnight', null);
