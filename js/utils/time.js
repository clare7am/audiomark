// ===== Time Utilities =====
(function(){
  'use strict';

  window.TimeUtils = {
    /**
     * Format seconds to display string
     * @param {number} sec - time in seconds
     * @param {boolean} showMs - whether to show milliseconds
     * @returns {string} formatted time string
     */
    format(sec, showMs=false){
      if(isNaN(sec) || sec < 0) return showMs ? '00:00.000' : '00:00';
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      if(showMs) return String(m).padStart(2,'0') + ':' + s.toFixed(3).padStart(6,'0');
      return String(m).padStart(2,'0') + ':' + Math.floor(s).toString().padStart(2,'0');
    },

    /**
     * Parse time string back to seconds (for input)
     * @param {string} str - "MM:SS" or "MM:SS.mmm"
     * @returns {number} time in seconds
     */
    parse(str){
      const parts = str.split(':');
      if(parts.length !== 2) return 0;
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
  };
})();
