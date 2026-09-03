// ===== Module Registry =====
// Central module registration and lifecycle management
// Modules can be enabled/disabled in config.json "modules" array
(function(){
  'use strict';

  const registry = {};
  const activeModules = {};

  window.ModuleRegistry = {
    /**
     * Register a module
     * @param {string} name - module identifier
     * @param {Object} mod - module object with init(), destroy(), and optional dependsOn[]
     */
    register(name, mod){
      registry[name] = mod;
    },

    /**
     * Initialize enabled modules
     * @param {string[]} enabled - list of enabled module names
     */
    initAll(enabled=[]){
      const enabledSet = new Set(enabled);
      // Sort by dependencies
      const sorted = this._sortByDeps(registry, enabledSet);

      for(const name of sorted){
        const mod = registry[name];
        if(!mod) continue;
        try {
          mod.init();
          activeModules[name] = mod;
          console.log(`[Module] ${name} initialized`);
        } catch(e){
          console.error(`[Module] Failed to init ${name}:`, e);
        }
      }
    },

    /**
     * Destroy a specific module
     */
    destroy(name){
      if(activeModules[name]){
        try { activeModules[name].destroy?.(); } catch(e){}
        delete activeModules[name];
      }
    },

    /**
     * Check if a module is active
     */
    isActive(name){
      return !!activeModules[name];
    },

    /**
     * Get active module instance
     */
    get(name){
      return activeModules[name] || null;
    },

    // Internal: topological sort by dependencies
    _sortByDeps(registry, enabledSet){
      const names = Object.keys(registry).filter(n => enabledSet.has(n));
      const visited = new Set();
      const result = [];

      function visit(name){
        if(visited.has(name)) return;
        visited.add(name);
        const mod = registry[name];
        if(mod.dependsOn){
          mod.dependsOn.forEach(dep=>{
            if(enabledSet.has(dep)) visit(dep);
          });
        }
        result.push(name);
      }

      names.forEach(visit);
      return result;
    }
  };
})();
