// ===== Event Bus =====
// Central event system for inter-module communication
(function(){
  'use strict';

  const listeners = {};

  window.EventBus = {
    on(event, fn){
      if(!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
      return ()=> this.off(event, fn);
    },
    off(event, fn){
      if(!listeners[event]) return;
      listeners[event] = listeners[event].filter(f=> f !== fn);
    },
    emit(event, data){
      if(!listeners[event]) return;
      listeners[event].forEach(fn=> fn(data));
    },
    once(event, fn){
      const off = this.on(event, (data)=>{
        fn(data);
        off();
      });
      return off;
    }
  };
})();
