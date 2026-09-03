// ===== Player Module =====
// Audio playback controls: play/pause, seek, speed
(function(){
  'use strict';

  let audio;  // <audio> element reference

  function getAudio(){
    if(!audio) audio = document.getElementById('audio');
    return audio;
  }

  function init(){
    audio = getAudio();
    if(!audio){
      console.error('[Player] <audio> element not found');
      return;
    }
    bindControls();
    bindAudioEvents();
  }

  function destroy(){
    // Remove event listeners if needed
  }

  function bindControls(){
    const btnPlay = $('btn-play');
    const btnPrev = $('btn-prev');
    const btnNext = $('btn-next');
    const progressWrap = $('progress-wrap');

    if(btnPlay) btnPlay.addEventListener('click', togglePlay);
    if(btnPrev) btnPrev.addEventListener('click', ()=> seek(-10));
    if(btnNext) btnNext.addEventListener('click', ()=> seek(10));

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        setSpeed(parseFloat(btn.dataset.speed));
      });
    });

    // Progress bar seek
    if(progressWrap){
      let isDragging = false;
      const seekFromEvent = (e)=>{
        const rect = progressWrap.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        const pct = Math.max(0, Math.min(1, x/rect.width));
        if(audio.duration) audio.currentTime = pct * audio.duration;
      };
      progressWrap.addEventListener('mousedown', e=>{
        isDragging=true;
        seekFromEvent(e);
      });
      document.addEventListener('mousemove', e=>{ if(isDragging) seekFromEvent(e); });
      document.addEventListener('mouseup', ()=>{ isDragging=false; });
      progressWrap.addEventListener('touchstart', e=>{ isDragging=true; seekFromEvent(e); }, {passive:true});
      document.addEventListener('touchmove', e=>{ if(isDragging) seekFromEvent(e); }, {passive:true});
      document.addEventListener('touchend', ()=>{ isDragging=false; });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e=>{
      if(e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT') return;
      switch(e.code){
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(-5);
          break;
        case 'ArrowRight':
          seek(5);
          break;
      }
    });
  }

  function bindAudioEvents(){
    audio.addEventListener('play', ()=>{
      $('icon-play').style.display='none';
      $('icon-pause').style.display='block';
      AppState.set('playing', true);
    });
    audio.addEventListener('pause', ()=>{
      $('icon-play').style.display='block';
      $('icon-pause').style.display='none';
      AppState.set('playing', false);
    });
    audio.addEventListener('timeupdate', ()=>{
      updateProgress();
    });
    audio.addEventListener('loadedmetadata', ()=>{
      $('time-total').textContent = TimeUtils.format(audio.duration);
      EventBus.emit('player:metadata', {duration: audio.duration});
    });
    audio.addEventListener('ended', ()=>{
      $('icon-play').style.display='block';
      $('icon-pause').style.display='none';
      AppState.set('playing', false);
      $('progress-fill').style.width = '100%';
      EventBus.emit('player:ended');
    });
  }

  function togglePlay(){
    const a = getAudio();
    if(!a || !a.src) return;
    if(a.paused) a.play(); else a.pause();
  }

  function seek(offset){
    const a = getAudio();
    if(!a || !a.src || !a.duration) return;
    a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + offset));
  }

  function setSpeed(rate){
    const a = getAudio();
    if(!a) return;
    a.playbackRate = rate;
    AppState.set('speed', rate);
    document.querySelectorAll('.speed-btn').forEach(b=>{
      b.classList.toggle('active', parseFloat(b.dataset.speed)===rate);
    });
  }

  function updateProgress(){
    if(!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    $('progress-fill').style.width = pct + '%';
    $('time-current').textContent = TimeUtils.format(audio.currentTime);
    requestAnimationFrame(updateProgress);
  }

  // Public API
  window.PlayerModule = {
    init, destroy,
    getAudio: ()=> getAudio(),
    togglePlay,
    seek,
    setSpeed,
    // Load a new audio source
    load(url){
      const a = getAudio();
      if(!a) return;
      a.src = url;
      a.load();
      $('icon-play').style.display='block';
      $('icon-pause').style.display='none';
      $('progress-fill').style.width = '0%';
      $('time-current').textContent = '00:00';
      $('time-total').textContent = '00:00';
    },
    // Seek to specific time
    seekTo(time){
      const a = getAudio();
      if(a && a.src) a.currentTime = time;
    },
    // Get current time
    currentTime(){ const a = getAudio(); return a ? a.currentTime : 0; }
  };

  ModuleRegistry.register('player', window.PlayerModule);
})();
