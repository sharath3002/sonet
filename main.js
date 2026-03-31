// ===== Simple 3D tilt interaction for cards =====
const tiltCards = document.querySelectorAll("[data-tilt]");

tiltCards.forEach((card) => {
  const strength = 14;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateY = ((x - midX) / midX) * strength;
    const rotateX = -((y - midY) / midY) * strength;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    card.style.boxShadow = "0 26px 60px rgba(0,0,0,0.95)";
    card.style.borderColor = "rgba(108,255,77,0.7)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
    card.style.boxShadow = "0 18px 40px rgba(0,0,0,0.8)";
    card.style.borderColor = "rgba(255,255,255,0.08)";
  });
});

// ===== Transmitter X915-Neo slideshow (dark glass frame) =====
const txLayer = document.querySelector(".product-photo-layer");

if (txLayer) {
  // Replace these placeholders with your actual TX render paths
  const txImages = [
    "assets/rx.png",
    "assets/tx.png",
    "assets/working.png"
  ];
  let txIndex = 0;

  const showTxImage = () => {
    // Reset visibility to retrigger transition
    txLayer.classList.remove("is-visible");
    // force reflow to restart CSS transition
    void txLayer.offsetWidth;

    txLayer.style.backgroundImage = `url('${txImages[txIndex]}')`;
    txLayer.classList.add("is-visible");

    txIndex = (txIndex + 1) % txImages.length;
  };

  showTxImage();
  setInterval(showTxImage, 5000); // change every 5 seconds
}


    // ============ STARS ============
    const starsEl = document.getElementById('stars');
    for (let i = 0; i < 120; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2.5 + 0.5;
      s.style.cssText = `
        width:${size}px; height:${size}px;
        top:${Math.random()*80}%;
        left:${Math.random()*100}%;
        --d:${1.5 + Math.random()*3}s;
        animation-delay:${Math.random()*4}s;
      `;
      starsEl.appendChild(s);
    }

    // ============ FLOATING PARTICLES ============
    const hero = document.getElementById('heroScene');
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random()*3 + 1;
      const colors = ['rgba(0,207,255,0.4)','rgba(0,255,136,0.3)','rgba(255,200,50,0.25)'];
      p.style.cssText = `
        width:${size}px; height:${size}px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        bottom:${Math.random()*25}%;
        left:${Math.random()*100}%;
        --pd:${3+Math.random()*6}s;
        --px:${(Math.random()-0.5)*60}px;
        animation-delay:${Math.random()*8}s;
      `;
      hero.appendChild(p);
    }

    // ============ STATE ============
    let controlON = false;
    let hornActive = false;
    let audioCtx = null;
    let hornNodes = [];

    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }

    // ============ HORN SOUND ============
    function startHornSound() {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      // Create layered horn tones
      const freqs = [370, 440, 554];
      hornNodes = freqs.map(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const dist = ctx.createWaveShaper();

        // Distortion curve
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2 / 256) - 1;
          curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        dist.curve = curve;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(f * 1.02, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.03);

        osc.connect(dist);
        dist.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        return { osc, gain };
      });
    }

    function stopHornSound() {
      if (!audioCtx) return;
      hornNodes.forEach(({ osc, gain }) => {
        gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
        setTimeout(() => { try { osc.stop(); } catch(e){} }, 100);
      });
      hornNodes = [];
    }

    // ============ HORN BUTTON ============
    function pressHorn() {
      const btn = document.getElementById('hornBtn');
      btn.classList.add('pressing');

      // Ripple
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.cssText = 'width:60px;height:60px;top:50%;left:50%;margin:-30px 0 0 -30px;';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      if (controlON) {
        // Blocked!
        showToast('🛡️  Horn blocked by SONET');
        btn.classList.add('blocked');
        // Show X / mute animation on sound waves — stay off
        return;
      }

      // Play horn
      hornActive = true;
      startHornSound();
      document.getElementById('soundWaves').classList.add('active');
      document.getElementById('hornFlash').classList.add('active');
      setTimeout(() => document.getElementById('hornFlash').classList.remove('active'), 80);
    }

    function releaseHorn() {
      const btn = document.getElementById('hornBtn');
      btn.classList.remove('pressing', 'blocked');
      if (hornActive) {
        stopHornSound();
        hornActive = false;
        document.getElementById('soundWaves').classList.remove('active');
      }
    }

    // ============ TOGGLE CONTROL ============
    function toggleControl() {
      controlON = !controlON;
      const btn = document.getElementById('toggleBtn');
      const status = document.getElementById('toggleStatus');
      const panel = document.getElementById('panelBox');

      btn.classList.toggle('on', controlON);
      status.textContent = controlON ? 'ON' : 'OFF';
      status.classList.toggle('on', controlON);
      panel.classList.toggle('active', controlON);

      showToast(controlON
        ? '🟢  SONET Active — Horn control enabled'
        : '🔴  SONET Inactive — Horn control disabled'
      );

      // If horn was playing, mute it when turning ON
      if (controlON && hornActive) {
        stopHornSound();
        hornActive = false;
        document.getElementById('soundWaves').classList.remove('active');
      }
    }

    // ============ TOAST ============
    let toastTimer;
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ============ CAR LOOP (5s delay on each cycle) ============
    // CSS handles 8s travel + we add a 5s pause via animation-delay on loop
    // We use JS to restart animation with 5s gap
    const carWrap = document.getElementById('carWrap');
    // CSS animation: delay 5s before first pass, then repeats with 8s duration
    // To add pause between passes, we use animation with timing trick:
    // Total cycle = 13s: 8s driving, 5s pause (achieved by extending keyframes)
    carWrap.style.animation = 'none';
    carWrap.style.animation = 'carDriveCycle 13s linear infinite';

    // Inject updated keyframe with pause built in
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes carDriveCycle {
        0%    { left: -160px; }
        61.5% { left: calc(100% + 20px); }
        61.6% { left: -160px; }
        100%  { left: -160px; }
      }
    `;
    document.head.appendChild(styleEl);



    document.querySelector("form").addEventListener("submit", function () {
  alert("Thank you! Your response has been submitted.");
});



